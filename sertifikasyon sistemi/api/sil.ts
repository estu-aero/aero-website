import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { del } from '@vercel/blob';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { kimlikTemizle } from '../lib/kimlik';
import { SERTIFIKA_KOLEKSIYONU, EPOSTA_KOLEKSIYONU, GRUP_KOLEKSIYONU } from '../lib/tipler';

const istekSemasi = z.object({ id: z.string().min(1).max(40) });

// Bir sertifikayı kalıcı olarak siler: PDF depodan (Vercel Blob), kayıt ve e-posta Firestore'dan.
// Silinen sertifika doğrulama sayfasında "bulunamadı" görünür. Geri alınamaz.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  const kimlik = ayrisma.success ? kimlikTemizle(ayrisma.data.id) : null;
  if (!kimlik) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  try {
    const ref = adminDb.collection(SERTIFIKA_KOLEKSIYONU).doc(kimlik);
    const belge = await ref.get();
    if (!belge.exists) {
      return NextResponse.json({ error: 'Sertifika bulunamadı.' }, { status: 404 });
    }
    const veri = belge.data()!;

    // Önce PDF'i depodan sil; dosya zaten yoksa kaydı silmeye devam et
    if (typeof veri.pdfUrl === 'string' && veri.pdfUrl) {
      try {
        await del(veri.pdfUrl);
      } catch (hata) {
        console.error('Certificate blob delete error:', hata);
      }
    }

    const yazim = adminDb.batch();
    yazim.delete(ref);
    yazim.delete(adminDb.collection(EPOSTA_KOLEKSIYONU).doc(kimlik));

    // Gruptaki son sertifika silindiyse grup da kalıcı olarak silinir
    let grupSilindi = false;
    if (typeof veri.eventId === 'string' && veri.eventId) {
      const grupRef = adminDb.collection(GRUP_KOLEKSIYONU).doc(veri.eventId);
      if ((await grupRef.get()).exists) {
        const kalanlar = await adminDb
          .collection(SERTIFIKA_KOLEKSIYONU)
          .where('eventId', '==', veri.eventId)
          .limit(2)
          .get();
        const baskaVar = kalanlar.docs.some((d) => d.id !== kimlik);
        if (baskaVar) {
          yazim.update(grupRef, { count: FieldValue.increment(-1) });
        } else {
          yazim.delete(grupRef);
          grupSilindi = true;
        }
      }
    }
    await yazim.commit();

    return NextResponse.json({ success: true, grupSilindi });
  } catch (hata) {
    console.error('Certificate delete error:', hata);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}
