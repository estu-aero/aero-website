# Mimari ve güvenlik

## Adres yapısı ve dil
- Herkese açık adresler İngilizcedir ve dil soneki taşır: `/team/tr`, `/team/en`.
- `src/middleware.ts` bu adresleri iç sayfalara çevirir (`/team/tr` → `src/app/[locale]/ekibimiz`).
  Eşleşmeler `src/i18n/paths.ts` içindedir.
- Dil belirtilmemiş adresler Türkçeye yönlenir. İstisna: `/certificate` İngilizce açılır.
- `/join` adresi üyelik formuna yönlenir.
- Metinler `messages/{tr,en}.json` içindedir; sertifika doğrulama sayfasının metinleri
  `sertifikasyon sistemi/mesajlar/` içindedir ve `src/i18n/request.ts` tarafından birleştirilir.

## Veriler (Firestore)
| Koleksiyon | İçerik | Tarayıcıdan erişim |
|---|---|---|
| `events` | Etkinlikler | Herkes okur, admin yazar |
| `blog` | Blog yazıları (bölüm kapalı) | Herkes okur, admin yazar |
| `magazine` | Dergi sayıları | Herkes yayındakileri okur; taslak ve yazma admin |
| `newsletter` | Bülten aboneleri | Kapalı (sadece sunucu) |
| `certificates` | Sertifika doğrulama kayıtları | Admin okur; doğrulama sunucu üzerinden |
| `certificate_events` | Sertifika grupları | Admin okur |
| `certificate_emails` | Sertifika sahiplerinin e-postaları | Admin okur |

Tanımlanmayan her koleksiyon kapalıdır (`firestore.rules`). Dosyalar (etkinlik görselleri, dergi PDF'leri,
kapaklar, sertifikalar) Vercel Blob'da tahmin edilemeyen adreslerle tutulur.

## Sunucu uçları
| Uç | Erişim | Görev |
|---|---|---|
| `POST /api/newsletter/subscribe` | Herkes (doğrulama + hız sınırı) | Bülten aboneliği, hoş geldin maili |
| `POST /api/newsletter/campaign` | Admin | Abonelere duyuru maili |
| `GET, DELETE /api/admin/newsletter` | Admin | Abone listesi, abone silme |
| `POST /api/admin/session` | Giriş yapmış kullanıcı | Admin listesinde mi kontrolü, admin yetkisinin verilmesi |
| `POST /api/upload` | Admin | Etkinlik/blog görseli → Vercel Blob (dosya imzası, klasör listesi, 4 MB) |
| `POST, DELETE /api/admin/magazine/upload` | Admin | Dergi dosyası yükleme izni, silme |
| `POST /api/admin/magazine/announce` | Admin | Dergi sayısını abonelere duyurma |
| `GET /api/certificates/verify` | Herkes (hız sınırı) | Sertifika doğrulama |
| `/api/admin/certificates/*` | Admin | Sertifika oluşturma, önizleme, gönderme, silme |

## Güvenlik önlemleri
- **Admin kontrolü:** her admin ucu Firebase kimliğini doğrular ve e-postanın `ADMIN_EMAILS`
  içinde olduğunu kontrol eder (`src/lib/auth/require-admin.ts`). Admin paneli de açılırken sunucuya sorar.
- **Firestore yazma yetkisi** yalnızca sunucunun verdiği `admin` yetkisine (custom claim) bağlıdır.
- **Girdi doğrulama:** zod şemaları; e-posta, dil, uzunluk sınırları.
- **Hız sınırı:** abonelik (10 dakikada 5) ve sertifika doğrulama (dakikada 30). Bellekte tutulur;
  kötüye kullanımı yavaşlatır, kesin sınır değildir.
- **Güvenlik başlıkları** (`next.config.ts`): CSP, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS; `poweredByHeader: false`.
- **Arama motorları:** `/admin`, `/api`, `/login` dizine eklenmez (`robots.ts` + `X-Robots-Tag`).
- **Bağımlılıklar:** `npm audit --omit=dev` ile düzenli kontrol edilmelidir.
