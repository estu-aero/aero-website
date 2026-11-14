import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '../../i18n.config';
import sertifikaTr from '@sertifika/mesajlar/tr.json';
import sertifikaEn from '@sertifika/mesajlar/en.json';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const isLocale = (value: string): value is Locale =>
    locales.includes(value as Locale);
  const locale =
    typeof requested === 'string' && isLocale(requested)
      ? requested
      : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;
  // Sertifika doğrulama sayfasının metinleri 'sertifikasyon sistemi/mesajlar' içinde
  const sertifika = locale === 'en' ? sertifikaEn : sertifikaTr;

  return {
    locale,
    messages: {
      ...messages,
      nav: { ...messages.nav, certificate: sertifika.nav },
      certificate: sertifika.certificate,
    },
  };
});
