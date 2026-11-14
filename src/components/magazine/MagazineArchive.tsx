'use client';

import Image from 'next/image';
import { BookOpen, Download, Calendar, FileText } from 'lucide-react';
import {
  type MagazineIssue,
  issueTitle,
  issueDescription,
  formatIssueDate,
  downloadUrl,
} from '@/lib/magazine';

export interface ArchiveLabels {
  latest: string;
  previous: string;
  read: string;
  download: string;
  // "{count} sayfa" biçiminde; {count} sayfa sayısıyla değiştirilir
  pages: string;
}

interface MagazineArchiveProps {
  // En yeni sayı başta olacak şekilde sıralı
  issues: MagazineIssue[];
  locale: string;
  labels: ArchiveLabels;
  onRead: (issue: MagazineIssue) => void;
}

function Cover({
  issue,
  locale,
  className = '',
}: {
  issue: MagazineIssue;
  locale: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[600/849] overflow-hidden rounded-lg bg-neutral-200 shadow-lg ring-1 ring-black/10 dark:bg-neutral-800 ${className}`}
    >
      <Image
        src={issue.coverUrl}
        alt={issueTitle(issue, locale)}
        fill
        sizes="(max-width: 768px) 50vw, 300px"
        className="object-cover"
      />
    </div>
  );
}

// Son sayı büyük ve öne çıkmış; altında önceki sayıların kapak ızgarası
export function MagazineArchive({
  issues,
  locale,
  labels,
  onRead,
}: MagazineArchiveProps) {
  const [latest, ...older] = issues;
  if (!latest) return null;

  return (
    <>
      <div className="grid grid-cols-1 items-center gap-8 rounded-2xl bg-white p-6 dark:bg-slate-950 md:grid-cols-[minmax(0,300px)_1fr] md:gap-12 md:p-10">
        <button
          type="button"
          onClick={() => onRead(latest)}
          aria-label={`${labels.read}: ${issueTitle(latest, locale)}`}
          className="mx-auto w-full max-w-[300px] transition-transform hover:-translate-y-1"
        >
          <Cover issue={latest} locale={locale} />
        </button>
        <div>
          <span className="mb-4 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {labels.latest}
          </span>
          <h3 className="mb-3 text-3xl font-bold text-primary md:text-4xl">
            {issueTitle(latest, locale)}
          </h3>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatIssueDate(latest.date, locale)}
            </span>
            {latest.pages > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {labels.pages.replace('{count}', String(latest.pages))}
              </span>
            )}
          </div>
          {issueDescription(latest, locale) && (
            <p className="mb-6 max-w-xl leading-relaxed text-muted-foreground">
              {issueDescription(latest, locale)}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onRead(latest)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <BookOpen className="h-4 w-4" />
              {labels.read}
            </button>
            <a
              href={downloadUrl(latest.pdfUrl)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-brand px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
            >
              <Download className="h-4 w-4" />
              {labels.download}
            </a>
          </div>
        </div>
      </div>

      {older.length > 0 && (
        <>
          <h3 className="mb-8 mt-16 text-2xl font-bold text-primary">
            {labels.previous}
          </h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {older.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => onRead(issue)}
                className="group text-left"
              >
                <Cover
                  issue={issue}
                  locale={locale}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                />
                <p className="mt-3 font-semibold text-primary group-hover:text-brand">
                  {issueTitle(issue, locale)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatIssueDate(issue.date, locale)}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
