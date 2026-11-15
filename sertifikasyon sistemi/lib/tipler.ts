// Firestore koleksiyonları ve kayıt yapıları

// Herkese açık doğrulama kaydı (belge kimliği = doğrulama kimliği). Sadece sunucu okur/yazar.
export const SERTIFIKA_KOLEKSIYONU = 'certificates';
// Sertifika grupları (bir etkinliğin sertifikaları). Admin okur, sunucu yazar.
export const GRUP_KOLEKSIYONU = 'certificate_events';
// Katılımcı e-postaları: kişisel veri, doğrulama kaydından ayrı tutulur. Admin okur, sunucu yazar.
export const EPOSTA_KOLEKSIYONU = 'certificate_emails';

export interface SertifikaKaydi {
  id: string;
  name: string;
  eventName: string;
  eventNameEn?: string;
  // Etkinlik tarihi: YYYY-AA-GG
  date: string;
  pdfUrl: string;
  eventId: string;
  template: string;
  status: 'valid';
}

export interface GrupKaydi {
  id: string;
  eventName: string;
  eventNameEn?: string;
  date: string;
  text: string;
  template: string;
  count: number;
  sentCount?: number;
  sentAt?: { toDate: () => Date } | null;
}

export interface Katilimci {
  name: string;
  email: string;
}
