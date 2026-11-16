import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getMagazineEmailTemplate } from '@/lib/resend';
import { bultenGonder } from '@/lib/newsletter';
import { MAGAZINE_COLLECTION } from '@/lib/magazine';

// Yayındaki bir dergi sayısını onaylı bülten abonelerine duyurur. Sadece adminler çağırabilir.
// Bir seferde en fazla 100 kişiye gönderir; tekrar çağrılınca yalnızca henüz almamış abonelere devam eder.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await request.json();
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const issueRef = adminDb.collection(MAGAZINE_COLLECTION).doc(id);
    const issueDoc = await issueRef.get();
    const issue = issueDoc.data();
    if (!issueDoc.exists || !issue) {
      return NextResponse.json({ error: 'Sayı bulunamadı.' }, { status: 404 });
    }
    if (issue.status !== 'published') {
      return NextResponse.json(
        { error: 'Sadece yayındaki sayılar duyurulabilir.' },
        { status: 400 }
      );
    }

    const sonuc = await bultenGonder(`magazine_${id}`, (abone) =>
      getMagazineEmailTemplate(abone.locale, {
        number: issue.number,
        title: (abone.locale === 'en' && issue.titleEn) || issue.title,
        description: (abone.locale === 'en' && issue.descriptionEn) || issue.description || '',
        coverUrl: issue.coverUrl,
      })
    );

    if (sonuc.total === 0) {
      return NextResponse.json({ error: 'Onaylı bülten abonesi bulunamadı.' }, { status: 400 });
    }
    if (sonuc.error) {
      return NextResponse.json({ ...sonuc, success: false }, { status: 502 });
    }

    if (sonuc.sent > 0) {
      await issueRef.update({
        announcedAt: FieldValue.serverTimestamp(),
        announcedCount: sonuc.total - sonuc.remaining,
      });
    }

    return NextResponse.json({ ...sonuc, success: true });
  } catch (error) {
    console.error('Magazine announce error:', error);
    return NextResponse.json(
      { error: 'Duyuru gönderilemedi.' },
      { status: 500 }
    );
  }
}
