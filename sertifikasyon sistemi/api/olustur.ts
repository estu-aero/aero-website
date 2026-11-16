import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { put, del } from '@vercel/blob';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { SITE } from '@/config/site';
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

const ALAN_ADLARI: Record<string, string> = {
  eventName: 'Etkinlik adı (2-150 karakter)',
  eventNameEn: 'İngilizce etkinlik adı (en fazla 150 karakter)',
  date: 'Tarih (YYYY-AA-GG)',
  text: 'Sertifika metni (5-600 karakter)',
  template: 'Şablon',
  name: 'ad soyad (2-120 karakter)',
  email: 'e-posta',
};

// Doğrulama hatasını admin için anlaşılır hale getirir: hangi alan, hangi katılımcı
function hataAciklamasi(
  sorunlar: { path: PropertyKey[] }[],
  govde: { participants?: { name?: unknown; email?: unknown }[] } | null
) {
  const yol = sorunlar[0]?.path ?? [];
  if (yol[0] === 'participants' && typeof yol[1] === 'number') {
    const k = govde?.participants?.[yol[1]];
    const alan = ALAN_ADLARI[String(yol[2])] ?? 'bilgileri';
    const deger = String((yol[2] === 'email' ? k?.email : k?.name) ?? '').slice(0, 80);
    return `"${String(k?.name ?? '').slice(0, 60)}" adlı katılımcının ${alan} geçersiz: "${deger}". Listeyi kontrol edin.`;
  }
  if (yol[0] === 'participants') return 'Katılımcı listesi boş ya da çok uzun.';
  if (yol[0] === 'event') return `Geçersiz alan: ${ALAN_ADLARI[String(yol[1])] ?? String(yol[1])}.`;
  return 'Geçersiz istek. Katılımcı bilgilerini kontrol edin.';
}

// Bir parti sertifika oluşturur: PDF üretir, Vercel Blob'a yükler, kayıtları yazar.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  // Sertifikaya doğrulama adresi basılır ve sonradan değiştirilemez; alan adı girilmeden üretim yapılmaz
  if (SITE.url.includes('example.com')) {
    return NextResponse.json(
      { error: 'Sitenin alan adı henüz ayarlanmadı (src/config/site.ts → url). Sertifikalar alan adı girildikten sonra oluşturulabilir.' },
      { status: 400 }
    );
  }

  const govde = await request.json().catch(() => null);
  const ayrisma = istekSemasi.safeParse(govde);
  if (!ayrisma.success) {
    return NextResponse.json({ error: hataAciklamasi(ayrisma.error.issues, govde) }, { status: 400 });
  }
  const { participants } = ayrisma.data;

  // Hata olursa temizlik için: bu istekte açılan grup ve oluşan sertifika sayısı
  let yeniGrupId: string | null = null;
  let olusanSayisi = 0;

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
      yeniGrupId = yeni.id;
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
      try {
        await yazim.commit();
      } catch (hata) {
        // Kayıt yazılamadıysa az önce yüklenen PDF depoda sahipsiz kalmasın
        await del(dosya.url).catch(() => {});
        throw hata;
      }
      olusanSayisi += 1;

      olusanlar.push({ id: kimlik, name: katilimci.name, email: katilimci.email, pdfUrl: dosya.url });
    }

    return NextResponse.json({ eventId, created: olusanlar });
  } catch (hata) {
    console.error('Certificate generate error:', hata);
    // Bu istekte açılan grupta hiç sertifika oluşmadıysa boş grup bırakılmaz
    if (yeniGrupId && olusanSayisi === 0) {
      await adminDb.collection(GRUP_KOLEKSIYONU).doc(yeniGrupId).delete().catch(() => {});
    }
    return NextResponse.json(
      { error: 'Sertifikalar oluşturulamadı. Depolama (Vercel Blob) ve veritabanı ayarlarını kontrol edin.' },
      { status: 500 }
    );
  }
}
