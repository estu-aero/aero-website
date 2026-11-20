'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { BookOpen, Loader2 } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { MagazineArchive } from '@/components/magazine/MagazineArchive';
import { FEATURES } from '@/config/features';
import {
  MAGAZINE_COLLECTION,
  type MagazineIssue,
  issueTitle,
  downloadUrl,
  pdfDosyaAdi,
} from '@/lib/magazine';

// PDF okuyucu sadece tarayıcıda çalışır
const MagazineReader = dynamic(
  () => import('@/components/magazine/MagazineReader'),
  { ssr: false }
);

export default function MagazinePage() {
  const t = useTranslations('magazine');
  const locale = useLocale();
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<MagazineIssue | null>(null);

  useEffect(() => {
    async function loadIssues() {
      // Firebase anahtarları yoksa (yerel önizleme) sorgu hiç yanıt vermez; beklemeden boş durumu göster
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        // Sadece yayındaki sayılar (Firestore kuralları taslakları zaten göstermez)
        const snapshot = await getDocs(
          query(
            collection(db, MAGAZINE_COLLECTION),
            where('status', '==', 'published')
          )
        );
        const loaded = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as MagazineIssue)
          .sort((a, b) => b.number - a.number);
        setIssues(loaded);

        // Bülten mailindeki bağlantı: /magazine/tr?issue=4 doğrudan o sayıyı açar
        const wanted = Number(
          new URLSearchParams(window.location.search).get('issue')
        );
        const target = loaded.find((issue) => issue.number === wanted);
        if (target) setReading(target);
      } catch (error) {
        console.error('Error fetching magazine issues:', error);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  if (!FEATURES.magazine) notFound();

  return (
    <SiteLayout>
      <section className="bg-gray-100 py-20 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
              {t('title')}
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          ) : issues.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl bg-white p-12 text-center dark:bg-slate-950">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-primary">
                {t('emptyTitle')}
              </h3>
              <p className="text-muted-foreground">{t('emptyDescription')}</p>
            </div>
          ) : (
            <MagazineArchive
              issues={issues}
              locale={locale}
              onRead={setReading}
              labels={{
                latest: t('latest'),
                previous: t('previous'),
                read: t('read'),
                download: t('download'),
                pages: t.raw('pages') as string,
              }}
            />
          )}
        </div>
      </section>

      {reading && (
        <MagazineReader
          key={reading.id}
          title={`${t('title')} · ${issueTitle(reading, locale)}`}
          pdfUrl={reading.pdfUrl}
          downloadHref={downloadUrl(reading.pdfUrl)}
          downloadName={pdfDosyaAdi(reading)}
          onClose={() => setReading(null)}
          labels={{
            close: t('reader.close'),
            download: t('download'),
            pageMode: t('reader.pageMode'),
            scrollMode: t('reader.scrollMode'),
            previous: t('reader.previous'),
            next: t('reader.next'),
            loading: t('reader.loading'),
            error: t('reader.error'),
          }}
        />
      )}
    </SiteLayout>
  );
}
