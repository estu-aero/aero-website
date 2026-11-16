import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { del } from '@vercel/blob';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { SERTIFIKA_KOLEKSIYONU, EPOSTA_KOLEKSIYONU, GRUP_KOLEKSIYONU } from '../lib/tipler';

const istekSemasi = z.object({ eventId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/) });

// Bir sertifika grubunu tümüyle ve kalıcı olarak siler: gruptaki bütün sertifikaların PDF'leri depodan,
// sertifika ve e-posta kayıtları ile grubun kendisi veritabanından. Silinen kimlikler doğrulamada
// "bulunamadı" görünür. Geri alınamaz.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  if (!ayrisma.success) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const { eventId } = ayrisma.data;

  try {
    const grupRef = adminDb.collection(GRUP_KOLEKSIYONU).doc(eventId);
    if (!(await grupRef.get()).exists) {
      return NextResponse.json({ error: 'Sertifika grubu bulunamadı.' }, { status: 404 });
    }

    const [sertifikalar, epostalar] = await Promise.all([
      adminDb.collection(SERTIFIKA_KOLEKSIYONU).where('eventId', '==', eventId).get(),
      adminDb.collection(EPOSTA_KOLEKSIYONU).where('eventId', '==', eventId).get(),
    ]);

    // PDF'ler depodan silinir (silinemeyen olursa kayıt silmeye devam edilir)
    const pdfler = sertifikalar.docs
      .map((d) => d.data().pdfUrl)
      .filter((u): u is string => typeof u === 'string' && Boolean(u));
    for (let i = 0; i < pdfler.length; i += 100) {
      await del(pdfler.slice(i, i + 100)).catch((hata) => console.error('Certificate group blob delete error:', hata));
    }

    // Firestore toplu yazma en fazla 500 işlem alır
    const silinecekler = [...sertifikalar.docs, ...epostalar.docs].map((d) => d.ref);
    for (let i = 0; i < silinecekler.length; i += 400) {
      const yazim = adminDb.batch();
      silinecekler.slice(i, i + 400).forEach((ref) => yazim.delete(ref));
      await yazim.commit();
    }
    await grupRef.delete();

    return NextResponse.json({ success: true, deleted: sertifikalar.size });
  } catch (hata) {
    console.error('Certificate group delete error:', hata);
    return NextResponse.json({ error: 'Grup silinemedi.' }, { status: 500 });
  }
}
