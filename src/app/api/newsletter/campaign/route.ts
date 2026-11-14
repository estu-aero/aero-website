import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { requireAdmin } from '@/lib/auth/require-admin';

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

    const results = await Promise.allSettled(
      emails.map((email) =>
        resend!.emails.send({ from: EMAIL_FROM, to: [email], subject, html })
      )
    );

    // Resend hata durumunda reddetmez, { error } döndürür
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && !r.value.error
    ).length;

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
