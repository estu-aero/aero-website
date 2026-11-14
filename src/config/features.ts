// Bölüm anahtarları: false olan bölümler menülerde gösterilmez ve sayfaları 404 döner.
// Tekrar açmak için true yapın.
export const FEATURES = {
  blog: false,
  // Proje takımları kurulunca true yapın ve takımları src/app/[locale]/takimlar/page.tsx içine ekleyin
  subteams: false,
  magazine: true,
  certificates: true,
} as const;
