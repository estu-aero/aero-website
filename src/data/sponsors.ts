export interface SponsorData {
  key: string;
  name: { tr: string; en: string };
  // Logo yoksa kartta şirket adı gösterilir. Logoyu public/images/sponsors/ içine koyup yolunu yazın.
  logo?: string;
  // false olan sponsorlar sitede gösterilmez.
  active: boolean;
}

// Örnek: { key: 'firma', name: { tr: 'Firma', en: 'Company' }, logo: '/images/sponsors/firma.png', active: true }
export const sponsors: SponsorData[] = [];
