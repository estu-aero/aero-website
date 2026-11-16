import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { epostaCoz, imzaDogrula } from '@/lib/unsubscribe';
import { ABONE_KOLEKSIYONU } from '@/lib/newsletter';
import { bultenSayfasi, kacis, sayfaDugmesi } from '@/lib/newsletter-page';

// Abonelikten çıkma: maildeki kişiye özel bağlantı bu sayfayı açar.
// GET onay sayfası gösterir (mail programlarının bağlantıyı otomatik açması kimseyi çıkarmasın),
// POST aboneliği siler. Gmail/Outlook'un "tek tıkla çık" düğmesi de doğrudan POST gönderir.

const METIN = {
  tr: {
    title: 'Abonelikten çık',
    ask: 'adresinin bülten aboneliği sonlandırılsın mı?',
    button: 'Abonelikten çık',
    done: 'Aboneliğiniz sonlandırıldı. Artık bülten maili almayacaksınız.',
    invalid: 'Bağlantı geçersiz veya eksik.',
    error: 'Bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
  },
  en: {
    title: 'Unsubscribe',
    ask: 'will be removed from the newsletter. Continue?',
    button: 'Unsubscribe',
    done: 'You have been unsubscribed. You will no longer receive newsletter emails.',
    invalid: 'This link is invalid or incomplete.',
    error: 'Something went wrong. Please try again later.',
  },
} as const;

function oku(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const lang = p.get('l') === 'en' ? ('en' as const) : ('tr' as const);
  const email = epostaCoz(p.get('e') || '');
  const gecerli = Boolean(email) && imzaDogrula(email, p.get('t') || '');
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
    const kayitlar = await adminDb.collection(ABONE_KOLEKSIYONU).where('email', '==', email).get();
    await Promise.all(kayitlar.docs.map((d) => d.ref.delete()));
    return bultenSayfasi(lang, m.title, `<p>${m.done}</p>`);
  } catch (hata) {
    console.error('Unsubscribe error:', hata);
    return bultenSayfasi(lang, m.title, `<p>${m.error}</p>`, 500);
  }
}
