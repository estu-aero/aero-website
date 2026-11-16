import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { resend, getConfirmEmailTemplate, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { onayUrl, metneCevir } from '@/lib/unsubscribe';
import { ABONE_KOLEKSIYONU } from '@/lib/newsletter';

const subscribeSchema = z.object({
  email: z.email().max(254),
  locale: z.enum(['tr', 'en']),
});

// Aynı adrese onay maili en erken bu kadar süre sonra tekrar gönderilir
const TEKRAR_SURESI = 5 * 60 * 1000;
// Onaylanmayan kayıtlar bu süreden sonra silinir
const BEKLEME_SURESI = 7 * 24 * 60 * 60 * 1000;

// Onaylanmadan kalmış eski kayıtları siler (kişisel veri gereksiz yere tutulmasın)
async function eskiBekleyenleriSil() {
  try {
    const bekleyenler = await adminDb
      .collection(ABONE_KOLEKSIYONU)
      .where('status', '==', 'pending')
      .limit(50)
      .get();
    const sinir = Date.now() - BEKLEME_SURESI;
    await Promise.all(
      bekleyenler.docs
        .filter((d) => (d.data().subscribedAt?.toMillis?.() ?? Date.now()) < sinir)
        .map((d) => d.ref.delete())
    );
  } catch (hata) {
    console.error('Pending subscriber cleanup error:', hata);
  }
}

// Bültene abone olma: adres "onay bekliyor" olarak kaydedilir ve onay maili gönderilir.
// Kişi maildeki bağlantıyı onaylayana kadar hiçbir duyuru almaz (/api/newsletter/confirm).
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

    const koleksiyon = adminDb.collection(ABONE_KOLEKSIYONU);
    const snapshot = await koleksiyon.where('email', '==', normalizedEmail).limit(1).get();
    const mevcut = snapshot.docs[0];

    // Zaten onaylı abone (status alanı olmayan eski kayıtlar onaylı sayılır)
    if (mevcut && mevcut.data().status !== 'pending') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 409 });
    }

    // Onay bekleyen adrese kısa süre önce mail gittiyse tekrar gönderilmez
    if (mevcut) {
      const sonGonderim = mevcut.data().confirmSentAt?.toMillis?.() ?? 0;
      if (Date.now() - sonGonderim < TEKRAR_SURESI) {
        return NextResponse.json({ success: true, pending: true });
      }
    }

    if (!isResendConfigured || !resend) {
      console.warn('Resend is not configured - confirmation email cannot be sent');
      return NextResponse.json({ error: 'Mail service unavailable' }, { status: 503 });
    }

    // Önce mail gönderilir; gönderilemezse kayıt açılmaz (kişi onaylayamayacağı bir kayıtta kalmasın)
    const template = getConfirmEmailTemplate(locale, onayUrl(normalizedEmail, locale));
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [normalizedEmail],
      subject: template.subject,
      html: template.html,
      text: metneCevir(template.html),
    });
    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ error: 'Confirmation email could not be sent' }, { status: 502 });
    }

    if (mevcut) {
      await mevcut.ref.update({ locale, confirmSentAt: FieldValue.serverTimestamp() });
    } else {
      await koleksiyon.add({
        email: normalizedEmail,
        locale,
        status: 'pending',
        subscribedAt: FieldValue.serverTimestamp(),
        confirmSentAt: FieldValue.serverTimestamp(),
        source: 'footer',
      });
    }

    await eskiBekleyenleriSil();

    return NextResponse.json({ success: true, pending: true });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
