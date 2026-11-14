import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFFont, PDFPage, PDFString, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { SablonAyari, YaziAyari } from '../ayarlar';

const KLASOR = path.join(process.cwd(), 'sertifikasyon sistemi');

export const sablonYolu = (dosya: string) => path.join(KLASOR, 'sablonlar', dosya);

// Şablon ve fontlar bir kez okunup bellekte tutulur
const onbellek = new Map<string, Promise<Uint8Array>>();
const dosyaOku = (yol: string) => {
  if (!onbellek.has(yol)) {
    onbellek.set(
      yol,
      readFile(yol)
        .then((b) => new Uint8Array(b))
        .catch((hata) => {
          onbellek.delete(yol);
          throw hata;
        })
    );
  }
  return onbellek.get(yol)!;
};

export async function sablonVarMi(dosya: string) {
  try {
    await dosyaOku(sablonYolu(dosya));
    return true;
  } catch {
    return false;
  }
}

const renk = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

// Yazının boyutunu, ayardaki en fazla genişliğe sığacak şekilde hesaplar
function sigdir(font: PDFFont, metinler: string[], ayar: YaziAyari, sayfaGenisligi: number) {
  let boyut = ayar.boyut * sayfaGenisligi;
  if (ayar.enFazlaGenislik) {
    const sinir = ayar.enFazlaGenislik * sayfaGenisligi;
    const enUzun = Math.max(...metinler.map((m) => font.widthOfTextAtSize(m, boyut)), 1);
    if (enUzun > sinir) boyut = boyut * (sinir / enUzun);
  }
  return boyut;
}

function yaz(sayfa: PDFPage, font: PDFFont, metin: string, ayar: YaziAyari, y: number, boyut: number) {
  const { width, height } = sayfa.getSize();
  const genislik = font.widthOfTextAtSize(metin, boyut);
  const x = ayar.hiza === 'ortala' ? ayar.x * width - genislik / 2 : ayar.x * width;
  // pdf-lib'de y alttan ölçülür; ayarlarda üstten veriliyor
  const altY = height - y * height;
  sayfa.drawText(metin, { x, y: altY, size: boyut, font, color: renk(ayar.renk) });
  return { x, y: altY, genislik };
}

export interface SertifikaBilgisi {
  isim: string;
  metin: string; // satırlar \n ile ayrılır
  kimlik: string;
  dogrulamaAdresi: string;
}

// Şablonun üzerine isim, etkinlik metni ve doğrulama bilgisini basar; PDF baytlarını döndürür
export async function sertifikaUret(
  sablon: SablonAyari,
  bilgi: SertifikaBilgisi
): Promise<Uint8Array> {
  const [sablonBayt, normalBayt, kalinBayt] = await Promise.all([
    dosyaOku(sablonYolu(sablon.dosya)),
    dosyaOku(path.join(KLASOR, 'fontlar', 'LiberationSans-Regular.ttf')),
    dosyaOku(path.join(KLASOR, 'fontlar', 'LiberationSans-Bold.ttf')),
  ]);

  const pdf = await PDFDocument.load(sablonBayt);
  pdf.registerFontkit(fontkit);
  // subset: sadece kullanılan harfler gömülür, dosya küçük kalır (Türkçe karakterler dahil)
  const normal = await pdf.embedFont(normalBayt, { subset: true });
  const kalin = await pdf.embedFont(kalinBayt, { subset: true });
  const font = (ayar: YaziAyari) => (ayar.kalin ? kalin : normal);

  const sayfa = pdf.getPages()[0];
  const { width, height } = sayfa.getSize();

  // İsim
  const isimFont = font(sablon.isim);
  yaz(sayfa, isimFont, bilgi.isim, sablon.isim, sablon.isim.y, sigdir(isimFont, [bilgi.isim], sablon.isim, width));

  // Etkinlik metni: tüm satırlar aynı boyutta, alt alta
  const satirlar = bilgi.metin.split('\n').map((s) => s.trim()).filter(Boolean);
  const metinFont = font(sablon.metin);
  const metinBoyutu = sigdir(metinFont, satirlar, sablon.metin, width);
  const satirYuksekligi = (metinBoyutu * sablon.metin.satirAraligi) / height;
  satirlar.forEach((satir, i) => {
    yaz(sayfa, metinFont, satir, sablon.metin, sablon.metin.y + i * satirYuksekligi, metinBoyutu);
  });

  // Doğrulama kimliği ve tıklanabilir bağlantı
  const kimlikFont = font(sablon.kimlik);
  // Sadece doğrulama bağlantısı basılır (kimlik bağlantının içinde)
  const kimlikMetni = bilgi.dogrulamaAdresi;
  const kimlikBoyutu = sigdir(kimlikFont, [kimlikMetni], sablon.kimlik, width);
  const konum = yaz(sayfa, kimlikFont, kimlikMetni, sablon.kimlik, sablon.kimlik.y, kimlikBoyutu);
  const baglanti = pdf.context.register(
    pdf.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [konum.x, konum.y - kimlikBoyutu * 0.3, konum.x + konum.genislik, konum.y + kimlikBoyutu],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(bilgi.dogrulamaAdresi) },
    })
  );
  sayfa.node.addAnnot(baglanti);

  pdf.setTitle(`${bilgi.isim} - ${bilgi.kimlik}`);
  pdf.setAuthor('ESTÜ Uçak ve Uzay Kulübü (AERO)');
  pdf.setSubject(bilgi.kimlik);

  return pdf.save();
}
