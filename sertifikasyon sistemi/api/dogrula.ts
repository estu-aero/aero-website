import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { kimlikTemizle } from '../lib/kimlik';
import { SERTIFIKA_KOLEKSIYONU } from '../lib/tipler';

// Herkese açık doğrulama: GET /api/certificates/verify?id=AERO-XXXX-XXXX-XXXX
// Sadece ad soyad, etkinlik, tarih ve sertifika dosyası döner; e-posta asla dönmez.
export async function GET(request: NextRequest) {
  const sinir = rateLimit(`verify:${getClientIp(request)}`, 30, 60 * 1000);
  if (!sinir.allowed) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(sinir.retryAfter) } }
    );
  }

  const kimlik = kimlikTemizle(request.nextUrl.searchParams.get('id') || '');
  if (!kimlik) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  try {
    const belge = await adminDb.collection(SERTIFIKA_KOLEKSIYONU).doc(kimlik).get();
    const veri = belge.data();
    if (!belge.exists || !veri) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      id: kimlik,
      name: veri.name,
      eventName: veri.eventName,
      eventNameEn: veri.eventNameEn || '',
      date: veri.date,
      status: 'valid',
      pdfUrl: veri.pdfUrl,
    });
  } catch (hata) {
    console.error('Certificate verify error:', hata);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
