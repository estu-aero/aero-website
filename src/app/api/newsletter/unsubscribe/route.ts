import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { SITE } from '@/config/site';
import { epostaCoz, imzaDogrula } from '@/lib/unsubscribe';

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
    back: 'Siteye dön',
  },
  en: {
    title: 'Unsubscribe',
    ask: 'will be removed from the newsletter. Continue?',
    button: 'Unsubscribe',
    done: 'You have been unsubscribed. You will no longer receive newsletter emails.',
    invalid: 'This link is invalid or incomplete.',
    error: 'Something went wrong. Please try again later.',
    back: 'Back to site',
  },
} as const;

const kacis = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sayfa(lang: 'tr' | 'en', icerik: string, status = 200) {
  const m = METIN[lang];
  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${m.title} | ${SITE.shortName}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f4f4;color:#333">
<div style="max-width:480px;margin:60px auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
<div style="background:#0a0a0a;border-bottom:4px solid #B0182A;padding:24px;text-align:center"><span style="color:#fff;font-size:24px;font-weight:700;letter-spacing:2px">${SITE.shortName}</span></div>
<div style="padding:28px;text-align:center;line-height:1.6">${icerik}<p style="margin-top:24px"><a href="/home/${lang}" style="color:#B0182A">${m.back}</a></p></div></div></body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function oku(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const lang = p.get('l') === 'en' ? 'en' : 'tr';
  const email = epostaCoz(p.get('e') || '');
  const gecerli = Boolean(email) && imzaDogrula(email, p.get('t') || '');
  return { lang, email, gecerli } as const;
}

export async function GET(request: NextRequest) {
  const { lang, email, gecerli } = oku(request);
  const m = METIN[lang];
  if (!gecerli) return sayfa(lang, `<p>${m.invalid}</p>`, 400);
  return sayfa(
    lang,
    `<h1 style="font-size:20px;margin:0 0 12px">${m.title}</h1>
<p><strong>${kacis(email)}</strong> ${m.ask}</p>
<form method="post"><button type="submit" style="margin-top:12px;background:#B0182A;color:#fff;border:0;border-radius:6px;padding:12px 28px;font-size:15px;font-weight:600;cursor:pointer">${m.button}</button></form>`
  );
}

export async function POST(request: NextRequest) {
  const { lang, email, gecerli } = oku(request);
  const m = METIN[lang];
  if (!gecerli) return sayfa(lang, `<p>${m.invalid}</p>`, 400);
  try {
    const kayitlar = await adminDb.collection('newsletter').where('email', '==', email).get();
    await Promise.all(kayitlar.docs.map((d) => d.ref.delete()));
    return sayfa(lang, `<p>${m.done}</p>`);
  } catch (hata) {
    console.error('Unsubscribe error:', hata);
    return sayfa(lang, `<p>${m.error}</p>`, 500);
  }
}
