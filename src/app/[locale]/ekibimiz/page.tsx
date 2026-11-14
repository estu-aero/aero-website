'use client';

import { useTranslations, useLocale } from 'next-intl';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { teamMembers, type TeamMemberData } from '@/data/teamMembers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Linkedin, Mail } from 'lucide-react';
import { MEMBERSHIP_FORM_URL } from '@/config/links';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { buildLocalizedPath, ENGLISH_ROUTES } from '@/i18n/paths';

export default function TeamPage() {
  const t = useTranslations('team');
  const locale = useLocale() as 'tr' | 'en';
  // Profil penceresi açık olan kişi
  const [secilen, setSecilen] = useState<TeamMemberData | null>(null);

  // Kurul rozet renkleri: kırmızı / siyah / gri
  const getBadgeClass = (sectionKey: string) => {
    switch (sectionKey) {
      case 'boardOfDirectors':
        return 'bg-brand text-white';
      case 'administrativeBoard':
        return 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900';
      default:
        return 'bg-neutral-500 text-white';
    }
  };

  // "Orman Emre Işıl" -> "OI"
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toLocaleUpperCase('tr-TR');
  };

  const renderSection = (
    sectionKey: 'boardOfDirectors' | 'administrativeBoard' | 'auditBoard',
    title: string
  ) => {
    const members = teamMembers.filter(
      (member) => member.section === sectionKey
    );

    // Yönetim (5 kişi: 3 + 2) ve İdari Kurul (6 kişi: 3 + 3) masaüstünde satırda 3 kart.
    // Kapsayıcı daraltılarak kart genişliği Denetim Kurulu'ndaki (satırda 4) kartlarla aynı tutulur.
    const threePerRow = sectionKey !== 'auditBoard';
    const rowClass = threePerRow ? 'lg:w-[calc(75%-0.5rem)] lg:mx-auto' : '';
    const cardWidthClass = threePerRow
      ? 'lg:w-[calc(33.333%-1.334rem)]'
      : 'lg:w-[calc(25%-1.5rem)]';

    return (
      <div key={sectionKey} className="mb-20">
        <h3
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ color: 'var(--brand)' }}
        >
          {title}
        </h3>
        {/* flex + justify-center: yarım kalan satırlar ortalanır */}
        <div className={`flex flex-wrap justify-center gap-8 ${rowClass}`}>
          {members.map((member, index) => {
            const memberData = member[locale];

            return (
              <Card
                key={index}
                role="button"
                tabIndex={0}
                aria-label={`${memberData.name} - ${t('viewProfile')}`}
                onClick={() => setSecilen(member)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSecilen(member);
                  }
                }}
                className={`w-full md:w-[calc(50%-1rem)] ${cardWidthClass} group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand hover:shadow-xl dark:hover:shadow-brand/20 dark:hover:ring-1 dark:hover:ring-brand/50 transition-all duration-300 rounded-2xl border-0 bg-white dark:bg-slate-950 hover:-translate-y-1`}
              >
                <CardContent className="p-6">
                  {/* Profile Image with Professional Frame */}
                  <div className="relative mb-6">
                    <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden bg-linear-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-1">
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={memberData.name}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        ) : (
                          // Fotoğraf yoksa baş harfler
                          <div
                            className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                            style={{ backgroundColor: 'var(--brand)' }}
                            aria-label={memberData.name}
                          >
                            {getInitials(memberData.name)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-primary mb-2">
                      {memberData.name}
                    </h3>

                    <Badge
                      className={`mb-3 px-3 py-1 rounded-full text-xs font-medium ${getBadgeClass(sectionKey)}`}
                    >
                      {memberData.position}
                    </Badge>

                    {memberData.department && (
                      <p className="text-sm font-medium" style={{ color: 'var(--brand)' }}>
                        {memberData.department}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SiteLayout>
      <section className="py-20 bg-gray-100 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Yönetim Kurulumuz / Board of Directors */}
          {renderSection('boardOfDirectors', t('sections.boardOfDirectors'))}

          {/* İdari Kurulumuz / Administrative Board */}
          {renderSection(
            'administrativeBoard',
            t('sections.administrativeBoard')
          )}

          {/* Denetim Kurulumuz / Audit Board */}
          {renderSection('auditBoard', t('sections.auditBoard'))}

          {/* Call to Action: başvuru formu linki girilene kadar gizli */}
          {MEMBERSHIP_FORM_URL !== '#' && (
          <div className="mt-16 text-center">
            <div className="bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-primary mb-4">
                {t('join')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('joinDescription')}
              </p>
              <button 
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg dark:shadow-brand/30 dark:hover:shadow-brand/50 dark:hover:ring-2 dark:hover:ring-brand/50"
                onClick={() => window.open(MEMBERSHIP_FORM_URL, '_blank')}
              >
                {t('joinButton')}
              </button>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Profil penceresi */}
      <Dialog open={secilen !== null} onOpenChange={(acik) => !acik && setSecilen(null)}>
        <DialogContent className="sm:max-w-md" closeLabel={t('close')}>
          {secilen && (
            <div className="text-center">
              <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-2xl bg-linear-to-br from-slate-200 to-slate-100 p-1 dark:from-slate-700 dark:to-slate-600">
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  {secilen.image ? (
                    <Image src={secilen.image} alt={secilen[locale].name} fill sizes="112px" className="object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-3xl font-bold text-white"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      {getInitials(secilen[locale].name)}
                    </div>
                  )}
                </div>
              </div>

              <DialogTitle className="mb-2 text-2xl font-bold text-primary">
                {secilen[locale].name}
              </DialogTitle>
              <Badge className={`mb-2 rounded-full px-3 py-1 text-xs font-medium ${getBadgeClass(secilen.section)}`}>
                {secilen[locale].position}
              </Badge>
              {/* Bölüm ve sınıf */}
              {secilen[locale].department || secilen.sinif ? (
                <dl className="mx-auto mt-5 grid max-w-xs grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left">
                  {secilen[locale].department && (
                    <>
                      <dt className="text-sm text-muted-foreground">{t('departmentLabel')}</dt>
                      <dd className="text-sm font-semibold text-primary">{secilen[locale].department}</dd>
                    </>
                  )}
                  {secilen.sinif && (
                    <>
                      <dt className="text-sm text-muted-foreground">{t('yearLabel')}</dt>
                      <dd className="text-sm font-semibold text-primary">{t('year', { year: secilen.sinif })}</dd>
                    </>
                  )}
                </dl>
              ) : null}

              {!secilen[locale].department && !secilen.sinif && !secilen.linkedin && !secilen.email && (
                <DialogDescription className="mt-4 text-muted-foreground">{t('noInfo')}</DialogDescription>
              )}

              {(secilen.linkedin || secilen.email) && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {secilen.linkedin && (
                    <a
                      href={secilen.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {secilen.email && (
                    <a
                      href={`mailto:${secilen.email}`}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-brand px-5 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
                    >
                      <Mail className="h-4 w-4" />
                      {secilen.email}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
