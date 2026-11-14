// SERTİFİKA ŞABLON AYARLARI
//
// Her şablon için: PDF dosyasının adı (sablonlar/ klasöründe) ve yazıların sayfadaki yeri.
// Konumlar sayfa boyutuna oranla verilir, böylece şablonun ölçüsü ne olursa olsun çalışır:
//   x: soldan uzaklık (0 = sol kenar, 1 = sağ kenar)
//   y: üstten uzaklık (0 = üst kenar, 1 = alt kenar), yazının satır tabanı
//   boyut: yazı boyutu, sayfa genişliğinin oranı (0.034 ≈ 2000 px genişlikte 68 punto)
// Şablon gelince admin panelindeki "Önizle" ile kontrol edilip bu değerler ayarlanır.

export interface YaziAyari {
  x: number;
  y: number;
  boyut: number;
  renk: string; // #RRGGBB
  // ortala: x noktasına göre ortalanır, sol: x noktasından başlar
  hiza: 'ortala' | 'sol';
  // Yazı bu genişliği (sayfa oranı) aşarsa otomatik küçültülür
  enFazlaGenislik?: number;
  kalin?: boolean;
}

export interface SablonAyari {
  id: string;
  // Admin panelinde görünen ad
  ad: string;
  // sablonlar/ klasöründeki PDF dosyasının adı
  dosya: string;
  isim: YaziAyari;
  // Etkinlik metni (birden fazla satır olabilir)
  metin: YaziAyari & { satirAraligi: number };
  // Doğrulama kimliği ve bağlantısı
  kimlik: YaziAyari;
}

const VARSAYILAN: Omit<SablonAyari, 'id' | 'ad' | 'dosya'> = {
  isim: {
    x: 0.5,
    y: 0.655,
    boyut: 0.036,
    renk: '#0A0A0A',
    hiza: 'ortala',
    enFazlaGenislik: 0.63,
    kalin: true,
  },
  metin: {
    x: 0.5,
    y: 0.755,
    boyut: 0.015,
    renk: '#333333',
    hiza: 'ortala',
    enFazlaGenislik: 0.7,
    satirAraligi: 1.4,
  },
  kimlik: {
    x: 0.045,
    y: 0.935,
    boyut: 0.0095,
    renk: '#B0182A',
    hiza: 'sol',
  },
};

// Yeni şablon eklemek için: PDF'i sablonlar/ klasörüne koyun ve buraya bir satır ekleyin.
// metinSablonu: admin panelinde otomatik doldurulan sertifika metni ({tarih} ve {etkinlik} yerine yazılır,
// \n yeni satır). Admin, sertifikaları oluşturmadan önce metni değiştirebilir.
// sabitTarih: verilirse bu türdeki tüm sertifikaların veriliş tarihi budur (YYYY-AA-GG);
// admin panelinde tarih alanı kilitlenir.
export const SABLONLAR: (SablonAyari & { metinSablonu: string; sabitTarih?: string })[] = [
  {
    id: 'kurucu-uye',
    ad: 'Kurucu Üye Sertifikası',
    dosya: 'kurucu-uye.pdf',
    // Tüm kurucu üye belgelerinin veriliş tarihi
    sabitTarih: '2026-09-24',
    // "Etkinlik adı" alanına ör. "Kurucu Üyelik" yazılır; doğrulama sayfasında etkinlik olarak görünür
    metinSablonu:
      "Eskişehir Teknik Üniversitesi Uçak ve Uzay Kulübü'nün kurucu üyesi olarak\nbu belgeyi almaya hak kazanmıştır.",
    ...VARSAYILAN,
  },
  {
    id: 'katilim',
    ad: 'Katılım Sertifikası',
    dosya: 'katilim.pdf',
    metinSablonu:
      '{tarih} tarihinde düzenlenen "{etkinlik}"\netkinliğine katılarak bu belgeyi almaya hak kazanmıştır.',
    ...VARSAYILAN,
  },
  {
    id: 'koordinasyon',
    ad: 'Koordinasyon Sertifikası',
    dosya: 'koordinasyon.pdf',
    metinSablonu:
      '{tarih} tarihinde düzenlenen "{etkinlik}"\netkinliğinde koordinatör olarak görev alarak bu belgeyi almaya hak kazanmıştır.',
    ...VARSAYILAN,
  },
];

export const sablonBul = (id: string) => SABLONLAR.find((s) => s.id === id);

// Bir seferde oluşturulan sertifika sayısı (sunucu süre sınırına takılmamak için)
export const PARTI_BOYUTU = 10;

// Bir grupta en fazla katılımcı
export const EN_FAZLA_KATILIMCI = 1000;
