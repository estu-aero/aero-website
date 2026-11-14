import type { MetadataRoute } from 'next';
import { SITE } from '@/config/site';
import { FEATURES } from '@/config/features';
import { ENGLISH_ROUTES } from '@/i18n/paths';

// Arama motorlarına verilen sayfa listesi. Kapalı bölümler listeye girmez.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: string[] = [
    ENGLISH_ROUTES.home,
    ENGLISH_ROUTES.about,
    ENGLISH_ROUTES.team,
    ENGLISH_ROUTES.events,
    ENGLISH_ROUTES.sponsors,
    ENGLISH_ROUTES.contact,
    ENGLISH_ROUTES.privacy,
    ENGLISH_ROUTES.terms,
    ...(FEATURES.subteams ? [ENGLISH_ROUTES.subteams] : []),
    ...(FEATURES.blog ? [ENGLISH_ROUTES.blog] : []),
    ...(FEATURES.magazine ? [ENGLISH_ROUTES.magazine] : []),
    ...(FEATURES.certificates ? [ENGLISH_ROUTES.certificate] : []),
  ];

  return routes.flatMap((route) =>
    (['tr', 'en'] as const).map((locale) => ({
      url: `${SITE.url}${route}/${locale}`,
      changeFrequency: 'monthly' as const,
      priority: route === ENGLISH_ROUTES.home ? 1 : 0.7,
    }))
  );
}
