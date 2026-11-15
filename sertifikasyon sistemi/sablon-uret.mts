// AERO sertifika şablonlarını (boş PDF) üretir.
// Tasarımı değiştirdikten sonra AERO klasöründen şu komutla çalıştırın:
//   node "sertifikasyon sistemi/sablon-uret.mts"
// Tasarımcının hazırladığı bir şablon kullanılacaksa bu betiğe gerek yoktur; PDF doğrudan sablonlar/ klasörüne konur.
import { readFile, writeFile } from 'node:fs/promises';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const KLASOR = 'sertifikasyon sistemi';
const W = 842;
const H = 595; // A4 yatay
const KIRMIZI = rgb(176 / 255, 24 / 255, 42 / 255);
const SIYAH = rgb(10 / 255, 10 / 255, 10 / 255);
const GRI = rgb(0.45, 0.45, 0.45);
const ACIK_GRI = rgb(0.82, 0.82, 0.82);

// Üstten oran -> pdf-lib koordinatı (alttan)
const y = (oran: number) => H - oran * H;

function aralikliYaz(sayfa: PDFPage, font: PDFFont, metin: string, boyut: number, ustOran: number, aralik: number, renk = KIRMIZI) {
  const harfler = [...metin];
  const genislik =
    harfler.reduce((t, h) => t + font.widthOfTextAtSize(h, boyut), 0) + aralik * (harfler.length - 1);
  let x = (W - genislik) / 2;
  for (const h of harfler) {
    sayfa.drawText(h, { x, y: y(ustOran), size: boyut, font, color: renk });
    x += font.widthOfTextAtSize(h, boyut) + aralik;
  }
}

function ortalaYaz(sayfa: PDFPage, font: PDFFont, metin: string, boyut: number, ustOran: number, renk = GRI, merkezX = W / 2) {
  const g = font.widthOfTextAtSize(metin, boyut);
  sayfa.drawText(metin, { x: merkezX - g / 2, y: y(ustOran), size: boyut, font, color: renk });
}

// universiteAdi: true -> logonun yanında "Eskişehir Teknik Üniversitesi" yazar; false -> sade tasarım
async function sablonUret(dosya: string, baslik: string, universiteAdi: boolean) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const normal = await pdf.embedFont(await readFile(`${KLASOR}/fontlar/LiberationSans-Regular.ttf`), { subset: true });
  const kalin = await pdf.embedFont(await readFile(`${KLASOR}/fontlar/LiberationSans-Bold.ttf`), { subset: true });
  const logo = await pdf.embedPng(await readFile('public/images/logo/aero-estu-logo-light.png'));
  const sayfa = pdf.addPage([W, H]);

  // Arka plan
  sayfa.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });

  // Üst şerit: siyah bant ve logodaki eğik çizgiyi hatırlatan kırmızı şerit
  sayfa.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: SIYAH });
  sayfa.drawSvgPath(`M ${W - 300} 0 L ${W - 240} 0 L ${W - 290} 34 L ${W - 350} 34 Z`, { x: 0, y: H, color: KIRMIZI });
  sayfa.drawSvgPath(`M ${W - 225} 0 L ${W - 205} 0 L ${W - 255} 34 L ${W - 275} 34 Z`, { x: 0, y: H, color: KIRMIZI });

  // Alt şerit
  sayfa.drawRectangle({ x: 0, y: 0, width: W, height: 8, color: KIRMIZI });

  // İnce çerçeve
  sayfa.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 34 - 26 - 12, borderColor: ACIK_GRI, borderWidth: 0.8 });

  // Logo (AERO | ESTÜ) ve sağında üniversite adı; ikisi birlikte ortalanır
  const logoYukseklik = 52;
  const logoGenislik = (logo.width / logo.height) * logoYukseklik;
  const ustSatir = 'Eskişehir Teknik Üniversitesi';
  const altSatir = 'Aeronautics and Aerospace';
  const ustBoyut = 15;
  const altBoyut = 12;
  const bosluk = 14;
  const yaziGenislik = universiteAdi
    ? Math.max(kalin.widthOfTextAtSize(ustSatir, ustBoyut), normal.widthOfTextAtSize(altSatir, altBoyut)) + bosluk
    : 0;
  const logoX = (W - (logoGenislik + yaziGenislik)) / 2;
  const logoAlt = y(0.255);
  sayfa.drawImage(logo, { x: logoX, y: logoAlt, width: logoGenislik, height: logoYukseklik });
  const yaziX = logoX + logoGenislik + bosluk;
  const orta = logoAlt + logoYukseklik / 2;
  if (universiteAdi) {
    // İki satır, logonun dikey ortasına hizalı
    sayfa.drawText(ustSatir, { x: yaziX, y: orta + 3, size: ustBoyut, font: kalin, color: SIYAH });
    sayfa.drawText(altSatir, { x: yaziX, y: orta - 14, size: altBoyut, font: normal, color: GRI });
  } else {
    // Sade tasarım: logonun altında kulübün adı
    ortalaYaz(sayfa, normal, 'Eskişehir Teknik Üniversitesi  ·  Uçak ve Uzay Kulübü', 10.5, 0.295);
  }

  // Sertifika türü
  aralikliYaz(sayfa, kalin, baslik, 27, 0.43, 6.5);
  // Başlığın altında kısa kırmızı çizgi
  sayfa.drawRectangle({ x: W / 2 - 22, y: y(0.46), width: 44, height: 2.2, color: KIRMIZI });

  // İsim alanı (boş) ve altındaki çizgi
  sayfa.drawLine({ start: { x: W * 0.28, y: y(0.68) }, end: { x: W * 0.72, y: y(0.68) }, thickness: 0.8, color: SIYAH });


  pdf.setTitle(`AERO ${baslik} şablonu`);
  pdf.setAuthor('ESTÜ Uçak ve Uzay Kulübü (AERO)');
  await writeFile(`${KLASOR}/sablonlar/${dosya}`, await pdf.save());
  console.log(dosya, 'tamam');
}

for (const [ad, baslik] of [
  ['kurucu-uye', 'KURUCU ÜYE'],
  ['katilim', 'KATILIM SERTİFİKASI'],
  ['koordinasyon', 'KOORDİNASYON SERTİFİKASI'],
] as const) {
  await sablonUret(`${ad}.pdf`, baslik, true); // üniversite adıyla
  await sablonUret(`${ad}-sade.pdf`, baslik, false); // sade
}
