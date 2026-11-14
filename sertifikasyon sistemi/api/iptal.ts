import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { kimlikTemizle } from '../lib/kimlik';
import { SERTIFIKA_KOLEKSIYONU } from '../lib/tipler';

const istekSemasi = z.object({
  id: z.string().min(1).max(40),
  revoked: z.boolean(),
});

// Bir sertifikayı iptal eder veya iptali geri alır. İptal edilen sertifika doğrulama
// sayfasında "iptal edildi" olarak görünür; kayıt silinmez.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  const kimlik = ayrisma.success ? kimlikTemizle(ayrisma.data.id) : null;
  if (!ayrisma.success || !kimlik) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  try {
    const ref = adminDb.collection(SERTIFIKA_KOLEKSIYONU).doc(kimlik);
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: 'Sertifika bulunamadı.' }, { status: 404 });
    }
    await ref.update({
      status: ayrisma.data.revoked ? 'revoked' : 'valid',
      statusChangedAt: FieldValue.serverTimestamp(),
      statusChangedBy: admin.user.email ?? '',
    });
    return NextResponse.json({ success: true });
  } catch (hata) {
    console.error('Certificate revoke error:', hata);
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
  }
}
