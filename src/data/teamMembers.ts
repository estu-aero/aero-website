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
  sinif?: number; // ör. 2 -> "2. Sınıf"
  linkedin?: string; // ör. 'https://www.linkedin.com/in/kullanici-adi/'
  email?: string;
  // Fotoğraf yoksa kartta baş harfler gösterilir. Fotoğrafı public/images/team/ içine koyup yolunu yazın.
  image?: string;
  section: 'boardOfDirectors' | 'administrativeBoard' | 'auditBoard';
}

// TODO: bölümler ve fotoğraflar gelince doldurulacak
export const teamMembers: TeamMemberData[] = [
  // Yönetim Kurulu (5 kişi)
  {
    tr: { name: 'Ozan Narin', position: 'Başkan', department: 'Uçak Mühendisliği' },
    en: { name: 'Ozan Narin', position: 'President', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/ozan-narin-6444ba32b/',
    email: 'ozannarin@ogr.eskisehir.edu.tr',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Kerem Çağlar', position: 'Başkan Yardımcısı', department: '' },
    en: { name: 'Kerem Çağlar', position: 'Vice President', department: '' },
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Duygu Tuana Güler', position: 'Genel Sekreter', department: '' },
    en: { name: 'Duygu Tuana Güler', position: 'General Secretary', department: '' },
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Yiğit Ergeç', position: 'Sayman', department: 'Uçak Mühendisliği' },
    en: { name: 'Yiğit Ergeç', position: 'Treasurer', department: 'Aircraft Engineering' },
    sinif: 2,
    linkedin: 'https://www.linkedin.com/in/yiğit-ergeç-445331331/',
    email: 'yigit_ergec@ogr.eskisehir.edu.tr',
    section: 'boardOfDirectors',
  },
  {
    tr: { name: 'Tülay Sefer', position: 'Sponsorluk Sorumlusu', department: '' },
    en: { name: 'Tülay Sefer', position: 'Sponsorship Lead', department: '' },
    section: 'boardOfDirectors',
  },
  // İdari Kurul (6 kişi)
  {
    tr: { name: 'Ali Kayalar', position: 'Sponsorluk Asistanı', department: '' },
    en: { name: 'Ali Kayalar', position: 'Sponsorship Assistant', department: '' },
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Melih Karabulut', position: 'Tanıtım ve Tasarım Koordinatörü', department: '' },
    en: { name: 'Melih Karabulut', position: 'Promotion & Design Coordinator', department: '' },
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Mehmet Arda Acar', position: 'Teknik Ekip Koordinatörü', department: '' },
    en: { name: 'Mehmet Arda Acar', position: 'Technical Team Coordinator', department: '' },
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Ceyda Yılmaz', position: 'Sosyal Ekip Koordinatörü', department: '' },
    en: { name: 'Ceyda Yılmaz', position: 'Social Team Coordinator', department: '' },
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Emin Ece', position: 'Eğitim ve Ar-Ge Koordinatörü', department: '' },
    en: { name: 'Emin Ece', position: 'Education & R&D Coordinator', department: '' },
    section: 'administrativeBoard',
  },
  {
    tr: { name: 'Şevval Sarıöz', position: 'Basın ve Yayın Koordinatörü', department: '' },
    en: { name: 'Şevval Sarıöz', position: 'Press & Media Coordinator', department: '' },
    section: 'administrativeBoard',
  },
  // Denetim Kurulu (3 kişi)
  {
    tr: { name: 'Damla Baran', position: 'Denetim Kurulu Üyesi', department: '' },
    en: { name: 'Damla Baran', position: 'Audit Board Member', department: '' },
    image: '/images/team/damla-baran.jpg',
    section: 'auditBoard',
  },
  {
    tr: { name: 'Ali Karasalih', position: 'Denetim Kurulu Üyesi', department: '' },
    en: { name: 'Ali Karasalih', position: 'Audit Board Member', department: '' },
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
