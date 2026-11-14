# Sertifika şablonları

Bu klasöre sertifika tasarımlarının **boş** PDF hâli konur (isim, metin ve kimlik alanları boş bırakılmış).

| Sertifika türü | Dosya adı |
|---|---|
| Kurucu Üye Sertifikası | `kurucu-uye.pdf` |
| Katılım Sertifikası | `katilim.pdf` |
| Koordinasyon Sertifikası | `koordinasyon.pdf` |

## Mevcut şablonlar
Buradaki üç PDF, sitenin kırmızı-siyah kimliğine göre `../sablon-uret.mts` betiğiyle üretildi.
Tasarımda değişiklik gerekirse betiği düzenleyip AERO klasöründen çalıştırın:

```
node "sertifikasyon sistemi/sablon-uret.mts"
```

Tasarımcının hazırladığı bir şablon kullanmak isterseniz aynı dosya adıyla bu klasöre koymanız yeterli.

## Şablon hazırlarken
- Tek sayfalık PDF olmalı (yatay veya dikey olabilir).
- İsmin, etkinlik metninin ve doğrulama kimliğinin geleceği yerler boş bırakılmalı.
- Fontlar PDF'e gömülü olmalı (Canva / Illustrator'dan "PDF olarak indir" yeterli).

## Yazıların yeri
İsim, metin ve doğrulama kimliğinin sayfadaki konumu ve boyutu `../ayarlar.ts` dosyasında.
Şablon değişince admin panelindeki **Önizle** butonuyla kontrol edilir; gerekirse oradaki
`x`, `y` ve `boyut` değerleri ayarlanır.

## Yeni sertifika türü eklemek
1. PDF'i bu klasöre koyun (ör. `konusmaci.pdf`).
2. `../ayarlar.ts` içindeki `SABLONLAR` listesine bir satır ekleyin.
