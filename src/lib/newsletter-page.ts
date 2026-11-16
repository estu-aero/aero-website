import { NextResponse } from 'next/server';
import { SITE } from '@/config/site';

// Maildeki bağlantıların açtığı küçük, kendi başına HTML sayfaları (abonelik onayı, abonelikten çıkma).

export const kacis = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const GERI = { tr: 'Siteye dön', en: 'Back to site' } as const;

export const sayfaDugmesi = (yazi: string) =>
  `<form method="post"><button type="submit" style="margin-top:12px;background:#B0182A;color:#fff;border:0;border-radius:6px;padding:12px 28px;font-size:15px;font-weight:600;cursor:pointer">${yazi}</button></form>`;

export function bultenSayfasi(lang: 'tr' | 'en', baslik: string, icerik: string, status = 200) {
  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${baslik} | ${SITE.shortName}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f4f4;color:#333">
<div style="max-width:480px;margin:60px auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
<div style="background:#0a0a0a;border-bottom:4px solid #B0182A;padding:24px;text-align:center"><span style="color:#fff;font-size:24px;font-weight:700;letter-spacing:2px">${SITE.shortName}</span></div>
<div style="padding:28px;text-align:center;line-height:1.6">${icerik}<p style="margin-top:24px"><a href="/home/${lang}" style="color:#B0182A">${GERI[lang]}</a></p></div></div></body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
