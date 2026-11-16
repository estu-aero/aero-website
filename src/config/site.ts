// Kulüp kimliği: isim, açıklama ve adres. Sitede birden fazla yerde kullanılır, değiştirmek için sadece burayı düzenleyin.

export const SITE = {
  // Sitede logo yanında ve başlıklarda görünen kısa ad
  shortName: 'AERO',
  fullName: {
    tr: 'ESTÜ Uçak ve Uzay Kulübü',
    en: 'ESTU Aeronautics and Aerospace Club',
  },
  university: {
    tr: 'Eskişehir Teknik Üniversitesi',
    en: 'Eskisehir Technical University',
  },
  description: {
    tr: 'Eskişehir Teknik Üniversitesi Uçak ve Uzay Kulübü (ESTÜ AERO); havacılık ve uzay alanına ilgi duyan mühendis adaylarını bir araya getiren, teknik ve sosyal gelişimi destekleyen bir öğrenci topluluğudur.',
    en: 'Eskisehir Technical University Aeronautics and Aerospace Club (ESTU AERO) brings together engineering students interested in aviation and space, supporting their technical and social growth.',
  },
  foundedYear: 2026,
  period: '2026-2027',
  president: 'Ozan Narin',
  advisor: {
    tr: 'Dr. Öğr. Üyesi Özgün Sunar',
    en: 'Asst. Prof. Dr. Özgün Sunar',
  },
  email: 'estuucakveuzaykulubu@gmail.com',
  social: {
    instagram: 'https://www.instagram.com/estu_aero/',
    linkedin: 'https://www.linkedin.com/company/estu-aero/',
  },
  // LinkedIn şirket sayfasının sayısal kimliği: sertifika "LinkedIn'e Ekle" ile eklenince
  // kuruluş bu sayfaya bağlanır ve sayfanın logosu görünür
  linkedinOrgId: '112947361',
  // Sitenin adresi: sertifikalara ve maillere basılır; değişirse eski bağlantılar çalışmaz
  url: 'https://estuaero.com',
  city: 'Eskişehir',
  // Sitenin en son gezildiği dili tutan anahtar (tarayıcı oturumu). Sertifika doğrulama sayfası
  // her zaman İngilizce açılır; oradan siteye dönünce bu dil kullanılır.
  siteLocaleKey: 'aero-site-locale',
} as const;
