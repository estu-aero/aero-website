import { useTranslations } from 'next-intl';
import { SiteLayout } from '@/components/layout/SiteLayout';

type LegalSection = { title: string; paragraphs: string[] };

// Gizlilik Politikası ve Kullanım Şartları sayfalarının ortak görünümü.
// Metinler messages/*.json içindeki legal.<doc> altında.
export function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  const t = useTranslations(`legal.${doc}`);
  const sections = t.raw('sections') as LegalSection[];

  return (
    <SiteLayout>
      <section className="py-20 bg-gray-100 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto bg-white dark:bg-slate-950 rounded-2xl p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">{t('updated')}</p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {t('intro')}
            </p>

            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-muted-foreground leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </SiteLayout>
  );
}
