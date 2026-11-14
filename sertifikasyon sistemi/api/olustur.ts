import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sablonBul, PARTI_BOYUTU } from '../ayarlar';
import { kimlikUret } from '../lib/kimlik';
import { sertifikaUret, sablonVarMi } from '../lib/pdf-uret';
import { dogrulamaAdresi } from '../lib/mail';
import { SERTIFIKA_KOLEKSIYONU, GRUP_KOLEKSIYONU, EPOSTA_KOLEKSIYONU } from '../lib/tipler';

const katilimciSemasi = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
});

const istekSemasi = z.object({
  // İlk partide grup bilgisi gönderilir, sonraki partilerde dönen eventId
  eventId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  event: z
    .object({
      eventName: z.string().trim().min(2).max(150),
      eventNameEn: z.string().trim().max(150).optional().default(''),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      text: z.string().trim().min(5).max(600),
      template: z.string().min(1).max(40),
    })
    .optional(),
  participants: z.array(katilimciSemasi).min(1).max(PARTI_BOYUTU),
});

// Bir parti sertifika oluşturur: PDF üretir, Vercel Blob'a yükler, kayıtları yazar.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  if (!ayrisma.success) {
    return NextResponse.json({ error: 'Geçersiz istek. Katılımcı bilgilerini kontrol edin.' }, { status: 400 });
  }
  const { participants } = ayrisma.data;

  try {
    // Grup: yoksa oluştur, varsa oku (metin ve şablon gruptan alınır, her partide aynı kalır)
    let eventId = ayrisma.data.eventId;
    let grup: { eventName: string; eventNameEn: string; date: string; text: string; template: string };

    if (eventId) {
      const belge = await adminDb.collection(GRUP_KOLEKSIYONU).doc(eventId).get();
      if (!belge.exists) {
        return NextResponse.json({ error: 'Sertifika grubu bulunamadı.' }, { status: 404 });
      }
      grup = belge.data() as typeof grup;
    } else {
      if (!ayrisma.data.event) {
        return NextResponse.json({ error: 'Etkinlik bilgisi eksik.' }, { status: 400 });
      }
      grup = ayrisma.data.event;
    }

    const sablon = sablonBul(grup.template);
    if (!sablon) {
      return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 400 });
    }
    if (!(await sablonVarMi(sablon.dosya))) {
      return NextResponse.json(
        { error: `Şablon dosyası yok: "sertifikasyon sistemi/sablonlar/${sablon.dosya}"` },
        { status: 400 }
      );
    }

    // Sabit tarihli türde (ör. kurucu üye) her zaman o tarih kaydedilir
    if (sablon.sabitTarih) grup = { ...grup, date: sablon.sabitTarih };

    if (!eventId) {
      const yeni = await adminDb.collection(GRUP_KOLEKSIYONU).add({
        ...grup,
        count: 0,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: admin.user.email ?? '',
      });
      eventId = yeni.id;
    }

    const olusanlar: { id: string; name: string; email: string; pdfUrl: string }[] = [];

    for (const katilimci of participants) {
      // Çakışma olasılığı yok denecek kadar düşük ama yine de kontrol edilir
      let kimlik = kimlikUret();
      while ((await adminDb.collection(SERTIFIKA_KOLEKSIYONU).doc(kimlik).get()).exists) {
        kimlik = kimlikUret();
      }

      const pdf = await sertifikaUret(sablon, {
        isim: katilimci.name,
        metin: grup.text,
        kimlik,
        dogrulamaAdresi: dogrulamaAdresi(kimlik),
      });

      const dosya = await put(`sertifikalar/${kimlik}.pdf`, Buffer.from(pdf), {
        access: 'public',
        contentType: 'application/pdf',
        // Dosya adına rastgele ek: kimliği bilen biri bile dosya adresini tahmin edemez
        addRandomSuffix: true,
      });

      const yazim = adminDb.batch();
      yazim.set(adminDb.collection(SERTIFIKA_KOLEKSIYONU).doc(kimlik), {
        name: katilimci.name,
        eventName: grup.eventName,
        eventNameEn: grup.eventNameEn || '',
        date: grup.date,
        pdfUrl: dosya.url,
        eventId,
        template: grup.template,
        status: 'valid',
        issuedAt: FieldValue.serverTimestamp(),
      });
      yazim.set(adminDb.collection(EPOSTA_KOLEKSIYONU).doc(kimlik), {
        email: katilimci.email.toLowerCase(),
        eventId,
      });
      yazim.update(adminDb.collection(GRUP_KOLEKSIYONU).doc(eventId), {
        count: FieldValue.increment(1),
      });
      await yazim.commit();

      olusanlar.push({ id: kimlik, name: katilimci.name, email: katilimci.email, pdfUrl: dosya.url });
    }

    return NextResponse.json({ eventId, created: olusanlar });
  } catch (hata) {
    console.error('Certificate generate error:', hata);
    return NextResponse.json(
      { error: 'Sertifikalar oluşturulamadı. Depolama (Vercel Blob) ve veritabanı ayarlarını kontrol edin.' },
      { status: 500 }
    );
  }
}
