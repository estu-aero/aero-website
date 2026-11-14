import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { buildLocalizedPath, ENGLISH_ROUTES } from '@/i18n/paths';
import { MEMBERSHIP_FORM_URL } from '@/config/links';
import { SITE } from '@/config/site';

export default function HomePage() {
  const t = useTranslations('hero');
  const locale = useLocale() as 'tr' | 'en';

  return (
    <SiteLayout>
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-neutral-950">
        {/* Arka plan fotoğrafı; yazıların okunması için soldan koyulaşan geçiş */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src="/images/hero/uzay-arka-plan.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/75 to-neutral-950/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />
          {/* Dar ekranda yazı fotoğrafın parlak kısmının üstüne geldiği için ek karartma */}
          <div className="absolute inset-0 bg-neutral-950/55 md:hidden" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-brand-light mb-6">
              {SITE.university[locale]}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {SITE.fullName[locale]}
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl leading-relaxed">
              {t('description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={buildLocalizedPath(ENGLISH_ROUTES.about, locale)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-dark px-7 py-3 font-medium text-white transition-colors"
              >
                {t('cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {MEMBERSHIP_FORM_URL !== '#' && (
                <a
                  href={MEMBERSHIP_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 hover:bg-white/10 px-7 py-3 font-medium text-white transition-colors"
                >
                  {t('joinUs')}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
