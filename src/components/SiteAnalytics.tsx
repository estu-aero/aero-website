'use client';

import { Analytics } from '@vercel/analytics/next';

// Ziyaret istatistikleri (Vercel Web Analytics): çerez kullanmaz, ziyaretçiyi tanımlamaz.
// Admin ve giriş sayfaları sayılmaz; adresin sorgu kısmı (ör. sertifika kimliği) gönderilmez.
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const url = new URL(event.url);
          if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/login')) return null;
          return { ...event, url: url.origin + url.pathname };
        } catch {
          return event;
        }
      }}
    />
  );
}
