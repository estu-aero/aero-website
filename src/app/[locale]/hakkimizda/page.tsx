'use client';

import { useTranslations, useLocale } from 'next-intl';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  MonitorCog,
  Plane,
  BookOpen,
  Factory,
  Handshake,
  Eye,
  Target,
} from 'lucide-react';
import { SITE } from '@/config/site';

// Kartların sırası ve ikonları; metinler messages/*.json içindeki about.activities altında
const ACTIVITIES = [
  { key: 'sectorMeetings', icon: Users },
  { key: 'softwareTraining', icon: MonitorCog },
  { key: 'projectTeams', icon: Plane },
  { key: 'academic', icon: BookOpen },
  { key: 'technicalTrips', icon: Factory },
  { key: 'partnerships', icon: Handshake },
] as const;

export default function AboutPage() {
  const t = useTranslations('about');
  const locale = useLocale() as 'tr' | 'en';
  const introParagraphs = t.raw('intro') as string[];
  const missionPoints = t.raw('missionPoints') as string[];

  return (
    <SiteLayout>
      <section className="py-20 bg-gray-100 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tanıtım */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {t('title')}
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {introParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-lg text-muted-foreground leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
              <div className="bg-white dark:bg-slate-950 border-t-4 border-brand rounded-2xl p-6 mt-8">
                <p className="text-primary font-medium mb-3">
                  {t('callout', { period: SITE.period, year: SITE.foundedYear })}
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">{t('president')}:</span>{' '}
                    {SITE.president}
                  </p>
                  <p>
                    <span className="font-medium">{t('advisor')}:</span>{' '}
                    {SITE.advisor[locale]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Neler yapıyoruz */}
          <h3 className="text-2xl md:text-3xl font-bold text-primary text-center mb-3">
            {t('activitiesTitle')}
          </h3>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-10">
            {t('activitiesSubtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {ACTIVITIES.map(({ key, icon: Icon }) => (
              <Card
                key={key}
                className="hover:shadow-lg dark:hover:shadow-brand/20 dark:hover:ring-1 dark:hover:ring-brand/50 transition-shadow duration-300 rounded-2xl border-0 bg-white dark:bg-slate-950"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mb-4 text-brand">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-primary">
                    {t(`activities.${key}.title`)}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`activities.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vizyon ve misyon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-neutral-950 text-white p-8 lg:p-10">
              <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-6">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('vision')}</h3>
              <p className="text-lg text-neutral-300 leading-relaxed">
                {t('visionText')}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-950 p-8 lg:p-10">
              <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-6 text-white">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">
                {t('mission')}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {t('missionText')}
              </p>
              <div className="space-y-4">
                {missionPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-brand" />
                    <p className="text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
