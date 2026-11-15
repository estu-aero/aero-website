'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileUp,
  Loader2,
  Mail,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { adminFetch } from '@/lib/admin-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PARTI_BOYUTU, EN_FAZLA_KATILIMCI } from '../ayarlar';
import { dogrulamaAdresi, tarihYaz } from '../lib/mail';
import {
  GRUP_KOLEKSIYONU,
  SERTIFIKA_KOLEKSIYONU,
  EPOSTA_KOLEKSIYONU,
  type GrupKaydi,
  type Katilimci,
  type SertifikaKaydi,
} from '../lib/tipler';

type Sablon = { id: string; ad: string; dosya: string; metinSablonu: string; sabitTarih: string | null; var: boolean };
type Mesaj = { tur: 'basari' | 'hata'; metin: string } | null;
type GrupSertifikasi = SertifikaKaydi & { email: string };

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Ad Soyad, e-posta" satırlarını (veya CSV / Excel'den yapıştırılan tabloyu) okur
function katilimcilariOku(metin: string) {
  const katilimcilar: Katilimci[] = [];
  const hatalar: string[] = [];
  metin.split(/\r?\n/).forEach((satir, i) => {
    const temiz = satir.trim();
    if (!temiz) return;
    const parcalar = temiz.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''));
    const epostaSirasi = parcalar.findIndex((p) => p.includes('@'));
    // Başlık satırı (full_name,mail / ad,eposta) atlanır
    if (epostaSirasi === -1 && i === 0) return;
    const email = epostaSirasi >= 0 ? parcalar[epostaSirasi].toLowerCase() : '';
    const name = parcalar
      .filter((_, j) => j !== epostaSirasi)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!EPOSTA.test(email) || name.length < 2) {
      hatalar.push(`${i + 1}. satır okunamadı: "${temiz.slice(0, 60)}"`);
      return;
    }
    katilimcilar.push({ name, email });
  });

  const gorulen = new Set<string>();
  katilimcilar.forEach((k) => {
    if (gorulen.has(k.email)) hatalar.push(`Aynı e-posta birden fazla kez var: ${k.email}`);
    gorulen.add(k.email);
  });
  return { katilimcilar, hatalar };
}

const csvHucre = (deger: string) => `"${deger.replace(/"/g, '""')}"`;

