# İçerik yönetimi

Bir kısım içerik admin panelinden, bir kısmı koddaki dosyalardan güncellenir.
Dosya değişiklikleri GitHub'a gönderilince Vercel siteyi otomatik günceller.

## Admin panelinden (`/admin`)
| Bölüm | Ne yapılır |
|---|---|
| **Etkinlikler** | Etkinlik ekleme, düzenleme, silme (TR/EN başlık, açıklama, tarih, yer, kapak, başvuru formu) |
| **Dergi** | PDF seçilir; kapak ve sayfa sayısı otomatik okunur. Sayı no, tarih, başlık girilir → Yayınla veya Taslak. Yayındaki sayı "Abonelere duyur" ile mail olarak gönderilir |
| **Sertifikalar** | Tür, etkinlik ve katılımcı listesi → Önizle → Oluştur → Mail gönder. Ayrıntılar: `sertifikasyon sistemi/README.md` |
| **Bülten** | Abone listesi, abone silme, serbest duyuru maili |

## Dosyalardan
| Ne | Dosya |
|---|---|
| Kulüp adı, dönem, başkan, danışman, e-posta, sosyal medya, alan adı | `src/config/site.ts` |
| Üyelik formu bağlantısı | `src/config/links.ts` |
| Bölümleri aç/kapat (blog, takımlar, dergi, sertifika) | `src/config/features.ts` |
| Ekip listesi | `src/data/teamMembers.ts` |
| Sponsorlar | `src/data/sponsors.ts` (`active: false` olan gösterilmez) |
| Sayfa metinleri (Hakkımızda, iletişim, footer, gizlilik politikası…) | `messages/tr.json`, `messages/en.json` |
| Renkler | `src/app/globals.css` (`--brand` değişkenleri) |
| Sertifika şablonları ve yazı konumları | `sertifikasyon sistemi/sablonlar/`, `sertifikasyon sistemi/ayarlar.ts` |

### Ekip üyesi eklemek
`src/data/teamMembers.ts` içine bir kayıt eklenir:
```ts
{
  tr: { name: 'Ad Soyad', position: 'Görev', department: 'Bölüm' },
  en: { name: 'Ad Soyad', position: 'Position', department: 'Department' },
  image: '/images/team/ad-soyad.jpg', // isteğe bağlı; yoksa baş harfler görünür
  sinif: 2,                            // isteğe bağlı
  linkedin: 'https://www.linkedin.com/in/...', // isteğe bağlı
  email: '...',                        // isteğe bağlı
  section: 'boardOfDirectors',         // boardOfDirectors | administrativeBoard | auditBoard
}
```
Bölüm kartta görünür; sınıf, LinkedIn ve e-posta karta tıklayınca açılan pencerede görünür.
Fotoğraflar yüz ortalı 600×600 kırpılıp `public/images/team/` içine konur; orijinaller
`Fotograflar/` klasöründe kalır (depoya girmez). Kişisel bilgiler yalnızca kişinin izniyle eklenir.

### Takımları açmak
Proje takımları kurulunca `src/config/features.ts` içinde `subteams: true` yapılır ve takımlar
`src/app/[locale]/takimlar/page.tsx` içindeki `teams` listesine, metinleri `messages/*.json`
içindeki `subteams` bölümüne eklenir.

## Depolama sınırları
- Dergi PDF'i en fazla 50 MB; daha büyükse tasarımcıdan web için küçültülmüş sürüm istenir.
- Vercel Blob ücretsiz planı sınırlıdır; dergi ve sertifika dosyaları burada tutulur.
- Resend ücretsiz planında günlük ve aylık mail sınırı vardır; abone sayısı büyürse plan gözden geçirilir.
