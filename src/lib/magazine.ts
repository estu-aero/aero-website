// Dergi sayıları: Firestore'daki "magazine" koleksiyonunun yapısı ve ortak yardımcılar.

export const MAGAZINE_COLLECTION = 'magazine';

// Yüklenebilecek en büyük PDF boyutu
export const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

export interface MagazineIssue {
  id: string;
  number: number;
  title: string;
  // İngilizce alanlar isteğe bağlı; boşsa Türkçesi gösterilir
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  // Yayın tarihi: YYYY-AA-GG
  date: string;
  coverUrl: string;
  pdfUrl: string;
  pages: number;
  sizeBytes: number;
  status: 'draft' | 'published';
}

export const issueTitle = (issue: MagazineIssue, locale: string) =>
  (locale === 'en' && issue.titleEn) || issue.title;

export const issueDescription = (issue: MagazineIssue, locale: string) =>
  (locale === 'en' && issue.descriptionEn) || issue.description;

// "2026-12-01" -> "Aralık 2026" / "December 2026"
export const formatIssueDate = (date: string, locale: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

// Vercel Blob adresine ?download=1 eklenince tarayıcı dosyayı açmak yerine indirir
export const downloadUrl = (pdfUrl: string) =>
  `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}download=1`;

// İndirilen dosyanın adı: depodaki dosya adının sonunda rastgele bir ek olduğu için anlamlı ad verilir
export const pdfDosyaAdi = (issue: { number: number }) => `AERO-Dergi-Sayi-${issue.number}.pdf`;

// PDF'i istenen adla indirir. Dosya başka alan adında (Vercel Blob) olduğu için <a download> adı
// tarayıcılarca yok sayılır; bu yüzden dosya önce indirilip sayfa içinden adıyla kaydedilir.
// Bir sorun olursa doğrudan indirme bağlantısına geçilir.
export async function dergiIndir(pdfUrl: string, dosyaAdi: string) {
  try {
    const yanit = await fetch(pdfUrl);
    if (!yanit.ok) throw new Error(String(yanit.status));
    const adres = URL.createObjectURL(await yanit.blob());
    const baglanti = document.createElement('a');
    baglanti.href = adres;
    baglanti.download = dosyaAdi;
    document.body.appendChild(baglanti);
    baglanti.click();
    baglanti.remove();
    setTimeout(() => URL.revokeObjectURL(adres), 60_000);
  } catch {
    window.location.href = downloadUrl(pdfUrl);
  }
}