export default function AdminSertifikalar() {
  const [sablonlar, setSablonlar] = useState<Sablon[]>([]);
  const [gruplar, setGruplar] = useState<GrupKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState<Mesaj>(null);

  // Form
  const [sablonId, setSablonId] = useState('katilim');
  const [etkinlik, setEtkinlik] = useState('');
  const [etkinlikEn, setEtkinlikEn] = useState('');
  const [tarih, setTarih] = useState('');
  const [metin, setMetin] = useState('');
  const [metinElleDegisti, setMetinElleDegisti] = useState(false);
  const [liste, setListe] = useState('');
  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const [ilerleme, setIlerleme] = useState({ yapilan: 0, toplam: 0 });
  const [onizleniyor, setOnizleniyor] = useState(false);

  // Gruplar
  const [acikGrup, setAcikGrup] = useState<string | null>(null);
  const [grupSertifikalari, setGrupSertifikalari] = useState<GrupSertifikasi[]>([]);
  const [mesgul, setMesgul] = useState<string | null>(null);

  const { katilimcilar, hatalar } = useMemo(() => katilimcilariOku(liste), [liste]);
  const secilenSablon = sablonlar.find((s) => s.id === sablonId);

  // Sabit tarihli türde (ör. kurucu üye) tarih otomatik dolar
  useEffect(() => {
    if (secilenSablon?.sabitTarih) setTarih(secilenSablon.sabitTarih);
  }, [secilenSablon]);

  // Etkinlik adı, tarih veya şablon değişince metin otomatik doldurulur (elle değiştirilmediyse)
  useEffect(() => {
    if (metinElleDegisti || !secilenSablon) return;
    setMetin(
      secilenSablon.metinSablonu
        .replace('{tarih}', tarih ? tarihYaz(tarih) : '[tarih]')
        .replace('{etkinlik}', etkinlik.trim() || '[etkinlik adı]')
    );
  }, [etkinlik, tarih, secilenSablon, metinElleDegisti]);

  const gruplariYukle = async () => {
    try {
      const anlik = await getDocs(collection(db, GRUP_KOLEKSIYONU));
      setGruplar(
        anlik.docs
          .map((d) => ({ id: d.id, ...d.data() }) as GrupKaydi)
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    } catch (hata) {
      console.error('Gruplar yüklenemedi:', hata);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const yanit = await adminFetch('/api/admin/certificates/preview');
        if (yanit.ok) setSablonlar((await yanit.json()).templates);
      } catch (hata) {
        console.error('Şablonlar yüklenemedi:', hata);
      }
      await gruplariYukle();
      setYukleniyor(false);
    })();
  }, []);

  const formHatasi = () => {
    if (!secilenSablon) return 'Bir şablon seçin.';
    if (!secilenSablon.var) return `Şablon dosyası yüklenmemiş: sertifikasyon sistemi/sablonlar/${secilenSablon.dosya}`;
    if (etkinlik.trim().length < 2) return 'Etkinlik adını yazın.';
    if (!tarih) return 'Etkinlik tarihini seçin.';
    if (metin.includes('[tarih]') || metin.includes('[etkinlik adı]') || metin.trim().length < 5) {
      return 'Sertifika metnini tamamlayın.';
    }
    return null;
  };

  const onizle = async () => {
    setMesaj(null);
    const hata = formHatasi();
    if (hata) return setMesaj({ tur: 'hata', metin: hata });
    // Tarayıcı açılır pencereyi engellemesin diye sekme önce açılır
    const sekme = window.open('', '_blank');
    setOnizleniyor(true);
    try {
      const yanit = await adminFetch('/api/admin/certificates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: sablonId,
          name: katilimcilar[0]?.name || 'Ad Soyad Örnek',
          text: metin,
        }),
      });
      if (!yanit.ok) throw new Error((await yanit.json().catch(() => ({}))).error || 'Önizleme oluşturulamadı.');
      const adres = URL.createObjectURL(await yanit.blob());
      if (sekme) sekme.location.href = adres;
      else window.open(adres, '_blank');
    } catch (hata) {
      sekme?.close();
      setMesaj({ tur: 'hata', metin: hata instanceof Error ? hata.message : 'Önizleme oluşturulamadı.' });
    } finally {
      setOnizleniyor(false);
    }
  };

  const olustur = async () => {
    setMesaj(null);
    const hata = formHatasi();
    if (hata) return setMesaj({ tur: 'hata', metin: hata });
    if (katilimcilar.length === 0) return setMesaj({ tur: 'hata', metin: 'Katılımcı listesi boş.' });
    if (hatalar.length > 0) return setMesaj({ tur: 'hata', metin: 'Önce listedeki hataları düzeltin.' });
    if (katilimcilar.length > EN_FAZLA_KATILIMCI) {
      return setMesaj({ tur: 'hata', metin: `Bir grupta en fazla ${EN_FAZLA_KATILIMCI} katılımcı olabilir.` });
    }
    if (!confirm(`${katilimcilar.length} kişi için "${etkinlik.trim()}" sertifikası oluşturulsun mu?\n\nMail bu adımda gönderilmez; oluşturduktan sonra ayrıca "Mail gönder"e basmanız gerekir.`)) return;

    setOlusturuluyor(true);
    setIlerleme({ yapilan: 0, toplam: katilimcilar.length });
    let eventId: string | undefined;
    try {
      for (let i = 0; i < katilimcilar.length; i += PARTI_BOYUTU) {
        const parti = katilimcilar.slice(i, i + PARTI_BOYUTU);
        const yanit = await adminFetch('/api/admin/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            eventId
              ? { eventId, participants: parti }
              : {
                  event: {
                    eventName: etkinlik.trim(),
                    eventNameEn: etkinlikEn.trim(),
                    date: tarih,
                    text: metin.trim(),
                    template: sablonId,
                  },
                  participants: parti,
                }
          ),
        });
        const veri = await yanit.json().catch(() => ({}));
        if (!yanit.ok) throw new Error(veri.error || 'Sertifikalar oluşturulamadı.');
        eventId = veri.eventId;
        setIlerleme({ yapilan: i + parti.length, toplam: katilimcilar.length });
      }
      setMesaj({
        tur: 'basari',
        metin: `${katilimcilar.length} sertifika oluşturuldu. Aşağıdaki listeden kontrol edip "Mail gönder" ile katılımcılara iletebilirsiniz.`,
      });
      setListe('');
      setEtkinlik('');
      setEtkinlikEn('');
      setTarih(secilenSablon?.sabitTarih ?? '');
      setMetinElleDegisti(false);
      await gruplariYukle();
      if (eventId) await grupAc(eventId, true);
    } catch (hata) {
      setMesaj({
        tur: 'hata',
        metin: `${hata instanceof Error ? hata.message : 'Hata oluştu.'}${eventId ? ' Bu ana kadar oluşturulanlar aşağıdaki listede.' : ''}`,
      });
      await gruplariYukle();
    } finally {
      setOlusturuluyor(false);
    }
  };

  const grupAc = async (id: string, zorla = false) => {
    if (acikGrup === id && !zorla) {
      setAcikGrup(null);
      return;
    }
    setAcikGrup(id);
    setGrupSertifikalari([]);
    try {
      const [sertifikalar, epostalar] = await Promise.all([
        getDocs(query(collection(db, SERTIFIKA_KOLEKSIYONU), where('eventId', '==', id))),
        getDocs(query(collection(db, EPOSTA_KOLEKSIYONU), where('eventId', '==', id))),
      ]);
      const epostaHaritasi = new Map(epostalar.docs.map((d) => [d.id, d.data().email as string]));
      setGrupSertifikalari(
        sertifikalar.docs
          .map((d) => ({ id: d.id, ...d.data(), email: epostaHaritasi.get(d.id) || '' }) as GrupSertifikasi)
          .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      );
    } catch (hata) {
      console.error('Sertifikalar yüklenemedi:', hata);
      setMesaj({ tur: 'hata', metin: 'Sertifika listesi yüklenemedi.' });
    }
  };

  // Sütunlar: ad soyad, e-posta, doğrulama kimliği, doğrulama adresi, durum
  const csvIndir = (grup: GrupKaydi) => {
    const satirlar = [
      ['full_name', 'mail', 'cid', 'url', 'status'],
      ...grupSertifikalari.map((s) => [s.name, s.email, s.id, dogrulamaAdresi(s.id), s.status]),
    ];
    const icerik = '﻿' + satirlar.map((r) => r.map(csvHucre).join(',')).join('\r\n');
    const adres = URL.createObjectURL(new Blob([icerik], { type: 'text/csv;charset=utf-8' }));
    const baglanti = document.createElement('a');
    baglanti.href = adres;
    baglanti.download = `sertifikalar-${grup.date}-${grup.eventName.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)}.csv`;
    baglanti.click();
    URL.revokeObjectURL(adres);
  };

  const mailGonder = async (grup: GrupKaydi) => {
    const tekrar = grup.sentAt ? 'Bu grubun mailleri daha önce gönderildi. Katılımcılar maili İKİNCİ KEZ alacak.\n\n' : '';
    if (!confirm(`${tekrar}"${grup.eventName}" sertifikaları ${grup.count} katılımcıya mail ile gönderilsin mi? Gönderilen mail geri alınamaz.`)) return;
    setMesgul(grup.id);
    setMesaj(null);
    try {
      const yanit = await adminFetch('/api/admin/certificates/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: grup.id }),
      });
      const veri = await yanit.json().catch(() => ({}));
      if (!yanit.ok || !veri.success) throw new Error(veri.error || 'Mailler gönderilemedi.');
      setMesaj({ tur: 'basari', metin: `Mailler gönderildi: ${veri.sent}/${veri.total}.` });
      await gruplariYukle();
    } catch (hata) {
      setMesaj({ tur: 'hata', metin: hata instanceof Error ? hata.message : 'Mailler gönderilemedi.' });
    } finally {
      setMesgul(null);
    }
  };

  // Sertifikayı kalıcı olarak siler (PDF depodan, kayıt veritabanından)
  const sertifikaSil = async (s: GrupSertifikasi) => {
    if (
      !confirm(
        `${s.name} adına verilen sertifika (${s.id}) KALICI olarak silinsin mi?

PDF depodan silinir, doğrulama sayfasında "bulunamadı" görünür. Bu işlem geri alınamaz.`
      )
    )
      return;
    setMesgul(s.id);
    try {
      const yanit = await adminFetch('/api/admin/certificates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      const veri = await yanit.json().catch(() => ({}));
      if (!yanit.ok) throw new Error(veri.error || 'Silme başarısız.');
      setGrupSertifikalari((liste) => liste.filter((x) => x.id !== s.id));
      if (veri.grupSilindi) setAcikGrup(null);
      await gruplariYukle();
      setMesaj({
        tur: 'basari',
        metin: veri.grupSilindi
          ? `${s.name} adına verilen sertifika silindi. Grupta başka sertifika kalmadığı için grup da silindi.`
          : `${s.name} adına verilen sertifika silindi.`,
      });
    } catch (hata) {
      setMesaj({ tur: 'hata', metin: hata instanceof Error ? hata.message : 'Silme başarısız.' });
    } finally {
      setMesgul(null);
    }
  };

  const csvYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setListe((await dosya.text()).replace(/^﻿/, ''));
    e.target.value = '';
  };

  const eksikSablonlar = sablonlar.filter((s) => !s.var);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sertifikalar</h1>
        <p className="mt-2 text-muted-foreground">
          Etkinlik katılımcılarına doğrulanabilir sertifika oluşturun ve mail ile gönderin.
        </p>
      </div>

      {mesaj && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${mesaj.tur === 'basari' ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100' : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'}`}
        >
          {mesaj.metin}
        </div>
      )}

      {!yukleniyor && eksikSablonlar.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <p>
            Şablon dosyası yüklenmemiş:{' '}
            {eksikSablonlar.map((s) => `${s.ad} (sablonlar/${s.dosya})`).join(', ')}.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Yeni Sertifika Grubu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sablon">1. Sertifika türü</Label>
              <select
                id="sablon"
                value={sablonId}
                onChange={(e) => setSablonId(e.target.value)}
                disabled={olusturuluyor}
                className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
              >
                {sablonlar.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                    {s.var ? '' : ' (şablon yok)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarih">2. Etkinlik tarihi</Label>
              <Input id="tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} disabled={olusturuluyor || Boolean(secilenSablon?.sabitTarih)} />
              {secilenSablon?.sabitTarih && (
                <p className="text-xs text-muted-foreground">Bu sertifika türünün veriliş tarihi sabittir.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="etkinlik">3. Etkinlik adı</Label>
              <Input id="etkinlik" placeholder="Örn: Havacılıkta Kariyer Zirvesi" value={etkinlik} onChange={(e) => setEtkinlik(e.target.value)} disabled={olusturuluyor} maxLength={150} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etkinlikEn">Etkinlik adı (İngilizce, isteğe bağlı)</Label>
              <Input id="etkinlikEn" placeholder="Doğrulama sayfasının İngilizce sürümünde görünür" value={etkinlikEn} onChange={(e) => setEtkinlikEn(e.target.value)} disabled={olusturuluyor} maxLength={150} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="metin">4. Sertifika üzerindeki metin</Label>
              {metinElleDegisti && (
                <button type="button" className="text-xs text-brand hover:underline" onClick={() => setMetinElleDegisti(false)}>
                  Otomatik metne dön
                </button>
              )}
            </div>
            <Textarea
              id="metin"
              rows={3}
              value={metin}
              onChange={(e) => {
                setMetin(e.target.value);
                setMetinElleDegisti(true);
              }}
              disabled={olusturuluyor}
              maxLength={600}
            />
            <p className="text-xs text-muted-foreground">Her satır sertifikada ayrı satır olarak basılır.</p>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="liste">5. Katılımcılar: her satıra &quot;Ad Soyad, e-posta&quot;</Label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand hover:underline">
                <FileUp className="h-4 w-4" />
                CSV dosyası yükle
                <input type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={csvYukle} disabled={olusturuluyor} />
              </label>
            </div>
            <Textarea
              id="liste"
              rows={8}
              placeholder={'Ayşe Yılmaz, ayse@ornek.com\nMehmet Demir, mehmet@ornek.com'}
              value={liste}
              onChange={(e) => setListe(e.target.value)}
              disabled={olusturuluyor}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Excel&apos;den iki sütunu kopyalayıp yapıştırabilir veya &quot;full_name,mail&quot; başlıklı bir CSV dosyası yükleyebilirsiniz.
              {katilimcilar.length > 0 && <strong className="text-foreground"> {katilimcilar.length} katılımcı okundu.</strong>}
            </p>
            {hatalar.length > 0 && (
              <ul className="space-y-1 rounded-md bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950 dark:text-red-100">
                {hatalar.slice(0, 10).map((h) => (
                  <li key={h}>{h}</li>
                ))}
                {hatalar.length > 10 && <li>... ve {hatalar.length - 10} hata daha</li>}
              </ul>
            )}
          </div>

          {olusturuluyor && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${ilerleme.toplam ? (ilerleme.yapilan / ilerleme.toplam) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {ilerleme.yapilan}/{ilerleme.toplam} sertifika oluşturuldu. Lütfen sayfayı kapatmayın.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onizle} disabled={olusturuluyor || onizleniyor}>
              {onizleniyor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Önizle
            </Button>
            <Button onClick={olustur} disabled={olusturuluyor} className="bg-brand hover:bg-brand-dark">
              {olusturuluyor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
              Sertifikaları oluştur
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            &quot;Önizle&quot; listedeki ilk kişinin adıyla deneme sertifikası açar; hiçbir şey kaydedilmez.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sertifika Grupları</CardTitle>
        </CardHeader>
        <CardContent>
          {yukleniyor ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : gruplar.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Henüz sertifika oluşturulmadı.</p>
          ) : (
            <div className="divide-y">
              {gruplar.map((grup) => (
                <div key={grup.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{grup.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {tarihYaz(grup.date)} · {sablonlar.find((s) => s.id === grup.template)?.ad || grup.template} · {grup.count} sertifika
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {grup.sentAt
                          ? `Mail gönderildi: ${grup.sentAt.toDate().toLocaleDateString('tr-TR')} (${grup.sentCount ?? 0} kişi)`
                          : 'Mail henüz gönderilmedi'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => grupAc(grup.id)}>
                        {acikGrup === grup.id ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                        Katılımcılar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => mailGonder(grup)} disabled={mesgul === grup.id}>
                        {mesgul === grup.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Mail gönder
                      </Button>
                    </div>
                  </div>

                  {acikGrup === grup.id && (
                    <div className="mt-4 rounded-lg border">
                      <div className="flex items-center justify-between border-b px-4 py-2">
                        <p className="text-sm font-medium">{grupSertifikalari.length} sertifika</p>
                        <Button variant="ghost" size="sm" onClick={() => csvIndir(grup)} disabled={grupSertifikalari.length === 0}>
                          <Download className="mr-2 h-4 w-4" />
                          CSV indir
                        </Button>
                      </div>
                      <div className="max-h-96 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-muted text-left text-xs">
                            <tr>
                              <th className="px-4 py-2">Ad Soyad</th>
                              <th className="px-4 py-2">E-posta</th>
                              <th className="px-4 py-2">Doğrulama kimliği</th>
                              <th className="px-4 py-2" />
                            </tr>
                          </thead>
                          <tbody>
                            {grupSertifikalari.map((s) => (
                              <tr key={s.id} className="border-t">
                                <td className="px-4 py-2">
                                  {s.name}
                                  {s.status === 'revoked' && <Badge className="ml-2 bg-brand text-white">İptal</Badge>}
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">{s.email}</td>
                                <td className="px-4 py-2 font-mono text-xs">
                                  <a href={s.pdfUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                                    {s.id}
                                  </a>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => sertifikaSil(s)}
                                    disabled={mesgul === s.id}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    {mesgul === s.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                    Sil
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
