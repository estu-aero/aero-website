'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Check, CircleCheck, Copy, Download, Loader2, Moon, SearchX, ShieldCheck, Sun } from 'lucide-react';
import { SITE } from '@/config/site';
import { buildLocalizedPath, ENGLISH_ROUTES } from '@/i18n/paths';
import { kimlikTemizle } from '../lib/kimlik';

// PDF görüntüleyici sadece tarayıcıda çalışır
const SertifikaOnizleme = dynamic(() => import('./SertifikaOnizleme'), { ssr: false });

type Bulunan = {
  tur: 'bulundu';
  id: string;
  name: string;
  eventName: string;
  eventNameEn: string;
  date: string;
  status: 'valid';
  pdfUrl: string | null;
};
type Sonuc = Bulunan | { tur: 'hata'; anahtar: 'notFound' | 'invalidId' | 'tooMany' | 'error' };

// "2026-10-24" -> "24.10.2026"
const tarihYaz = (tarih: string) => {
  const [yil, ay, gun] = tarih.split('-');
  return yil && ay && gun ? `${gun}.${ay}.${yil}` : tarih;
};

// Vercel Blob adresine ?download=1 eklenince tarayıcı dosyayı açmak yerine indirir
const indirmeAdresi = (url: string) => `${url}${url.includes('?') ? '&' : '?'}download=1`;

