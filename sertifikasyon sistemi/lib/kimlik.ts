// Karışabilecek karakterler (0/O, 1/I/L) çıkarılmış alfabe
const ALFABE = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Kriptografik rastgele sayı (tarayıcı ve sunucuda çalışır)
const rastgele = (sinir: number) => {
  const dizi = new Uint32Array(1);
  // Eşit dağılım için sınırın katı olmayan değerler atılır
  const tavan = Math.floor(0x100000000 / sinir) * sinir;
  do {
    crypto.getRandomValues(dizi);
  } while (dizi[0] >= tavan);
  return dizi[0] % sinir;
};

// Rastgele, tahmin edilemeyen doğrulama kimliği üretir: AERO-7K3M-Q9XD-2PLF
// İsim veya tarih içermez; 31^12 ≈ 7,9 × 10^17 olasılık.
export function kimlikUret(): string {
  const parca = () =>
    Array.from({ length: 4 }, () => ALFABE[rastgele(ALFABE.length)]).join('');
  return `AERO-${parca()}-${parca()}-${parca()}`;
}

// Kullanıcının yazdığı kimliği düzeltir: küçük harf, boşluk, eksik tire
export function kimlikTemizle(deger: string): string | null {
  const harfler = deger.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const govde = harfler.startsWith('AERO') ? harfler.slice(4) : harfler;
  if (govde.length !== 12 || [...govde].some((c) => !ALFABE.includes(c))) {
    return null;
  }
  return `AERO-${govde.slice(0, 4)}-${govde.slice(4, 8)}-${govde.slice(8)}`;
}
