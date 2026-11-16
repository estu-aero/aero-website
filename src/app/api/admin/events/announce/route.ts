import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getEventEmailTemplate } from '@/lib/resend';
import { bultenGonder } from '@/lib/newsletter';

type Dilli = { tr?: string; en?: string } | undefined;
const dilde = (deger: Dilli, dil: 'tr' | 'en') => (deger?.[dil] || deger?.tr || '').trim();

// Bir etkinliği onaylı bülten abonelerine duyurur. Sadece adminler çağırabilir.
// Bir seferde en fazla 100 kişiye gönderir; tekrar çağrılınca yalnızca henüz almamış abonelere devam eder.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await request.json();
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const eventRef = adminDb.collection('events').doc(id);
    const eventDoc = await eventRef.get();
    const event = eventDoc.data();
    if (!eventDoc.exists || !event) {
      return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 });
    }

    const sonuc = await bultenGonder(`event_${id}`, (abone) =>
      getEventEmailTemplate(abone.locale, {
        slug: String(event.slug || ''),
        title: dilde(event.title, abone.locale),
        description: dilde(event.description, abone.locale),
        location: dilde(event.location, abone.locale),
        date: String(event.date || ''),
        time: String(event.time || ''),
        imageUrl: typeof event.image === 'string' ? event.image : '',
        registrationUrl: typeof event.registrationUrl === 'string' ? event.registrationUrl : '',
      })
    );

    if (sonuc.total === 0) {
      return NextResponse.json({ error: 'Onaylı bülten abonesi bulunamadı.' }, { status: 400 });
    }
    if (sonuc.error) {
      return NextResponse.json({ ...sonuc, success: false }, { status: 502 });
    }

    if (sonuc.sent > 0) {
      await eventRef.update({
        announcedAt: FieldValue.serverTimestamp(),
        announcedCount: sonuc.total - sonuc.remaining,
      });
    }

    return NextResponse.json({ ...sonuc, success: true });
  } catch (error) {
    console.error('Event announce error:', error);
    return NextResponse.json({ error: 'Duyuru gönderilemedi.' }, { status: 500 });
  }
}
