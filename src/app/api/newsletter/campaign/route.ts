import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { bultenGonder } from '@/lib/newsletter';
import { SITE } from '@/config/site';

// Her duyurunun altına eklenen satır; mailto bağlantısı gönderimde kişisel çıkış bağlantısıyla değişir
const CIKIS_SATIRI = `<p style="margin-top:32px;font-size:12px;color:#9CA3AF;text-align:center">${SITE.fullName.tr} · Bu e-postaları almak istemiyorsanız <a href="mailto:${SITE.email}?subject=abonelik" style="color:#B0182A">abonelikten çıkın</a>.</p>`;

const campaignSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(200_000),
});

// Serbest bülten duyurusu: onaylı abonelere gider; sadece adminler çağırabilir.
// Bir seferde en fazla 100 kişiye gönderir. Aynı konu ve içerikle tekrar çağrılınca
// yalnızca henüz almamış abonelere devam eder.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek: konu ve içerik gerekli.' }, { status: 400 });
    }
    const { subject, html } = parsed.data;

    // Aynı konu + içerik aynı duyuru sayılır (sayfa yenilense de kaldığı yerden devam eder)
    const anahtar = `campaign_${createHash('sha256').update(`${subject}\n${html}`).digest('hex').slice(0, 32)}`;
    const sonuc = await bultenGonder(anahtar, () => ({ subject, html: html + CIKIS_SATIRI }));

    if (sonuc.total === 0) {
      return NextResponse.json({ error: 'Onaylı bülten abonesi bulunamadı.' }, { status: 400 });
    }
    if (sonuc.error) {
      return NextResponse.json({ ...sonuc, success: false }, { status: 502 });
    }
    return NextResponse.json({ ...sonuc, success: true });
  } catch (error) {
    console.error('Newsletter campaign error:', error);
    return NextResponse.json({ error: 'Duyuru gönderilemedi.' }, { status: 500 });
  }
}
