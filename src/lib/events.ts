// Etkinlik durumu yardımcıları.
// Admin bir etkinliği "yaklaşan" bırakmayı unutsa bile, tarihi geçen etkinlik sitede
// kendiliğinden "geçmiş" sayılır (başvuru düğmesi de gizlenir).

// Türkiye saatine göre bugünün tarihi: YYYY-AA-GG
const bugun = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());

// Etkinlik günü dahil "yaklaşan" sayılır; ertesi gün geçmiş olur.
export const etkinlikGectiMi = (date: string) =>
  /^\d{4}-\d{2}-\d{2}/.test(date) && date.slice(0, 10) < bugun();

export const gecerliDurum = (event: { status: string; date: string }): 'upcoming' | 'past' =>
  event.status === 'past' || etkinlikGectiMi(event.date) ? 'past' : 'upcoming';
