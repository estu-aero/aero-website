# AERO — ESTÜ Uçak ve Uzay Kulübü Web Sitesi

Eskişehir Teknik Üniversitesi Uçak ve Uzay Kulübü'nün (ESTÜ AERO) web sitesi.
Türkçe ve İngilizce; tanıtım sayfaları, etkinlikler, dergi, sertifika doğrulama ve
admin paneli içerir.

## Özellikler
- **Sayfalar:** Ana sayfa, Hakkımızda, Ekibimiz, Etkinlikler, Dergi, Sponsorlar, İletişim,
  Sertifika doğrulama, Gizlilik Politikası, Kullanım Şartları
- **İki dil:** Adresler dil soneki taşır: `/about/tr`, `/about/en`
- **Admin paneli** (`/admin`): etkinlikler, dergi sayıları, sertifikalar, bülten aboneleri
- **Dergi:** PDF yükleme, kapağın otomatik oluşturulması, sitede okuma, abonelere duyuru
- **Sertifika sistemi:** toplu PDF sertifika üretimi, mail ile gönderim, herkese açık doğrulama
  (ayrıntılar: [`sertifikasyon sistemi/README.md`](sertifikasyon%20sistemi/README.md))
- **Bülten:** footer'dan abonelik, hoş geldin maili, admin panelinden duyuru
- **İletişim formu:** Web3Forms ile kulübün e-postasına iletilir

## Teknolojiler
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
next-intl · Firebase (Auth + Firestore) · Vercel Blob · Resend · Web3Forms + hCaptcha · Vercel

## Yerelde çalıştırma
```bash
npm install
cp .env.example .env.local   # değerleri doldurun (bkz. docs/kurulum-ve-yayin.md)
npm run build
npm run start                # http://localhost:3000
```
Geliştirme için `npm run dev`. Anahtarlar girilmeden de site açılır; Firebase, Resend ve
depolamaya bağlı özellikler (admin girişi, bülten, dergi yükleme, sertifika) çalışmaz.

## Klasör yapısı
| Yol | İçerik |
|---|---|
| `src/app/[locale]/` | Herkese açık sayfalar (klasör adları Türkçe, adresler İngilizce) |
| `src/app/admin/` | Admin paneli |
| `src/app/api/` | Sunucu uçları |
| `src/components/` | Ortak bileşenler (navbar, footer, dergi okuyucu, arayüz parçaları) |
| `src/config/` | `site.ts` (kulüp bilgileri), `links.ts` (dış bağlantılar), `features.ts` (bölüm aç/kapa) |
| `src/data/` | Ekip ve sponsor listeleri |
| `src/lib/` | Firebase, admin kontrolü, mail şablonları, hız sınırı, dergi yardımcıları |
| `src/i18n/`, `src/middleware.ts` | Dil ve adres yönlendirmeleri |
| `messages/` | Sitenin Türkçe ve İngilizce metinleri |
| `sertifikasyon sistemi/` | Sertifika sisteminin tamamı (şablonlar, üretim, doğrulama sayfası) |
| `public/images/` | Logo, ekip fotoğrafları, ana sayfa görseli |
| `firestore.rules` | Veritabanı erişim kuralları |

## Belgeler
- [Kurulum ve yayın](docs/kurulum-ve-yayin.md): hesaplar, ortam değişkenleri, Vercel'e yayın
- [İçerik yönetimi](docs/icerik-yonetimi.md): ekip, sponsorlar, metinler, dergi, etkinlik, bülten
- [Mimari ve güvenlik](docs/mimari.md): adres yapısı, veriler, sunucu uçları, güvenlik önlemleri

## Kişisel veriler
Ekip fotoğraflarının orijinalleri (`Fotograflar/`), kaynak logo dosyaları (`Logolar/`) ve
`.env.local` depoya girmez (`.gitignore`). Sitede yalnızca kişilerin izin verdiği bilgiler yayınlanır.
