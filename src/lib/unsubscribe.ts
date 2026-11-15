import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE } from '@/config/site';

// Abonelikten çıkma bağlantısı: e-posta + imza. İmza sunucudaki gizli anahtarla üretilir,
// böylece başkası bir e-postayı tahmin edip listeden çıkaramaz.
// Anahtar: NEWSLETTER_SECRET (varsa), yoksa Firebase sunucu anahtarı.
const anahtar = () => process.env.NEWSLETTER_SECRET || process.env.FIREBASE_PRIVATE_KEY || '';

const imza = (email: string) =>
  createHmac('sha256', anahtar()).update(email.trim().toLowerCase()).digest('base64url').slice(0, 32);

export function imzaDogrula(email: string, verilen: string) {
  if (!anahtar() || !verilen) return false;
  const beklenen = Buffer.from(imza(email));
  const gelen = Buffer.from(verilen);
  return beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen);
}

export const epostaKodla = (email: string) => Buffer.from(email.trim().toLowerCase()).toString('base64url');
export const epostaCoz = (kod: string) => {
  try {
    return Buffer.from(kod, 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

// Mailin altına ve List-Unsubscribe başlığına konan kişiye özel bağlantı
export const unsubscribeUrl = (email: string, locale: string) =>
  `${SITE.url}/api/newsletter/unsubscribe?e=${epostaKodla(email)}&t=${imza(email)}&l=${locale === 'en' ? 'en' : 'tr'}`;

// Gmail/Outlook'un yerleşik "Abonelikten çık" düğmesi için mail başlıkları
export const unsubscribeHeaders = (email: string, locale: string) => ({
  'List-Unsubscribe': `<${unsubscribeUrl(email, locale)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
});

// Şablonlardaki "abonelikten çıkın" bağlantısını (mailto) kişiye özel çıkış bağlantısıyla değiştirir
export const kisisellestir = (html: string, email: string, locale: string) =>
  html.replace(/href="mailto:[^"?]*\?subject=[^"]*"/g, `href="${unsubscribeUrl(email, locale)}"`);

// Spam filtreleri için mailin düz metin sürümü
export const metneCevir = (html: string) =>
  html
    .replace(/<(style|head|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>|<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Gönderime eklenecek ortak alanlar: kişisel çıkış bağlantısı, düz metin, List-Unsubscribe başlıkları
export const bultenAlanlari = (html: string, email: string, locale: string) => {
  const kisisel = kisisellestir(html, email, locale);
  return { html: kisisel, text: metneCevir(kisisel), headers: unsubscribeHeaders(email, locale) };
};
