// Admin panelinde toplu mail gönderiminden sonra gösterilen sonuç metni.
// Gönderim 100'er kişilik partilerle yapılır (Resend ücretsiz plan: günde 100 mail).
export function gonderimMesaji(data: { sent?: number; remaining?: number; total?: number }) {
  const gonderilen = data.sent ?? 0;
  const kalan = data.remaining ?? 0;
  const toplam = data.total ?? 0;
  if (gonderilen === 0 && kalan === 0) return 'Bu duyuru tüm abonelere zaten gönderilmiş; kimseye tekrar gönderilmedi.';
  return kalan > 0
    ? `${gonderilen} kişiye gönderildi. ${kalan} kişi kaldı (toplam ${toplam}). Günlük 100 mail sınırı nedeniyle kalanlara yarın aynı düğmeyle devam edin; daha önce alanlara tekrar gitmez.`
    : `${gonderilen} kişiye gönderildi. Duyuru tüm abonelere (${toplam}) ulaştı.`;
}
