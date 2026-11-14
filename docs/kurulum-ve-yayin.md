# Kurulum ve yayın

Tüm hesaplar kulübün ortak Gmail adresiyle açılır (kişisel hesaplarla değil).
Anahtar değerleri yalnızca `.env.local` dosyasına ve Vercel ayarlarına girilir; hiçbir yerde paylaşılmaz.

## 1. Ortam değişkenleri
`.env.example` dosyasını `.env.local` adıyla kopyalayın. Değişkenler ve nereden alındıkları:

| Değişken | Kaynak |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 adet) | Firebase Console → Project settings → Your apps → Web app |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Project settings → Service accounts → Generate new private key |
| `ADMIN_EMAILS` | Admin paneline girebilecek e-postalar, virgülle ayrılmış |
| `RESEND_API_KEY`, `RESEND_FROM` | Resend → API Keys; gönderen adres alan adı doğrulandıktan sonra |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | web3forms.com → kulüp e-postasıyla Access Key |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob deposu (projeye bağlanınca otomatik eklenir) |
| `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH` | Admin panelinden etkinlik/blog görseli yükleme için; sadece bu depoya "Contents: Read and write" yetkili fine-grained token |

`FIREBASE_PRIVATE_KEY` tırnak içinde, tek satırda yazılır (satır sonları `\n` olarak kalır).

## 2. Firebase
1. Yeni proje açın, **Authentication → Email/Password** yöntemini etkinleştirin.
2. **Yeni kullanıcı kaydını kapatın** (Authentication → Settings → User actions →
   "Enable create (sign-up)" kapalı). Admin hesapları sadece konsoldan açılır.
3. `ADMIN_EMAILS` içindeki her adres için Authentication → Users'dan kullanıcı oluşturun.
4. **Firestore** veritabanını açın ve `firestore.rules` içeriğini Rules sekmesine yapıştırıp yayınlayın.
5. İlk girişte admin paneli, kullanıcıya veritabanı yazma yetkisini (admin claim) otomatik verir.

Admin çıkarmak için: e-postayı `ADMIN_EMAILS`'ten silin **ve** Firebase'de kullanıcıyı silin veya devre dışı bırakın.

## 3. Resend (bülten, dergi duyurusu, sertifika mailleri)
1. Hesap açın, API anahtarı oluşturun.
2. **Alan adını doğrulayın** (Domains → DNS kayıtları). Doğrulanmadan sadece hesap sahibinin
   adresine mail gider; abonelere gitmez.
3. `RESEND_FROM` değerini doğrulanan alan adıyla yazın, ör. `ESTÜ AERO <bulten@alanadi.org>`.

## 4. Web3Forms (iletişim formu)
web3forms.com'da kulüp e-postasını girin; gelen Access Key'i `NEXT_PUBLIC_WEB3FORMS_KEY` olarak yazın.
Formdan gönderilen mesajlar bu adrese gelir.

## 5. GitHub ve Vercel
1. Kodu kulübün GitHub organizasyonundaki depoya gönderin.
2. Vercel'de **Add New → Project** ile bu depoyu seçin. Bağlanan deponun doğru olduğunu kontrol edin.
3. **Settings → Environment Variables**'a `.env.local`'daki değerleri girin.
4. **Storage → Create → Blob** ile bir depo açıp projeye bağlayın (`BLOB_READ_WRITE_TOKEN` eklenir).
5. Deploy edin. Sonraki her push otomatik yayına çıkar.

## 6. Alan adı
1. Vercel → Settings → Domains'e alan adını ekleyin, gösterilen DNS kayıtlarını alan adı sağlayıcısına girin.
2. `src/config/site.ts` içindeki `url` değerini gerçek alan adıyla değiştirin
   (site haritası, paylaşım görselleri, mail bağlantıları ve sertifika bağlantıları bunu kullanır).

## Yayından önce kontrol listesi
- [ ] Admin girişi: listedeki hesap girer, listede olmayan giremez
- [ ] Bülten: abonelik, hoş geldin maili, admin panelinde listeleme
- [ ] İletişim formu: mesaj kulüp e-postasına geliyor
- [ ] Dergi: PDF yükleme, kapak, yayınlama, abonelere duyuru
- [ ] Sertifika: oluşturma, mail, doğrulama sayfası, iptal
- [ ] Mobil ve koyu tema görünümü, tüm menü bağlantıları
