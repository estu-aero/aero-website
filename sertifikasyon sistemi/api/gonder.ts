import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { sertifikaMaili } from '../lib/mail';
import { SERTIFIKA_KOLEKSIYONU, GRUP_KOLEKSIYONU, EPOSTA_KOLEKSIYONU } from '../lib/tipler';

// Resend tek istekte en fazla 100 mail kabul eder
const PARTI = 100;

const istekSemasi = z.object({
  eventId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
});

// Bir gruptaki (iptal edilmemiş) tüm sertifikaları sahiplerine mail ile gönderir.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  if (!ayrisma.success) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const { eventId } = ayrisma.data;

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
    const epostaHaritasi = new Map(epostalar.docs.map((d) => [d.id, d.data().email as string]));

    const mailler = sertifikalar.docs
      .filter((d) => d.data().status !== 'revoked' && epostaHaritasi.has(d.id))
      .map((d) => {
        const veri = d.data();
        const mail = sertifikaMaili({
          isim: veri.name,
          etkinlik: veri.eventName,
          tarih: veri.date,
          kimlik: d.id,
          pdfUrl: veri.pdfUrl,
        });
        return {
          from: EMAIL_FROM,
          to: [epostaHaritasi.get(d.id)!],
          subject: mail.konu,
          html: mail.html,
          text: mail.metin,
        };
      });

    if (mailler.length === 0) {
      return NextResponse.json({ error: 'Gönderilecek sertifika bulunamadı.' }, { status: 400 });
    }

    let gonderilen = 0;
    for (let i = 0; i < mailler.length; i += PARTI) {
      const parti = mailler.slice(i, i + PARTI);
      const { error } = await resend.batch.send(parti);
      if (error) {
        console.error('Certificate mail batch error:', error);
      } else {
        gonderilen += parti.length;
      }
    }

    if (gonderilen > 0) {
      await grupRef.update({ sentAt: FieldValue.serverTimestamp(), sentCount: gonderilen });
    }

    return NextResponse.json({
      success: gonderilen > 0,
      sent: gonderilen,
      failed: mailler.length - gonderilen,
      total: mailler.length,
    });
  } catch (hata) {
    console.error('Certificate send error:', hata);
    return NextResponse.json({ error: 'Mailler gönderilemedi.' }, { status: 500 });
  }
}
