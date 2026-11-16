import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { resend, isResendConfigured, EMAIL_FROM } from '@/lib/resend';
import { bultenAlanlari } from '@/lib/unsubscribe';

// Bülten aboneleri. Kayıt alanları: email, locale, subscribedAt, source,
// status ('pending' = onay bekliyor, 'active' = onaylı; alan yoksa onaylı sayılır), confirmedAt, confirmSentAt
export const ABONE_KOLEKSIYONU = 'newsletter';

// Hangi duyurunun kimlere gittiğinin kaydı: mail_log/{anahtar} -> { ids: abone kayıt kimlikleri }.
// E-posta adresi tutulmaz; tarayıcıdan erişime kapalıdır (firestore.rules).
const KAYIT_KOLEKSIYONU = 'mail_log';

// Bir seferde (bir tıklamada) en fazla bu kadar kişiye gönderilir.
// Resend tek istekte 100 mail kabul eder; ücretsiz planın günlük sınırı da 100'dür.
export const PARTI_SINIRI = 100;

export type Abone = { id: string; email: string; locale: 'tr' | 'en' };

// Onaylı aboneler (onay bekleyenlere duyuru gitmez)
export async function aktifAboneler(): Promise<Abone[]> {
  const snapshot = await adminDb.collection(ABONE_KOLEKSIYONU).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .filter(({ data }) => typeof data.email === 'string' && data.email && data.status !== 'pending')
    .map(({ id, data }) => ({
      id,
      email: data.email as string,
      locale: data.locale === 'en' ? ('en' as const) : ('tr' as const),
    }));
}

export const gonderimHatasi = (mesaj?: string) =>
  `Mail servisi gönderimi kabul etmedi${mesaj ? ` (${mesaj})` : ''}. Günlük gönderim sınırı (100 mail) dolmuş olabilir; yarın tekrar basarak kaldığı yerden devam edebilirsiniz.`;

export type GonderimSonucu = {
  sent: number; // bu seferde gönderilen
  remaining: number; // henüz almamış abone sayısı
  total: number; // toplam onaylı abone
  error?: string;
};

// Bir duyuruyu, henüz almamış abonelerden en fazla PARTI_SINIRI kişiye gönderir ve kimlere gittiğini kaydeder.
// Aynı anahtarla tekrar çağrılınca kaldığı yerden devam eder; kimse aynı maili iki kez almaz.
export async function bultenGonder(
  anahtar: string,
  mailOlustur: (abone: Abone) => { subject: string; html: string }
): Promise<GonderimSonucu> {
  const aboneler = await aktifAboneler();
  const total = aboneler.length;
  if (total === 0) return { sent: 0, remaining: 0, total: 0 };

  const kayitRef = adminDb.collection(KAYIT_KOLEKSIYONU).doc(anahtar);
  const kayit = await kayitRef.get();
  const gonderilenler = new Set<string>((kayit.data()?.ids as string[] | undefined) ?? []);
  const bekleyen = aboneler.filter((abone) => !gonderilenler.has(abone.id));
  const parti = bekleyen.slice(0, PARTI_SINIRI);
  if (parti.length === 0) return { sent: 0, remaining: 0, total };

  if (!isResendConfigured || !resend) {
    return { sent: 0, remaining: bekleyen.length, total, error: 'Mail servisi (Resend) ayarlı değil.' };
  }

  const { error } = await resend.batch.send(
    parti.map((abone) => {
      const mail = mailOlustur(abone);
      return {
        from: EMAIL_FROM,
        to: [abone.email],
        subject: mail.subject,
        ...bultenAlanlari(mail.html, abone.email, abone.locale),
      };
    })
  );
  if (error) {
    console.error('Newsletter batch error:', anahtar, error);
    return { sent: 0, remaining: bekleyen.length, total, error: gonderimHatasi(error.message) };
  }

  await kayitRef.set(
    { ids: FieldValue.arrayUnion(...parti.map((abone) => abone.id)), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { sent: parti.length, remaining: bekleyen.length - parti.length, total };
}
