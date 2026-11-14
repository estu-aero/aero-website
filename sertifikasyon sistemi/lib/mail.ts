import { SITE } from '@/config/site';

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
    organizationName: SITE.fullName.en,
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
  pdfUrl: string;
}

// Katılımcıya giden sertifika maili (Türkçe). Gmail <style> etiketini sildiği için stiller satır içinde.
export function sertifikaMaili(bilgi: MailBilgisi) {
  const isim = kacis(bilgi.isim);
  const etkinlik = kacis(bilgi.etkinlik);
  const dogrula = dogrulamaAdresi(bilgi.kimlik);
  const linkedin = linkedinAdresi(bilgi.kimlik, bilgi.etkinlik, bilgi.tarih);

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; font-family:Arial, Helvetica, sans-serif; color:#333333;">
  <tr><td style="background-color:#0a0a0a; border-bottom:4px solid ${KIRMIZI}; padding:22px 24px; border-radius:8px 8px 0 0; text-align:center;">
    <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:2px;">${SITE.shortName}</h1>
    <p style="margin:6px 0 0 0; font-size:14px; color:#d4d4d4;">Sertifikanız hazır</p>
  </td></tr>
  <tr><td style="padding:28px 32px 8px 32px; font-size:15px; line-height:1.6;">
    <p style="margin:0 0 14px 0;">Sevgili <strong>${isim}</strong>,</p>
    <p style="margin:0 0 18px 0;"><strong>${etkinlik}</strong> etkinliğimize katıldığınız için teşekkür ederiz. Sertifikanızın bilgileri aşağıdadır:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#fbf2f3; border-left:4px solid ${KIRMIZI}; border-radius:4px;">
      <tr><td style="padding:12px 16px; font-size:14px; line-height:1.7;">
        Doğrulama Kimliği (Credential ID): <strong>${bilgi.kimlik}</strong><br>
        Tarih (Issued Date): <strong>${tarihYaz(bilgi.tarih)}</strong>
      </td></tr>
    </table>
    <p style="margin:14px 0 0 0; font-size:13px; line-height:1.5; color:#555555;">Sertifikanızın geçerliliği bu kimlikle <a href="${dogrula}" style="color:${KIRMIZI};">web sitemizden</a> herkes tarafından doğrulanabilir.</p>
  </td></tr>
  <tr><td align="center" style="padding:16px 32px 8px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:6px; background-color:${KIRMIZI};">
        <a href="${kacis(bilgi.pdfUrl)}" style="display:inline-block; padding:12px 24px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;"><span style="color:#ffffff;">Sertifikayı Görüntüle</span></a>
      </td>
      <td width="12" style="font-size:0; line-height:0;">&nbsp;</td>
      <td style="border-radius:6px; background-color:${LINKEDIN_MAVI};">
        <a href="${kacis(linkedin)}" style="display:inline-block; padding:12px 24px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none;"><span style="color:#ffffff;">LinkedIn'e Ekle</span></a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:20px 32px 28px 32px; font-size:12px; line-height:1.5; color:#888888; text-align:center;">
    ${SITE.fullName.tr} · <a href="mailto:${SITE.email}" style="color:#888888;">${SITE.email}</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const metin = [
    `Sevgili ${bilgi.isim},`,
    '',
    `${bilgi.etkinlik} etkinliğimize katıldığınız için teşekkür ederiz.`,
    `Doğrulama Kimliği: ${bilgi.kimlik}`,
    `Tarih: ${tarihYaz(bilgi.tarih)}`,
    '',
    `Sertifikanız: ${bilgi.pdfUrl}`,
    `Doğrulama: ${dogrula}`,
    `LinkedIn'e ekle: ${linkedin}`,
    '',
    SITE.fullName.tr,
  ].join('\n');

  return {
    konu: `${bilgi.etkinlik} - Sertifikanız`,
    html,
    metin,
  };
}
