import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '../../../i18n.config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Arama sonuçlarında görünen sayfa başlıkları
const SAYFA_BASLIKLARI: Record<string, { tr: string; en: string }> = {
  '/about': { tr: 'Hakkımızda', en: 'About Us' },
  '/team': { tr: 'Ekibimiz', en: 'Our Team' },
  '/events': { tr: 'Etkinlikler', en: 'Events' },
  '/magazine': { tr: 'Dergi', en: 'Magazine' },
  '/sponsors': { tr: 'Sponsorlar', en: 'Sponsors' },
  '/contact': { tr: 'İletişim', en: 'Contact' },
  '/certificate': { tr: 'Sertifika Doğrulama', en: 'Certificate Verification' },
  '/privacy': { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
  '/terms': { tr: 'Kullanım Koşulları', en: 'Terms of Use' },
};

// Her sayfaya kendi canonical adresi ve TR/EN alternatifleri (Google'ın sayfaları ayrı ayrı dizine alması için)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const yol = (await headers()).get('x-aero-path');
  if (!yol || !/^\/[a-z0-9/-]*$/.test(yol)) return {};
  const dil = locale === 'en' ? 'en' : 'tr';
  const baslik = SAYFA_BASLIKLARI[yol]?.[dil];
  return {
    // Ana sayfa varsayılan başlığı kullanır; diğerleri "Hakkımızda | AERO" gibi görünür
    ...(baslik ? { title: baslik } : {}),
    alternates: {
      canonical: `${yol}/${dil}`,
      languages: { tr: `${yol}/tr`, en: `${yol}/en`, 'x-default': `${yol}/tr` },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isLocale = (value: string): value is Locale =>
    locales.includes(value as Locale);

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
