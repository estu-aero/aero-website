import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { resend, getWelcomeEmailTemplate, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { bultenAlanlari } from '@/lib/unsubscribe';

const subscribeSchema = z.object({
  email: z.email().max(254),
  locale: z.enum(['tr', 'en']),
});

export async function POST(request: NextRequest) {
  try {
    // Aynı adresten 10 dakikada en fazla 5 deneme
    const limit = rateLimit(`subscribe:${getClientIp(request)}`, 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A valid email and locale are required' },
        { status: 400 }
      );
    }
    const { locale } = parsed.data;
    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    const snapshot = await adminDb
      .collection('newsletter')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 409 }
      );
    }

    await adminDb.collection('newsletter').add({
      email: normalizedEmail,
      locale,
      subscribedAt: FieldValue.serverTimestamp(),
      source: 'footer',
    });

    let welcomeSent = false;
    if (isResendConfigured && resend) {
      try {
        const template = getWelcomeEmailTemplate(locale);
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [normalizedEmail],
          subject: template.subject,
          ...bultenAlanlari(template.html, normalizedEmail, locale),
        });

        if (error) {
          console.error('Resend API error:', error);
        } else {
          welcomeSent = true;
        }
      } catch (err) {
        console.error('Welcome email send error:', err);
      }
    } else {
      console.warn('Resend is not configured - email will not be sent');
    }

    return NextResponse.json({ success: true, welcomeSent });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
