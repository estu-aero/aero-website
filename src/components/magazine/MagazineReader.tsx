'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { dergiIndir } from '@/lib/magazine';
import FlipBook, { type FlipBookHandle } from './FlipBook';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  BookOpen,
  ScrollText,
  Loader2,
} from 'lucide-react';

// PDF çözümleyici ayrı bir iş parçacığında çalışır; dosyası public/ içinden sunulur.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export type ReaderMode = 'spread' | 'scroll';

interface MagazineReaderProps {
  title: string;
  pdfUrl: string;
  // Verilmezse pdfUrl indirilir
  downloadHref?: string;
  // İndirilen dosyanın adı (ör. AERO-Dergi-Sayi-1.pdf)
  downloadName?: string;
  onClose: () => void;
  // spread: dergi gibi sayfa sayfa (geniş ekranda çift sayfa), scroll: alt alta kaydırmalı
  initialMode?: ReaderMode;
  labels: {
    close: string;
    download: string;
    pageMode: string;
    scrollMode: string;
    previous: string;
    next: string;
    loading: string;
    error: string;
  };
}


export default function MagazineReader({
  title,
  pdfUrl,
  downloadHref,
  downloadName,
  onClose,
  initialMode = 'spread',
  labels,
}: MagazineReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<ReaderMode>(initialMode);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [indiriliyor, setIndiriliyor] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Okuma alanının boyutunu izle
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Sayfa sayfa mod: kıvırmalı kitap (FlipBook). Görünen ilk sayfa ve çift sayfa durumu ondan gelir.
  const kitapRef = useRef<FlipBookHandle>(null);
  const [cift, setCift] = useState(false);
  const [kitapHatasi, setKitapHatasi] = useState(false);
  const goruneSonSayfa = cift && page > 1 ? Math.min(page + 1, numPages) : page;
  const visiblePages = goruneSonSayfa > page ? [page, goruneSonSayfa] : [page];
  const canPrev = page > 1;
  const canNext = goruneSonSayfa < numPages;
  const goPrev = useCallback(() => kitapRef.current?.prev(), []);
  const goNext = useCallback(() => kitapRef.current?.next(), []);

  // Klavye: ok tuşları ve Esc
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (mode !== 'spread') return;
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, goNext, goPrev, onClose]);

  // Okuyucu açıkken arkadaki sayfa kaymasın
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Sayfa genişliği: ekrana hem enine hem boyuna sığacak şekilde
  const padding = 32;
  const availableWidth = Math.max(0, size.width - padding * 2);
  const availableHeight = Math.max(0, size.height - padding);
  const scrollPageWidth = Math.floor(Math.min(availableWidth, 900));

  const loading = (
    <div className="flex items-center gap-2 text-neutral-400 py-20">
      <Loader2 className="h-5 w-5 animate-spin" />
      {labels.loading}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Üst çubuk */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
          {title}
        </p>

        <div className="flex rounded-lg bg-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setMode('spread')}
            aria-pressed={mode === 'spread'}
            title={labels.pageMode}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === 'spread' ? 'bg-brand text-white' : 'text-neutral-300 hover:text-white'}`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.pageMode}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('scroll')}
            aria-pressed={mode === 'scroll'}
            title={labels.scrollMode}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === 'scroll' ? 'bg-brand text-white' : 'text-neutral-300 hover:text-white'}`}
          >
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.scrollMode}</span>
          </button>
        </div>

        <a
          href={downloadHref ?? pdfUrl}
          download={downloadName}
          onClick={async (event) => {
            if (!downloadName) return;
            event.preventDefault();
            if (indiriliyor) return;
            setIndiriliyor(true);
            await dergiIndir(pdfUrl, downloadName);
            setIndiriliyor(false);
          }}
          aria-busy={indiriliyor}
          title={labels.download}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
        >
          {indiriliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">{labels.download}</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          title={labels.close}
          className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{labels.close}</span>
        </button>
      </div>

      {/* Okuma alanı */}
      <div
        ref={stageRef}
        className={`relative flex-1 ${mode === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {mode === 'spread' ? (
          kitapHatasi ? (
            <p className="py-20 text-center text-neutral-400">{labels.error}</p>
          ) : (
            <>
              {numPages === 0 && <div className="absolute inset-0 flex items-center justify-center">{loading}</div>}
              {size.width > 0 && (
                <FlipBook
                  ref={kitapRef}
                  pdfUrl={pdfUrl}
                  width={size.width}
                  height={size.height}
                  onLoad={setNumPages}
                  onPageChange={(ilk, ciftSayfa) => {
                    setPage(ilk);
                    setCift(ciftSayfa);
                  }}
                  onError={() => setKitapHatasi(true)}
                />
              )}
            </>
          )
        ) : (
          <Document
            file={pdfUrl}
            // Kütüphanenin bekleme (Suspense) modu kapalı: açıkken yeni bir sayfa yüklenirken
            // ekrandaki bütün sayfalar kısa süreliğine kaldırılıyordu
            suspense={false}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            loading={loading}
            error={<p className="py-20 text-neutral-400">{labels.error}</p>}
            className="flex flex-col items-center gap-4 py-4"
          >
            {size.width > 0 &&
              numPages > 0 &&
              Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={index + 1}
                  pageNumber={index + 1}
                  width={scrollPageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                />
              ))}
          </Document>
        )}

        {mode === 'spread' && numPages > 0 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              aria-label={labels.previous}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-brand disabled:opacity-0 sm:left-4 sm:p-3"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              aria-label={labels.next}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-brand disabled:opacity-0 sm:right-4 sm:p-3"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Alt çubuk: sayfa numarası */}
      {mode === 'spread' && numPages > 0 && (
        <div className="border-t border-white/10 py-2 text-center text-xs text-neutral-400">
          {visiblePages.join(' – ')} / {numPages}
        </div>
      )}
    </div>
  );
}
