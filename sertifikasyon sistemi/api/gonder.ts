import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { gonderimHatasi, PARTI_SINIRI } from '@/lib/newsletter';
import { sertifikaMaili } from '../lib/mail';
import { kimlikTemizle } from '../lib/kimlik';
import { SERTIFIKA_KOLEKSIYONU, GRUP_KOLEKSIYONU, EPOSTA_KOLEKSIYONU } from '../lib/tipler';

const istekSemasi = z.object({
  eventId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  // Verilirse yalnızca bu sertifikanın maili gönderilir (daha önce gönderilmiş olsa bile)
  certificateId: z.string().min(1).max(40).optional(),
});

// Bir gruptaki sertifikaları sahiplerine mail ile gönderir.
// Mailin gittiği her sertifika işaretlenir (certificate_emails.mailSentAt); bir seferde en fazla 100 mail gider
// ve tekrar çağrılınca yalnızca henüz gönderilmemiş olanlara devam edilir. Kimse aynı maili iki kez almaz.
// certificateId verilirse tek bir sertifikanın maili (yeniden) gönderilir.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  if (!ayrisma.success) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const { eventId } = ayrisma.data;
  const tekKimlik = ayrisma.data.certificateId ? kimlikTemizle(ayrisma.data.certificateId) : null;
  if (ayrisma.data.certificateId && !tekKimlik) {
    return NextResponse.json({ error: 'Geçersiz sertifika kimliği.' }, { status: 400 });
  }

  if (!isResendConfigured || !resend) {
    return NextResponse.json({ error: 'Mail servisi (Resend) ayarlı değil.' }, { status: 500 });
  }

  try {
    const grupRef = adminDb.collection(GRUP_KOLEKSIYONU).doc(eventId);
    if (!(await grupRef.get()).exists) {
      return NextResponse.json({ error: 'Sertifika grubu bulunamadı.' }, { status: 404 });
    }

    const [sertifikalar, epostalar] = await Promise.all([
      adminDb.collection(SERTIFIKA_KOLEKSIYONU).where('eventId', '==', eventId).get(),
      adminDb.collection(EPOSTA_KOLEKSIYONU).where('eventId', '==', eventId).get(),
    ]);
    const epostaHaritasi = new Map(epostalar.docs.map((d) => [d.id, d.data()]));
    const gonderilmis = (id: string) => Boolean(epostaHaritasi.get(id)?.mailSentAt);

    const adaylar = sertifikalar.docs.filter((d) => typeof epostaHaritasi.get(d.id)?.email === 'string');
    const total = adaylar.length;
    if (total === 0) {
      return NextResponse.json({ error: 'Gönderilecek sertifika bulunamadı.' }, { status: 400 });
    }

    const bekleyen = adaylar.filter((d) => !gonderilmis(d.id));
    const hedef = tekKimlik ? adaylar.filter((d) => d.id === tekKimlik) : bekleyen.slice(0, PARTI_SINIRI);
    if (tekKimlik && hedef.length === 0) {
      return NextResponse.json({ error: 'Sertifika bu grupta bulunamadı.' }, { status: 404 });
    }
    if (hedef.length === 0) {
      return NextResponse.json({ success: true, sent: 0, remaining: 0, total });
    }

    const { error } = await resend.batch.send(
      hedef.map((d) => {
        const veri = d.data();
        const mail = sertifikaMaili({
          isim: veri.name,
          etkinlik: veri.eventName,
          tarih: veri.date,
          kimlik: d.id,
          sablon: veri.template,
        });
        return {
          from: EMAIL_FROM,
          to: [epostaHaritasi.get(d.id)!.email as string],
          subject: mail.konu,
          html: mail.html,
          text: mail.metin,
        };
      })
    );
    if (error) {
      console.error('Certificate mail batch error:', error);
      return NextResponse.json(
        { success: false, error: gonderimHatasi(error.message), sent: 0, remaining: bekleyen.length, total },
        { status: 502 }
      );
    }

    const ilkKezGonderilen = hedef.filter((d) => !gonderilmis(d.id)).length;
    const toplamGonderilen = total - bekleyen.length + ilkKezGonderilen;

    const yazim = adminDb.batch();
    for (const d of hedef) {
      yazim.update(adminDb.collection(EPOSTA_KOLEKSIYONU).doc(d.id), { mailSentAt: FieldValue.serverTimestamp() });
    }
    yazim.update(grupRef, { sentAt: FieldValue.serverTimestamp(), sentCount: toplamGonderilen });
    await yazim.commit();

    return NextResponse.json({
      success: true,
      sent: hedef.length,
      remaining: total - toplamGonderilen,
      total,
    });
  } catch (hata) {
    console.error('Certificate send error:', hata);
    return NextResponse.json({ error: 'Mailler gönderilemedi.' }, { status: 500 });
  }
}
