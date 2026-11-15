import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { bultenAlanlari } from '@/lib/unsubscribe';
import {
  resend,
  isResendConfigured,
  EMAIL_FROM,
  getEventEmailTemplate,
} from '@/lib/resend';

// Resend tek istekte en fazla 100 mail kabul eder
const BATCH_SIZE = 100;

type Dilli = { tr?: string; en?: string } | undefined;
const dilde = (deger: Dilli, dil: 'tr' | 'en') => (deger?.[dil] || deger?.tr || '').trim();

// Bir etkinliği bülten abonelerine duyurur. Sadece adminler çağırabilir.
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

    const eventRef = adminDb.collection('events').doc(id);
    const eventDoc = await eventRef.get();
    const event = eventDoc.data();
    if (!eventDoc.exists || !event) {
      return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    const subscribers = await adminDb.collection('newsletter').get();
    const emails = subscribers.docs
      .map((doc) => doc.data())
      .filter((data) => typeof data.email === 'string')
      .map((data) => {
        const dil = data.locale === 'en' ? 'en' : 'tr';
        const template = getEventEmailTemplate(dil, {
          slug: String(event.slug || ''),
          title: dilde(event.title, dil),
          description: dilde(event.description, dil),
          location: dilde(event.location, dil),
          date: String(event.date || ''),
          time: String(event.time || ''),
          imageUrl: typeof event.image === 'string' ? event.image : '',
          registrationUrl: typeof event.registrationUrl === 'string' ? event.registrationUrl : '',
        });
        return {
          from: EMAIL_FROM,
          to: [data.email as string],
          subject: template.subject,
          ...bultenAlanlari(template.html, data.email as string, data.locale === 'en' ? 'en' : 'tr'),
        };
      });

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Bülten abonesi bulunamadı.' }, { status: 400 });
    }

    let sent = 0;
    for (let start = 0; start < emails.length; start += BATCH_SIZE) {
      const batch = emails.slice(start, start + BATCH_SIZE);
      const { error } = await resend.batch.send(batch);
      if (error) {
        console.error('Event announce batch error:', error);
      } else {
        sent += batch.length;
      }
    }

    if (sent > 0) {
      await eventRef.update({
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
    console.error('Event announce error:', error);
    return NextResponse.json({ error: 'Duyuru gönderilemedi.' }, { status: 500 });
  }
}
