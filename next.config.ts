import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// İçerik güvenlik politikası: sayfanın hangi kaynaklardan içerik yükleyebileceğini sınırlar.
// Yeni bir dış servis eklenirse (ör. video gömme) ilgili satıra adresi eklenmelidir.
const csp = [
  "default-src 'self'",
  // hCaptcha (iletişim formu). 'unsafe-inline' Next.js'in sayfa içi betikleri için gerekli.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://js.hcaptcha.com https://*.hcaptcha.com`,
  "style-src 'self' 'unsafe-inline' https://*.hcaptcha.com",
  // Admin panelinden yüklenen görseller, dergi kapakları ve sertifikalar Vercel Blob'dan sunulur
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://firebasestorage.googleapis.com https://images.unsplash.com",
  "font-src 'self' data:",
  // Firebase (giriş + veritabanı), Web3Forms (iletişim formu), hCaptcha, Vercel Blob (dergi PDF'leri)
  "connect-src 'self' https://*.public.blob.vercel-storage.com https://vercel.com https://*.vercel-storage.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.web3forms.com https://*.hcaptcha.com",
  // Gömülü çerçeveler: hCaptcha ve Google Haritalar
  "frame-src https://*.hcaptcha.com https://maps.google.com https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

// Arama motorları admin, giriş ve API adreslerini dizine eklemesin
const noIndexHeader = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Sertifika üretimi şablon ve fontları diskten okur; Vercel'e bunların da yüklenmesi gerekir
  outputFileTracingIncludes: {
    '/api/admin/certificates/**': [
      './sertifikasyon sistemi/sablonlar/**/*',
      './sertifikasyon sistemi/fontlar/**/*',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: noIndexHeader },
      { source: '/api/:path*', headers: noIndexHeader },
      { source: '/login/:path*', headers: noIndexHeader },
    ];
  },
};

export default withNextIntl(nextConfig);