// Sertifika doğrulama sayfası. Sitenin menüsü olmadan, kendi sade başlığıyla açılır;
// varsayılan dil İngilizce (bkz. middleware), varsayılan tema koyu.
export default function DogrulamaSayfasi() {
  const t = useTranslations('certificate');
  const locale = useLocale() as 'tr' | 'en';
  const router = useRouter();
  const pathname = usePathname();
  // Tema sadece bu sayfanın içinde uygulanır; açılışta koyu
  const [koyu, setKoyu] = useState(true);
  const [kimlik, setKimlik] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  // Logo siteye, sitenin en son gezildiği dilde döner (varsayılan Türkçe)
  const [siteDili, setSiteDili] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SITE.siteLocaleKey) === 'en') setSiteDili('en');
    } catch {
      // Depolama kapalıysa varsayılan dil
    }
  }, []);

  const dogrula = async (girilen: string) => {
    const temiz = kimlikTemizle(girilen);
    if (!temiz) {
      setSonuc({ tur: 'hata', anahtar: 'invalidId' });
      return;
    }
    setKimlik(temiz);
    // Adres çubuğu güncellenir: bağlantı paylaşılabilir, dil değişince kimlik korunur
    const adres = new URL(window.location.href);
    adres.search = `?id=${temiz}`;
    window.history.replaceState(null, '', adres);

    setYukleniyor(true);
    setSonuc(null);
    setKopyalandi(false);
    try {
      const yanit = await fetch(`/api/certificates/verify?id=${encodeURIComponent(temiz)}`);
      const veri = await yanit.json().catch(() => ({}));
      if (yanit.ok) setSonuc({ tur: 'bulundu', ...veri });
      else if (yanit.status === 404) setSonuc({ tur: 'hata', anahtar: 'notFound' });
      else if (yanit.status === 400) setSonuc({ tur: 'hata', anahtar: 'invalidId' });
      else if (yanit.status === 429) setSonuc({ tur: 'hata', anahtar: 'tooMany' });
      else setSonuc({ tur: 'hata', anahtar: 'error' });
    } catch {
      setSonuc({ tur: 'hata', anahtar: 'error' });
    } finally {
      setYukleniyor(false);
    }
  };

  // Sertifikadaki veya maildeki bağlantıdan gelindiyse kimlik adres çubuğunda olur
  // (?id=... veya eski biçim ?credentialID=...)
  useEffect(() => {
    const parametreler = new URLSearchParams(window.location.search);
    const gelen = parametreler.get('id') || parametreler.get('credentialID');
    if (gelen) {
      setKimlik(gelen);
      dogrula(gelen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diliDegistir = () => {
    const yeni = locale === 'tr' ? 'en' : 'tr';
    router.replace(buildLocalizedPath(pathname, yeni) + window.location.search);
  };

  const baglantiyiKopyala = async (id: string) => {
    const adres = `${window.location.origin}/certificate?id=${id}`;
    try {
      await navigator.clipboard.writeText(adres);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    } catch {
      window.prompt(t('copy'), adres);
    }
  };

  const ikincilButon =
    'inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted';

  return (
    <div className={koyu ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Sade başlık: logo, kulüp adı, tema ve dil butonları */}
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href={buildLocalizedPath(ENGLISH_ROUTES.home, siteDili)} className="flex items-center gap-4">
            <div className="relative h-9 w-32 shrink-0 sm:h-10 sm:w-36">
              <Image
                src={koyu ? '/images/logo/aero-logo-dark.png' : '/images/logo/aero-logo-light.png'}
                alt={SITE.shortName}
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold">{SITE.university[locale]}</span>
              <span className="text-sm text-muted-foreground">
                {locale === 'tr' ? 'Uçak ve Uzay Kulübü' : 'Aeronautics and Aerospace Club'}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKoyu((d) => !d)}
              aria-label={t('toggleTheme')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
            >
              {koyu ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={diliDegistir}
              aria-label={t('toggleLanguage')}
              className="flex h-11 min-w-14 items-center justify-center rounded-full border border-border px-4 text-sm font-bold transition-colors hover:bg-muted"
            >
              {locale === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
          <div className="grid overflow-hidden rounded-md border border-border bg-card md:grid-cols-[400px_1fr]">
            {/* Sol panel */}
            <div className="bg-brand dark:bg-brand-dark px-8 py-10 text-white sm:px-9 sm:py-11">
              <span className="mb-6 inline-flex items-center gap-2 rounded-sm bg-white/15 px-4 py-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {t('badge')}
              </span>
              <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl">{t('title')}</h1>
              <p className="text-lg leading-relaxed text-white/90">{t('description')}</p>
            </div>

            {/* Sağ panel */}
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dogrula(kimlik);
                }}
              >
                <label htmlFor="credential-id" className="mb-3 block font-semibold">
                  {t('inputLabel')}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="credential-id"
                    value={kimlik}
                    onChange={(e) => setKimlik(e.target.value)}
                    placeholder={t('placeholder')}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={40}
                    className="h-[62px] w-full min-w-0 sm:flex-1 rounded-sm border border-border bg-background px-5 text-lg outline-none transition-colors placeholder:text-muted-foreground focus:border-brand dark:focus:border-brand-dark"
                  />
                  <button
                    type="submit"
                    disabled={yukleniyor || !kimlik.trim()}
                    className="inline-flex h-[62px] items-center justify-center gap-2 rounded-sm bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-dark dark:bg-brand-dark dark:hover:bg-[#8A1220] disabled:opacity-60"
                  >
                    {yukleniyor && <Loader2 className="h-4 w-4 animate-spin" />}
                    {yukleniyor ? t('verifying') : t('verify')}
                  </button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t('helper')}</p>
              </form>

              {sonuc?.tur === 'bulundu' && (
                <div className="mt-8">
                                      <div className="flex gap-3 rounded-sm border border-green-300 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-950/60">
                      <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-lg font-semibold text-green-700 dark:text-green-400">{t('validTitle')}</p>
                        <p className="text-green-700 dark:text-green-400/90">{t('validText')}</p>
                      </div>
                    </div>

                  <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-lg">
                    <dt className="text-muted-foreground">{t('name')}</dt>
                    <dd className="font-bold">{sonuc.name}</dd>
                    <dt className="text-muted-foreground">{t('event')}</dt>
                    <dd className="font-bold">{(locale === 'en' && sonuc.eventNameEn) || sonuc.eventName}</dd>
                    <dt className="text-muted-foreground">{t('date')}</dt>
                    <dd className="font-bold">{tarihYaz(sonuc.date)}</dd>
                    <dt className="text-muted-foreground">{t('credentialId')}</dt>
                    <dd className="self-center break-all font-mono text-base">{sonuc.id}</dd>
                  </dl>

                  {sonuc.pdfUrl && (
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a
                        href={indirmeAdresi(sonuc.pdfUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark dark:bg-brand-dark dark:hover:bg-[#8A1220]"
                      >
                        <Download className="h-4 w-4" />
                        {t('download')}
                      </a>
                      <button type="button" onClick={() => baglantiyiKopyala(sonuc.id)} className={ikincilButon}>
                        {kopyalandi ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        {kopyalandi ? t('copied') : t('copy')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {sonuc?.tur === 'hata' && (
                <div className="mt-8 flex gap-3 rounded-sm border border-border bg-muted/40 px-5 py-4">
                  <SearchX className="mt-0.5 h-6 w-6 shrink-0 text-brand" />
                  <div>
                    <p className="text-lg font-semibold">{t(`errors.${sonuc.anahtar}.title`)}</p>
                    <p className="text-muted-foreground">{t(`errors.${sonuc.anahtar}.text`)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Geçerli sertifikanın belgesi aynı sayfada, kartın altında */}
          {sonuc?.tur === 'bulundu' && sonuc.status === 'valid' && sonuc.pdfUrl && (
            <div className="mt-6 rounded-md border border-border bg-card p-3 sm:p-6">
              <SertifikaOnizleme
                key={sonuc.id}
                pdfUrl={sonuc.pdfUrl}
                baslik={`${sonuc.name} - ${sonuc.id}`}
                yukleniyorMetni={t('loadingDocument')}
                hataMetni={t('documentError')}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
