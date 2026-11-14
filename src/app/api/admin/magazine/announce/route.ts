import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  resend,
  isResendConfigured,
  EMAIL_FROM,
  getMagazineEmailTemplate,
} from '@/lib/resend';
import { MAGAZINE_COLLECTION } from '@/lib/magazine';

// Resend tek istekte en fazla 100 mail kabul eder
const BATCH_SIZE = 100;

// Yayındaki bir dergi sayısını bülten abonelerine duyurur. Sadece adminler çağırabilir.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await request.json();
    if (typeof id !== 'string' || !id || id.includes('/')) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    if (!isResendConfigured || !resend) {
      return NextResponse.json(
        { error: 'Mail servisi (Resend) ayarlı değil.' },
        { status: 500 }
      );
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

    const subscribers = await adminDb.collection('newsletter').get();
    const emails = subscribers.docs
      .map((doc) => doc.data())
      .filter((data) => typeof data.email === 'string')
      .map((data) => {
        const locale = data.locale === 'en' ? 'en' : 'tr';
        const template = getMagazineEmailTemplate(locale, {
          number: issue.number,
          title: (locale === 'en' && issue.titleEn) || issue.title,
          description:
            (locale === 'en' && issue.descriptionEn) || issue.description || '',
          coverUrl: issue.coverUrl,
        });
        return {
          from: EMAIL_FROM,
          to: [data.email as string],
          subject: template.subject,
          html: template.html,
        };
      });

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Bülten abonesi bulunamadı.' },
        { status: 400 }
      );
    }

    let sent = 0;
    for (let start = 0; start < emails.length; start += BATCH_SIZE) {
      const batch = emails.slice(start, start + BATCH_SIZE);
      const { error } = await resend.batch.send(batch);
      if (error) {
        console.error('Magazine announce batch error:', error);
      } else {
        sent += batch.length;
      }
    }

    if (sent > 0) {
      await issueRef.update({
        announcedAt: FieldValue.serverTimestamp(),
        announcedCount: sent,
      });
    }

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed: emails.length - sent,
      total: emails.length,
    });
  } catch (error) {
    console.error('Magazine announce error:', error);
    return NextResponse.json(
      { error: 'Duyuru gönderilemedi.' },
      { status: 500 }
    );
  }
}
