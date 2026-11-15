import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { requireAdmin } from '@/lib/auth/require-admin';

const BATCH_SIZE = 100;

const campaignSchema = z.object({
  emails: z.array(z.email()).min(1).max(1000),
  subject: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(200_000),
});

// Bülten gönderimi: sadece adminler çağırabilir.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Geçersiz istek: alıcı listesi, konu ve içerik gerekli.' },
        { status: 400 }
      );
    }
    const { emails, subject, html } = parsed.data;

    if (!isResendConfigured || !resend) {
      return NextResponse.json(
        { error: 'Resend is not configured' },
        { status: 500 }
      );
    }

    // Resend tek istekte en fazla 100 mail kabul eder; partiler sırayla gönderilir (hız sınırı)
    let successful = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE).map((email) => ({
        from: EMAIL_FROM,
        to: [email],
        subject,
        html,
      }));
      const { error } = await resend.batch.send(batch);
      if (error) {
        console.error('Newsletter campaign batch error:', error);
      } else {
        successful += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: emails.length - successful,
      total: emails.length,
    });
  } catch (error) {
    console.error('Newsletter campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign emails' },
      { status: 500 }
    );
  }
}
