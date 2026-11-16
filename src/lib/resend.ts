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
    subject: `${SITE.shortName} bülten aboneliğinizi onaylayın`,
    welcome: 'Aboneliğinizi onaylayın',
    hello: 'Merhaba,',
    intro: `${SITE.fullName.tr} bültenine abone olma isteğinizi aldık. Aboneliğinizi tamamlamak için aşağıdaki düğmeye tıklayın; etkinliklerimiz, eğitimlerimiz ve duyurularımız ardından doğrudan size ulaşacak.`,
    confirm: 'Aboneliğimi Onayla',
    ignore: 'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; onaylamadığınız sürece listeye eklenmezsiniz.',
    expectTitle: 'Neler Bekleyebilirsiniz?',
    expect: [
      'Havacılık ve uzay alanında seminer ve söyleşi duyuruları',
      'Atölye çalışmaları ve teknik eğitimler',
      'Proje ve yarışma fırsatları',
      'Teknik gezi ve sektör buluşması duyuruları',
    ],
    follow: 'Sosyal medyada takip edin:',
    rights: 'Tüm hakları saklıdır.',
  },
  en: {
    subject: `Confirm your ${SITE.shortName} newsletter subscription`,
    welcome: 'Confirm your subscription',
    hello: 'Hello,',
    intro: `We received your request to subscribe to the ${SITE.fullName.en} newsletter. Click the button below to complete your subscription; our events, training and announcements will then come straight to you.`,
    confirm: 'Confirm My Subscription',
    ignore: 'If you did not make this request, you can ignore this email; you will not be added to the list unless you confirm.',
    expectTitle: 'What to Expect',
    expect: [
      'Aviation and space seminars and talks',
      'Workshops and technical training',
      'Project and competition opportunities',
      'Technical trips and industry meetups',
    ],
    follow: 'Follow us on social media:',
    rights: 'All rights reserved.',
  },
} as const;

// Abonelik onayı maili: abone olan kişiye gider; düğmeye tıklayınca abonelik onaylanır.
// Hoş geldin içeriğini de taşır, onaydan sonra ayrıca mail gönderilmez.
export const getConfirmEmailTemplate = (locale: string, confirmUrl: string) => {
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

            <div style="text-align: center; margin: 28px 0;">
              <a href="${escapeHtml(confirmUrl)}" style="display: inline-block; background: linear-gradient(to right, ${BRAND}, ${BRAND_DARK}); color: white; padding: 13px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">${c.confirm}</a>
            </div>
            <p style="font-size: 13px; color: #6B7280;">${c.ignore}</p>

            <h3 style="color: ${BRAND}; font-size: 18px; margin-top: 30px;">${c.expectTitle}</h3>
            <ul style="padding-left: 20px;">
              ${c.expect.map((item) => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
            </ul>

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
    unsubscribe: 'Bu e-postaları almak istemiyorsanız',
    unsubscribeLink: 'abonelikten çıkın',
    unsubscribeSubject: 'Bülten Aboneliğinden Çık',
  },
  en: {
    subject: (title: string) => `AERO Magazine: ${title} is out!`,
    heading: 'Our new issue is out',
    read: 'Read the Magazine',
    rights: 'All rights reserved.',
    unsubscribe: 'If you no longer wish to receive these emails,',
    unsubscribeLink: 'unsubscribe',
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

const EVENT_COPY = {
  tr: {
    subject: (title: string) => `Yeni etkinlik: ${title}`,
    heading: 'Yeni bir etkinliğimiz var',
    when: 'Tarih',
    where: 'Yer',
    details: 'Etkinliği İncele',
    register: 'Kayıt Ol',
    rights: 'Tüm hakları saklıdır.',
    unsubscribe: 'Bu e-postaları almak istemiyorsanız',
    unsubscribeLink: 'abonelikten çıkın',
    unsubscribeSubject: 'Bülten Aboneliğinden Çık',
  },
  en: {
    subject: (title: string) => `New event: ${title}`,
    heading: 'We have a new event',
    when: 'Date',
    where: 'Location',
    details: 'View Event',
    register: 'Register',
    rights: 'All rights reserved.',
    unsubscribe: 'If you no longer wish to receive these emails,',
    unsubscribeLink: 'unsubscribe',
    unsubscribeSubject: 'Unsubscribe from Newsletter',
  },
} as const;

// Yeni etkinlik duyurusu
export const getEventEmailTemplate = (
  locale: string,
  event: {
    slug: string;
    title: string;
    description: string;
    location: string;
    date: string; // YYYY-AA-GG
    time: string; // SS:DD
    imageUrl: string;
    registrationUrl: string;
  }
) => {
  const lang = locale === 'en' ? 'en' : 'tr';
  const c = EVENT_COPY[lang];
  const link = `${SITE.url}/events/${encodeURIComponent(event.slug)}/${lang}`;
  const tarih = (() => {
    const d = new Date(`${event.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return event.date;
    const metin = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    return event.time ? `${metin}, ${event.time}` : metin;
  })();
  const kayit = /^https?:\/\//.test(event.registrationUrl) ? event.registrationUrl : '';

  return {
    subject: c.subject(event.title),
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

          <div style="background: white; padding: 32px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            ${event.imageUrl ? `<img src="${escapeHtml(event.imageUrl)}" alt="" width="540" style="max-width: 100%; border-radius: 6px; margin-bottom: 20px;">` : ''}
            <h2 style="color: ${BRAND}; margin: 0 0 16px 0;">${escapeHtml(event.title)}</h2>
            <p style="margin: 0 0 6px 0;"><strong>${c.when}:</strong> ${escapeHtml(tarih)}</p>
            ${event.location ? `<p style="margin: 0 0 16px 0;"><strong>${c.where}:</strong> ${escapeHtml(event.location)}</p>` : ''}
            ${event.description ? `<p style="margin: 0 0 24px 0;">${escapeHtml(event.description)}</p>` : ''}
            <div style="text-align: center;">
              <a href="${link}" style="display: inline-block; background: linear-gradient(to right, ${BRAND}, ${BRAND_DARK}); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 4px;">${c.details}</a>
              ${kayit ? `<a href="${escapeHtml(kayit)}" style="display: inline-block; border: 2px solid ${BRAND}; color: ${BRAND}; padding: 10px 26px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 4px;">${c.register}</a>` : ''}
            </div>
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
