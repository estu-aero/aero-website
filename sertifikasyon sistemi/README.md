# AERO Sertifikasyon Sistemi

Etkinlik katılımcılarına doğrulanabilir PDF sertifika üretir, mail ile gönderir ve sitede
herkese açık bir doğrulama sayfası sunar. Her şey admin panelinden yapılır;
kurulum, betik çalıştırma veya kod bilgisi gerekmez.

## Nasıl kullanılır
1. Admin paneli → **Sertifikalar**
2. Sertifika türünü, etkinlik adını ve tarihini seçin; sertifika metni otomatik dolar.
3. Katılımcıları yapıştırın (her satıra `Ad Soyad, e-posta`) veya CSV yükleyin.
4. **Önizle** ile bir deneme sertifikasına bakın, sonra **Sertifikaları oluştur**.
5. Listeyi kontrol edin, **Mail gönder** ile herkese sertifikasını iletin.

Katılımcıya giden mailde sertifika bağlantısı, doğrulama kimliği ve "LinkedIn'e Ekle" butonu vardır.
Hatalı verilen bir sertifika listeden **Sil** ile kalıcı olarak silinir: PDF depodan, kayıt veritabanından kalkar ve doğrulama sayfasında "bulunamadı" görünür. Bir gruptaki son sertifika silinince grup da silinir. Bu işlem geri alınamaz.

## Doğrulama
- Adres: `/certificate` (varsayılan dil İngilizce; sağ üstteki dil butonuyla Türkçe)
- Sertifikadaki bağlantı kimliği adrese ekler: `/certificate?id=AERO-XXXX-XXXX-XXXX`
- Görünen bilgiler: ad soyad, etkinlik, tarih, doğrulama kimliği. E-posta asla gösterilmez.

## Klasör yapısı
| Yol | İçerik |
|---|---|
| `sablonlar/` | Sertifika tasarımlarının boş PDF'leri: kurucu üye, katılım, koordinasyon (bkz. `sablonlar/OKUBENI.md`) |
| `sablon-uret.mts` | Şablonları üreten betik (tasarım değişince yeniden çalıştırılır) |
| `ayarlar.ts` | Şablon listesi, yazıların konumu ve boyutu, otomatik metinler |
| `fontlar/` | Sertifikaya basılan yazıların fontu (Liberation Sans, açık lisans) |
| `lib/` | PDF üretimi, doğrulama kimliği, mail şablonu |
| `api/` | Sunucu işlemleri (oluştur, önizle, gönder, sil, doğrula) |
| `sayfalar/` | Doğrulama sayfası ve admin sayfası |
| `mesajlar/` | Doğrulama sayfasının Türkçe ve İngilizce metinleri |

Next.js adresleri sadece `src/app` altından tanıdığı için orada bu klasördeki dosyaları
gösteren tek satırlık bağlantı dosyaları vardır:
- `src/app/[locale]/sertifika/page.tsx` → doğrulama sayfası
- `src/app/admin/certificates/page.tsx` → admin sayfası
- `src/app/api/certificates/verify/route.ts` ve `src/app/api/admin/certificates/*/route.ts` → sunucu işlemleri

## Veriler (Firestore)
| Koleksiyon | İçerik | Erişim |
|---|---|---|
| `certificates` | Belge kimliği = doğrulama kimliği; ad soyad, etkinlik, tarih, PDF adresi, durum | Sunucu (doğrulama API'si) ve admin |
| `certificate_events` | Sertifika grupları (etkinlik, metin, şablon, sayı, mail durumu) | Admin |
| `certificate_emails` | Katılımcı e-postaları (kişisel veri, ayrı tutulur) | Admin |

PDF'ler Vercel Blob'da `sertifikalar/` klasöründe, tahmin edilemeyen adreslerle saklanır.

## Gerekenler
`BLOB_READ_WRITE_TOKEN` (Vercel Blob), Firebase anahtarları, `RESEND_API_KEY` ve `ADMIN_EMAILS`.
Hepsi ana sitenin `.env.local` dosyasında; ayrı bir ayar gerekmez.

## Güvenlik
- Doğrulama kimliği rastgele üretilir; isim veya tarih içermez, tahmin edilemez.
- Mail şifresi saklanmaz; mailler Resend ile gönderilir.
- PDF'ler elle bir depoya yüklenmez; oluşturulunca otomatik olarak Vercel Blob'a gider.
