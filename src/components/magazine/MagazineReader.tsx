'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
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

// A4 dikey sayfa oranı (yükseklik / genişlik); sayfa boyutunu ekrana sığdırmak için kullanılır
const PAGE_RATIO = 1.414;

export default function MagazineReader({
  title,
  pdfUrl,
  downloadHref,
  onClose,
  initialMode = 'spread',
  labels,
}: MagazineReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<ReaderMode>(initialMode);
  const [size, setSize] = useState({ width: 0, height: 0 });
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

  // Geniş ekranda çift sayfa: kapak tek başına, sonra 2-3, 4-5...
  const twoUp = mode === 'spread' && size.width >= 900;
  const spreadStart = twoUp && page > 1 ? page - (page % 2) : page;
  const visiblePages = twoUp
    ? spreadStart === 1
      ? [1]
      : [spreadStart, spreadStart + 1].filter((p) => p <= numPages)
    : [page];

  const step = twoUp ? (spreadStart === 1 ? 1 : 2) : 1;
  const canPrev = spreadStart > 1;
  const canNext = visiblePages[visiblePages.length - 1] < numPages;

  const goPrev = useCallback(() => {
    setPage((current) => {
      const start = twoUp && current > 1 ? current - (current % 2) : current;
      return Math.max(1, start - (twoUp ? 2 : 1));
    });
  }, [twoUp]);

  const goNext = useCallback(() => {
    setPage((current) => {
      const start = twoUp && current > 1 ? current - (current % 2) : current;
      return Math.min(numPages || 1, start + step);
    });
  }, [twoUp, step, numPages]);

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
  const spreadPageWidth = Math.floor(
    Math.min(
      availableWidth / (twoUp ? 2 : 1),
      availableHeight / PAGE_RATIO
    )
  );
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
          download
          title={labels.download}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
        >
          <Download className="h-4 w-4" />
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
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages: total }) => setNumPages(total)}
          loading={loading}
          error={<p className="py-20 text-neutral-400">{labels.error}</p>}
          className={
            mode === 'scroll'
              ? 'flex flex-col items-center gap-4 py-4'
              : 'flex h-full items-center justify-center'
          }
        >
          {size.width > 0 &&
            numPages > 0 &&
            (mode === 'scroll'
              ? Array.from({ length: numPages }, (_, index) => (
                  <Page
                    key={index + 1}
                    pageNumber={index + 1}
                    width={scrollPageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl"
                  />
                ))
              : visiblePages.map((pageNumber) => (
                  <Page
                    key={pageNumber}
                    pageNumber={pageNumber}
                    width={spreadPageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl"
                  />
                )))}
        </Document>

        {mode === 'spread' && numPages > 0 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              aria-label={labels.previous}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-brand disabled:opacity-0 sm:left-4 sm:p-3"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              aria-label={labels.next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-brand disabled:opacity-0 sm:right-4 sm:p-3"
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
