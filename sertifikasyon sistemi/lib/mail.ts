import { SITE } from '@/config/site';
import { sablonTuru } from '../ayarlar';

const KIRMIZI = '#B0182A';
const LINKEDIN_MAVI = '#0A66C2';

export const dogrulamaAdresi = (kimlik: string) =>
  `${SITE.url}/certificate?id=${encodeURIComponent(kimlik)}`;

const kacis = (deger: string) =>
  deger
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// LinkedIn profiline "Lisans ve Sertifikalar" olarak ekleme bağlantısı
export function linkedinAdresi(kimlik: string, etkinlik: string, tarih: string) {
  const [yil, ay] = tarih.split('-');
  const parametreler = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: etkinlik,
    // Kuruluş kimliğiyle eklenince sertifika kulübün LinkedIn sayfasına bağlanır (logo görünür)
    organizationId: SITE.linkedinOrgId,
    issueYear: yil,
    issueMonth: String(Number(ay)),
    certUrl: dogrulamaAdresi(kimlik),
    certId: kimlik,
  });
  return `https://www.linkedin.com/profile/add?${parametreler.toString()}`;
}

// "2026-11-14" -> "14 Kasım 2026" / "14 November 2026"
export const tarihYaz = (tarih: string, dil: 'tr' | 'en' = 'tr') => {
  const t = new Date(`${tarih}T00:00:00`);
  if (Number.isNaN(t.getTime())) return tarih;
  return new Intl.DateTimeFormat(dil === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(t);
};

interface MailBilgisi {
  isim: string;
  etkinlik: string;
  tarih: string; // YYYY-AA-GG
  kimlik: string;
  sablon?: string; // kurucu-uye | katilim | koordinasyon
}

// Sertifika türüne göre mail başlığı ve metinleri
const TURLER: Record<string, { baslik: string; giris: (e: string) => string; kapanis: string; konu: (e: string) => string }> = {
  'kurucu-uye': {
    baslik: 'Kurucu Üye Sertifikası',
    giris: () =>
      `${SITE.fullName.tr}'nün kurucu üyeleri arasında yer aldığınız ve kulübümüzün temellerinin atılmasına verdiğiniz katkı için teşekkür ederiz. Sertifikanızın detayları aşağıdadır:`,
    kapanis: 'Kulübümüzün kuruluşundaki emeğiniz için minnettarız. Birlikte nice projeye imza atmayı diliyoruz.',
    konu: () => `${SITE.shortName} Kurucu Üye Sertifikanız`,
  },
  katilim: {
    baslik: 'Katılım Sertifikası',
    giris: (e) =>
      `<strong>${e}</strong> etkinliğimize katıldığınız için teşekkür ederiz. Sertifikanızın detayları aşağıdadır:`,
    kapanis: 'Etkinliğimize gösterdiğiniz ilgi için teşekkür ederiz. Gelecek etkinliklerimizde görüşmek dileğiyle.',
    konu: (e) => `${e} Katılım Sertifikanız`,
  },
  koordinasyon: {
    baslik: 'Koordinasyon Sertifikası',
    giris: (e) =>
      `<strong>${e}</strong> etkinliğimizin koordinasyon ekibinde gösterdiğiniz emek ve değerli katkılarınız için teşekkür ederiz. Sertifikanızın detayları aşağıdadır:`,
    kapanis: 'Etkinliğin başarıyla gerçekleşmesinde payınız büyük. İlerideki etkinliklerimizde de birlikte çalışmayı dileriz.',
    konu: (e) => `${e} Koordinasyon Sertifikanız`,
  },
};

// Türkçe mail, sitedeki doğrulama sayfasının Türkçe sürümüne yönlendirir
const sayfaAdresi = (kimlik: string) =>
  `${SITE.url}/certificate/tr?id=${encodeURIComponent(kimlik)}`;

const etiketsiz = (html: string) => html.replace(/<[^>]+>/g, '');

// Katılımcıya giden sertifika maili (Türkçe). Gmail <style> etiketini sildiği için stiller satır içinde.
export function sertifikaMaili(bilgi: MailBilgisi) {
  const tur = TURLER[sablonTuru(bilgi.sablon || '')] || TURLER.katilim;
  const isim = kacis(bilgi.isim);
  const etkinlik = kacis(bilgi.etkinlik);
  const goruntule = sayfaAdresi(bilgi.kimlik);
  const linkedin = linkedinAdresi(bilgi.kimlik, bilgi.etkinlik, bilgi.tarih);
  const site = SITE.url.replace(/^https?:\/\//, '');
  const buton = (adres: string, yazi: string, renk: string) =>
    `<td style="border-radius:6px; background-color:${renk};"><a href="${kacis(adres)}" style="display:inline-block; padding:13px 26px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;"><span style="color:#ffffff;">${yazi}</span></a></td>`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; font-family:Arial, Helvetica, sans-serif; color:#333333;">
  <tr><td style="background-color:#0a0a0a; border-bottom:4px solid ${KIRMIZI}; padding:24px; border-radius:8px 8px 0 0; text-align:center;">
    <p style="margin:0; font-size:13px; font-weight:bold; letter-spacing:3px; color:#9ca3af;">${SITE.shortName}</p>
    <h1 style="margin:6px 0 0 0; font-size:22px; color:#ffffff;">${tur.baslik}</h1>
  </td></tr>
  <tr><td style="padding:28px 32px 8px 32px; font-size:15px; line-height:1.6;">
    <p style="margin:0 0 14px 0;">Sevgili <strong>${isim}</strong>,</p>
    <p style="margin:0 0 18px 0;">${tur.giris(etkinlik)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#fbf2f3; border-left:4px solid ${KIRMIZI}; border-radius:4px;">
      <tr><td style="padding:14px 16px; font-size:14px; line-height:1.8;">
        Doğrulama Kimliği (Credential ID):<br>
        <strong style="font-size:15px; letter-spacing:0.5px;">${bilgi.kimlik}</strong><br>
        Veriliş Tarihi (Issued Date): <strong>${tarihYaz(bilgi.tarih)}</strong>
      </td></tr>
    </table>
    <p style="margin:14px 0 0 0; font-size:13px; line-height:1.5; color:#555555;">Sertifikanızın geçerliliği, yukarıdaki Doğrulama Kimliği ile <a href="${SITE.url}/certificate/tr" style="color:${KIRMIZI};">${site}/certificate</a> adresinden herkes tarafından doğrulanabilir.</p>
    <p style="margin:18px 0 0 0;">Sertifikanızı aşağıdaki butonla görüntüleyebilir ve indirebilirsiniz:</p>
  </td></tr>
  <tr><td align="center" style="padding:16px 32px 4px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      ${buton(goruntule, 'Sertifikayı Görüntüle', KIRMIZI)}
      <td width="12" style="font-size:0; line-height:0;">&nbsp;</td>
      ${buton(linkedin, "LinkedIn'e Ekle", LINKEDIN_MAVI)}
    </tr></table>
  </td></tr>
  <tr><td align="center" style="padding:10px 32px 0 32px; font-size:12px; line-height:1.5; color:#888888;">
    Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırabilirsiniz:<br>
    <a href="${kacis(goruntule)}" style="color:${KIRMIZI}; word-break:break-all;">${kacis(goruntule)}</a>
  </td></tr>
  <tr><td style="padding:22px 32px 26px 32px; font-size:15px; line-height:1.6;">
    <p style="margin:0 0 16px 0;">${tur.kapanis}</p>
    <p style="margin:0;">Saygılarımızla,<br><strong>${SITE.fullName.tr} (${SITE.shortName})</strong></p>
  </td></tr>
  <tr><td style="border-top:1px solid #eeeeee; padding:18px 32px 22px 32px; font-size:12px; line-height:1.7; color:#888888; text-align:center;">
    Bizi sosyal medyada takip edin:<br>
    <a href="${SITE.url}" style="color:#555555;">Web Sitesi</a> | <a href="${SITE.social.instagram}" style="color:#555555;">Instagram</a> | <a href="${SITE.social.linkedin}" style="color:#555555;">LinkedIn</a><br>
    © ${new Date().getFullYear()} ${SITE.shortName} · ${SITE.fullName.tr}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const metin = [
    `Sevgili ${bilgi.isim},`,
    '',
    etiketsiz(tur.giris(bilgi.etkinlik)),
    '',
    `Doğrulama Kimliği: ${bilgi.kimlik}`,
    `Veriliş Tarihi: ${tarihYaz(bilgi.tarih)}`,
    '',
    `Sertifikanızı görüntüleyin: ${goruntule}`,
    `LinkedIn'e ekleyin: ${linkedin}`,
    '',
    tur.kapanis,
    '',
    'Saygılarımızla,',
    `${SITE.fullName.tr} (${SITE.shortName})`,
  ].join('\n');

  return { konu: tur.konu(bilgi.etkinlik), html, metin };
}
