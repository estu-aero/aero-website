import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { epostaCoz, onayImzasiDogrula } from '@/lib/unsubscribe';
import { ABONE_KOLEKSIYONU } from '@/lib/newsletter';
import { bultenSayfasi, kacis, sayfaDugmesi } from '@/lib/newsletter-page';

// Bülten aboneliğinin onayı: abone olan kişiye giden maildeki bağlantı bu sayfayı açar.
// GET onay düğmesini gösterir (mail programlarının bağlantıyı otomatik açması kimseyi abone yapmasın),
// POST aboneliği onaylar. Onaylanmayan kayıtlara hiçbir duyuru gönderilmez.

const METIN = {
  tr: {
    title: 'Aboneliği onayla',
    ask: 'adresini AERO bültenine eklemek için onaylayın.',
    button: 'Aboneliğimi onayla',
    done: 'Aboneliğiniz onaylandı. Hoş geldiniz! Etkinlik ve duyurularımız artık size ulaşacak.',
    invalid: 'Bağlantı geçersiz veya eksik.',
    error: 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
  },
  en: {
    title: 'Confirm subscription',
    ask: 'will be added to the AERO newsletter. Please confirm.',
    button: 'Confirm my subscription',
    done: 'Your subscription is confirmed. Welcome! Our events and announcements will now reach you.',
    invalid: 'This link is invalid or incomplete.',
    error: 'Something went wrong. Please try again later.',
  },
} as const;

function oku(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const lang = p.get('l') === 'en' ? ('en' as const) : ('tr' as const);
  const email = epostaCoz(p.get('e') || '');
  const gecerli = Boolean(email) && onayImzasiDogrula(email, p.get('t') || '');
  return { lang, email, gecerli };
}

export async function GET(request: NextRequest) {
  const { lang, email, gecerli } = oku(request);
  const m = METIN[lang];
  if (!gecerli) return bultenSayfasi(lang, m.title, `<p>${m.invalid}</p>`, 400);
  return bultenSayfasi(
    lang,
    m.title,
    `<h1 style="font-size:20px;margin:0 0 12px">${m.title}</h1>
<p><strong>${kacis(email)}</strong> ${m.ask}</p>
${sayfaDugmesi(m.button)}`
  );
}

export async function POST(request: NextRequest) {
  const { lang, email, gecerli } = oku(request);
  const m = METIN[lang];
  if (!gecerli) return bultenSayfasi(lang, m.title, `<p>${m.invalid}</p>`, 400);
  try {
    const koleksiyon = adminDb.collection(ABONE_KOLEKSIYONU);
    const kayitlar = await koleksiyon.where('email', '==', email).limit(1).get();
    if (kayitlar.empty) {
      // Onay bekleyen kayıt süresi dolup silinmiş olabilir; imzalı bağlantı adresin sahibini kanıtlar
      await koleksiyon.add({
        email,
        locale: lang,
        status: 'active',
        subscribedAt: FieldValue.serverTimestamp(),
        confirmedAt: FieldValue.serverTimestamp(),
        source: 'footer',
      });
    } else if (kayitlar.docs[0].data().status === 'pending') {
      await kayitlar.docs[0].ref.update({ status: 'active', confirmedAt: FieldValue.serverTimestamp() });
    }
    return bultenSayfasi(lang, m.title, `<p>${m.done}</p>`);
  } catch (hata) {
    console.error('Newsletter confirm error:', hata);
    return bultenSayfasi(lang, m.title, `<p>${m.error}</p>`, 500);
  }
}
