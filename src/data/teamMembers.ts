export interface TeamMemberData {
  tr: {
    name: string;
    position: string;
    // Boş bırakılırsa kartta gösterilmez
    department: string;
  };
  en: {
    name: string;
    position: string;
    department: string;
  };
  // Profil penceresinde (karta tıklayınca) gösterilir; boş bırakılan gösterilmez.
  // Kişisel veri olduğu için sadece kişinin izin verdiği bilgiler yazılmalı.
  sinif?: number | 'hazirlik'; // ör. 2 -> "2. Sınıf", 'hazirlik' -> "Hazırlık"
  linkedin?: string; // ör. 'https://www.linkedin.com/in/kullanici-adi/'
  email?: string;
  // Fotoğraf yoksa kartta baş harfler gösterilir. Fotoğrafı public/images/team/ içine koyup yolunu yazın.
  image?: string;
  section: 'boardOfDirectors' | 'administrativeBoard' | 'auditBoard';
}

// TODO: eksik fotoğraflar gelince eklenecek
export const teamMembers: TeamMemberData[] = [
  // Yönetim Kurulu (5 kişi)
  {
    tr: { name: 'Ozan Narin', position: 'Başkan', department: 'Uçak Mühendisliği' },
    en: { name: 'Ozan Narin', position: 'President', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/ozan-narin-6444ba32b/',
    email: 'ozannarin@ogr.eskisehir.edu.tr',
    image: '/images/team/ozan-narin.jpg',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Kerem Çağlar', position: 'Başkan Yardımcısı', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Kerem Çağlar', position: 'Vice President', department: 'Aerospace Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/kerem-çağlar-1a7a63329/',
    email: 'keremcaglar@ogr.eskisehir.edu.tr',
    image: '/images/team/kerem-caglar.jpg',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Duygu Tuana Güler', position: 'Genel Sekreter', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Duygu Tuana Güler', position: 'General Secretary', department: 'Aerospace Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/duygu-tuana-guler/',
    email: 'duygutuanaguler@ogr.eskisehir.edu.tr',
    image: '/images/team/duygu-tuana-guler.jpg',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Yiğit Ergeç', position: 'Sayman', department: 'Uçak Mühendisliği' },
    en: { name: 'Yiğit Ergeç', position: 'Treasurer', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/yiğit-ergeç-445331331/',
    email: 'yigit_ergec@ogr.eskisehir.edu.tr',
    image: '/images/team/yigit-ergec.jpg',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Tülay Sefer', position: 'Sponsorluk Sorumlusu', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Tülay Sefer', position: 'Sponsorship Lead', department: 'Aerospace Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/tülay-sefer-868676347/',
    email: 'tulaysefer@ogr.eskisehir.edu.tr',
    image: '/images/team/tulay-sefer.jpg',
    section: 'boardOfDirectors',
  },
  // İdari Kurul (6 kişi)
  {
    tr: { name: 'Ali Kayalar', position: 'Sponsorluk Asistanı', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Ali Kayalar', position: 'Sponsorship Assistant', department: 'Aerospace Engineering' },
    sinif: 1,
    linkedin: 'https://www.linkedin.com/in/ali-kayalar-3b7777395/',
    email: 'alikayalar@ogr.eskisehir.edu.tr',
    image: '/images/team/ali-kayalar.jpg',
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Melih Karabulut', position: 'Tanıtım ve Tasarım Koordinatörü', department: 'Uçak Mühendisliği' },
    en: { name: 'Melih Karabulut', position: 'Promotion & Design Coordinator', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/melih-karabulut-a52649425/',
    email: 'melihkarabulut@ogr.eskisehir.edu.tr',
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Mehmet Arda Acar', position: 'Teknik Ekip Koordinatörü', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Mehmet Arda Acar', position: 'Technical Team Coordinator', department: 'Aerospace Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/arda-acar-3307273b0/',
    email: 'mehmetacar@ogr.eskisehir.edu.tr',
    image: '/images/team/mehmet-arda-acar.jpg',
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Ceyda Yılmaz', position: 'Sosyal Ekip Koordinatörü', department: 'Uçak Mühendisliği' },
    en: { name: 'Ceyda Yılmaz', position: 'Social Team Coordinator', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/ceyda-yılmaz-b79835389/',
    email: 'ceyda@ogr.eskisehir.edu.tr',
    image: '/images/team/ceyda-yilmaz-2.jpg',
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Emin Ece', position: 'Eğitim ve Ar-Ge Koordinatörü', department: 'Havacılık ve Uzay Mühendisliği' },
    en: { name: 'Emin Ece', position: 'Education & R&D Coordinator', department: 'Aerospace Engineering' },
    sinif: 'hazirlik',
    linkedin: 'https://www.linkedin.com/in/emin-ece-55776a444/',
    email: 'emin.ece@ogr.eskisehir.edu.tr',
    image: '/images/team/emin-ece.jpg',
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Şevval Sarıöz', position: 'Basın ve Yayın Koordinatörü', department: 'Uçak Mühendisliği' },
    en: { name: 'Şevval Sarıöz', position: 'Press & Media Coordinator', department: 'Aircraft Engineering' },
    sinif: 1,
    linkedin: 'https://www.linkedin.com/in/şevval-sariöz-259503393/',
    email: 'sevval_sarioz@ogr.eskisehir.edu.tr',
    image: '/images/team/sevval-sarioz.jpg',
    section: 'administrativeBoard',
  },
  // Denetim Kurulu (3 kişi)
  {
    tr: { name: 'Damla Baran', position: 'Denetim Kurulu Üyesi', department: 'Elektrik Elektronik Mühendisliği' },
    en: { name: 'Damla Baran', position: 'Audit Board Member', department: 'Electrical and Electronics Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/damla-b-40800132b/',
    email: 'damlabaran@ogr.eskisehir.edu.tr',
    image: '/images/team/damla-baran.jpg',
    section: 'auditBoard',
  },
  {
    tr: { name: 'Ali Karasalih', position: 'Denetim Kurulu Üyesi', department: 'Elektrik Elektronik Mühendisliği' },
    en: { name: 'Ali Karasalih', position: 'Audit Board Member', department: 'Electrical and Electronics Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/ali-karasalih-a5781733b/',
    email: 'ali.karasalih@ogr.eskisehir.edu.tr',
    image: '/images/team/ali-karasalih.jpg',
    section: 'auditBoard',
  },
  {
    tr: { name: 'Efe Aral', position: 'Denetim Kurulu Üyesi', department: 'Uçak Mühendisliği' },
    en: { name: 'Efe Aral', position: 'Audit Board Member', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/efe-aral-94537a33b/',
    email: 'earal@ogr.eskisehir.edu.tr',
    image: '/images/team/efe-aral.jpg',
    section: 'auditBoard',
  },
];
