import type { Metadata } from "next";
import { getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import "./globals.css";
import { SITE } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = SITE.url;
const siteName = `${SITE.shortName} | ${SITE.fullName.tr}`;
const siteDescription = SITE.description.tr;
const logoPath = "/images/logo/aero-logo-light.png";
const ogImagePath = "/images/logo/og-image.png";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${SITE.shortName}`,
  },
  description: siteDescription,
  applicationName: SITE.shortName,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      tr: "/tr",
      en: "/en",
    },
  },
  keywords: [
    "AERO",
    "AERO ESTÜ",
    SITE.fullName.tr,
    SITE.fullName.en,
    "ESTÜ Uçak ve Uzay",
    "Eskişehir Teknik Üniversitesi",
    "ESTÜ öğrenci kulübü",
    "havacılık kulübü",
    "uzay kulübü",
    "Eskişehir havacılık",
  ],
  authors: [{ name: SITE.fullName.tr, url: siteUrl }],
  creator: SITE.fullName.tr,
  publisher: SITE.fullName.tr,
  category: "Education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: SITE.shortName,
    title: siteName,
    description: siteDescription,
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    images: [{ url: ogImagePath, width: 1200, height: 630, alt: SITE.fullName.tr }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [ogImagePath],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/logo/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/images/logo/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.fullName.tr,
    alternateName: [SITE.shortName, SITE.fullName.en],
    url: siteUrl,
    logo: `${siteUrl}${logoPath}`,
    sameAs: Object.values(SITE.social).filter(Boolean),
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressCountry: "TR",
    },
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
