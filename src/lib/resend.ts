import { Resend } from 'resend';
import { SITE } from '@/config/site';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;
export const isResendConfigured = Boolean(resendApiKey);

// Gönderen adresi: Resend'de alan adı doğrulanınca .env içine RESEND_FROM yazılır
// (ör. "ESTÜ AERO <bulten@alanadi.org>"). Doğrulanana kadar Resend'in test adresi kullanılır.
export const EMAIL_FROM =
  process.env.RESEND_FROM || `${SITE.shortName} <onboarding@resend.dev>`;

const BRAND = '#B0182A';
const BRAND_DARK = '#8A1220';

const COPY = {
  tr: {
    subject: `${SITE.shortName} Bültenine Hoş Geldiniz!`,
    welcome: 'Hoş Geldiniz!',
    hello: 'Merhaba,',
    intro: `${SITE.fullName.tr} bültenine abone olduğunuz için teşekkür ederiz! Etkinliklerimiz, eğitimlerimiz ve duyurularımız artık doğrudan size ulaşacak.`,
    expectTitle: 'Neler Bekleyebilirsiniz?',
    expect: [
      'Sektör buluşmaları ve seminer duyuruları',
      'Teknik yazılım eğitimleri',
      'Proje takımı ve yarışma fırsatları',
      'Teknik gezi duyuruları',
    ],
    visit: 'Web Sitemizi Ziyaret Edin',
    follow: 'Sosyal medyada takip edin:',
    rights: 'Tüm hakları saklıdır.',
    unsubscribe: 'Bu e-postayı almak istemiyorsanız, lütfen',
    unsubscribeLink: 'bizimle iletişime geçin',
    unsubscribeSubject: 'Bülten Aboneliğinden Çık',
  },
  en: {
    subject: `Welcome to the ${SITE.shortName} Newsletter!`,
    welcome: 'Welcome!',
    hello: 'Hello,',
    intro: `Thank you for subscribing to the ${SITE.fullName.en} newsletter! Our events, training and announcements will now come straight to you.`,
    expectTitle: 'What to Expect',
    expect: [
      'Industry meetups and seminar announcements',
      'Technical software training',
      'Project team and competition opportunities',
      'Technical trip announcements',
    ],
    visit: 'Visit Our Website',
    follow: 'Follow us on social media:',
    rights: 'All rights reserved.',
    unsubscribe: 'If you no longer wish to receive these emails, please',
    unsubscribeLink: 'contact us',
    unsubscribeSubject: 'Unsubscribe from Newsletter',
  },
} as const;

// Email templates
export const getWelcomeEmailTemplate = (locale: string) => {
  const lang = locale === 'tr' ? 'tr' : 'en';
  const c = COPY[lang];
  const socials = [
    { name: 'Instagram', url: SITE.social.instagram },
    { name: 'LinkedIn', url: SITE.social.linkedin },
  ].filter((social) => social.url);

  return {
    subject: c.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a0a0a; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 4px solid ${BRAND};">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">${SITE.shortName}</h1>
            <p style="color: #d4d4d4; margin: 10px 0 0 0;">${SITE.fullName[lang]}</p>
          </div>

          <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: ${BRAND}; margin-top: 0;">${c.welcome}</h2>
            <p>${c.hello}</p>
            <p>${c.intro}</p>

            <h3 style="color: ${BRAND}; font-size: 18px; margin-top: 30px;">${c.expectTitle}</h3>
            <ul style="padding-left: 20px;">
              ${c.expect.map((item) => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${SITE.url}" style="display: inline-block; background: linear-gradient(to right, ${BRAND}, ${BRAND_DARK}); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">${c.visit}</a>
            </div>

            ${
              socials.length
                ? `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6B7280; margin: 0;">${c.follow}</p>
              <div style="margin-top: 15px;">
                ${socials.map((s) => `<a href="${s.url}" style="color: ${BRAND}; text-decoration: none; margin-right: 15px;">${s.name}</a>`).join('')}
              </div>
            </div>`
                : ''
            }
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
            <p>© ${new Date().getFullYear()} ${SITE.fullName[lang]}. ${c.rights}</p>
            <p style="margin-top: 10px;">
              ${c.unsubscribe} <a href="mailto:${SITE.email}?subject=${encodeURIComponent(c.unsubscribeSubject)}" style="color: ${BRAND};">${c.unsubscribeLink}</a>.
            </p>
          </div>
        </body>
      </html>
    `,
  };
};

const MAGAZINE_COPY = {
  tr: {
    subject: (title: string) => `AERO Dergi: ${title} yayında!`,
    heading: 'Yeni sayımız yayında',
    read: 'Dergiyi Oku',
    rights: 'Tüm hakları saklıdır.',
    unsubscribe: 'Bu e-postayı almak istemiyorsanız, lütfen',
    unsubscribeLink: 'bizimle iletişime geçin',
    unsubscribeSubject: 'Bülten Aboneliğinden Çık',
  },
  en: {
    subject: (title: string) => `AERO Magazine: ${title} is out!`,
    heading: 'Our new issue is out',
    read: 'Read the Magazine',
    rights: 'All rights reserved.',
    unsubscribe: 'If you no longer wish to receive these emails, please',
    unsubscribeLink: 'contact us',
    unsubscribeSubject: 'Unsubscribe from Newsletter',
  },
} as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Yeni dergi sayısı duyurusu
export const getMagazineEmailTemplate = (
  locale: string,
  issue: { number: number; title: string; description: string; coverUrl: string }
) => {
  const lang = locale === 'tr' ? 'tr' : 'en';
  const c = MAGAZINE_COPY[lang];
  const title = escapeHtml(issue.title);
  const link = `${SITE.url}/magazine/${lang}?issue=${issue.number}`;

  return {
    subject: c.subject(issue.title),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 4px solid ${BRAND};">
            <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 2px;">${SITE.shortName}</h1>
            <p style="color: #d4d4d4; margin: 8px 0 0 0;">${c.heading}</p>
          </div>

          <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; text-align: center;">
            <a href="${link}">
              <img src="${escapeHtml(issue.coverUrl)}" alt="${title}" width="260" style="max-width: 100%; border-radius: 6px; border: 1px solid #e5e7eb;">
            </a>
            <h2 style="color: ${BRAND}; margin: 24px 0 12px 0;">${title}</h2>
            ${issue.description ? `<p style="margin: 0 0 24px 0;">${escapeHtml(issue.description)}</p>` : ''}
            <a href="${link}" style="display: inline-block; background: linear-gradient(to right, ${BRAND}, ${BRAND_DARK}); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">${c.read}</a>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9CA3AF;">
            <p>© ${new Date().getFullYear()} ${SITE.fullName[lang]}. ${c.rights}</p>
            <p style="margin-top: 10px;">
              ${c.unsubscribe} <a href="mailto:${SITE.email}?subject=${encodeURIComponent(c.unsubscribeSubject)}" style="color: ${BRAND};">${c.unsubscribeLink}</a>.
            </p>
          </div>
        </body>
      </html>
    `,
  };
};
