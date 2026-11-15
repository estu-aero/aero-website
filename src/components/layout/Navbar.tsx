'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Menu, Moon, Sun, Languages } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { buildLocalizedPath, ENGLISH_ROUTES } from '@/i18n/paths';
import { FEATURES } from '@/config/features';
import { MEMBERSHIP_FORM_URL } from '@/config/links';
import { SITE } from '@/config/site';

// external: true olan öğeler başka bir siteye gider ve yeni sekmede açılır
type NavItem = { name: string; href: string; external?: boolean };

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale();

  // Sitenin dilini hatırla (sertifika doğrulama sayfasından dönüşte kullanılır)
  useEffect(() => {
    try {
      sessionStorage.setItem(SITE.siteLocaleKey, locale);
    } catch {
      // Tarayıcı depolamaya izin vermiyorsa varsayılan dil kullanılır
    }
  }, [locale]);
  const router = useRouter();
  const pathname = usePathname();

  const hasMembershipForm = MEMBERSHIP_FORM_URL !== '#';

  const navItems: NavItem[] = [
    { name: t('home'), href: buildLocalizedPath(ENGLISH_ROUTES.home, locale) },
    { name: t('about'), href: buildLocalizedPath(ENGLISH_ROUTES.about, locale) },
    { name: t('team'), href: buildLocalizedPath(ENGLISH_ROUTES.team, locale) },
    ...(FEATURES.subteams
      ? [{ name: t('subteams'), href: buildLocalizedPath(ENGLISH_ROUTES.subteams, locale) }]
      : []),
    { name: t('events'), href: buildLocalizedPath(ENGLISH_ROUTES.events, locale) },
    ...(FEATURES.magazine
      ? [{ name: t('magazine'), href: buildLocalizedPath(ENGLISH_ROUTES.magazine, locale) }]
      : []),
    { name: t('sponsors'), href: buildLocalizedPath(ENGLISH_ROUTES.sponsors, locale) },
    { name: t('contact'), href: buildLocalizedPath(ENGLISH_ROUTES.contact, locale) },
    ...(FEATURES.certificates
      ? // Doğrulama sayfası sitenin dilinden bağımsız olarak İngilizce açılır (sayfada TR butonu var)
        [{ name: t('certificate'), href: buildLocalizedPath(ENGLISH_ROUTES.certificate, 'en') }]
      : []),
    ...(FEATURES.blog
      ? [{ name: t('blog'), href: buildLocalizedPath(ENGLISH_ROUTES.blog, locale) }]
      : []),
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleLanguage = () => {
    const newLocale = locale === 'tr' ? 'en' : 'tr';
    router.replace(buildLocalizedPath(pathname, newLocale) + window.location.search);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={buildLocalizedPath(ENGLISH_ROUTES.home, locale)}
          className="flex items-center space-x-3"
        >
          {/* Açık temada açık zemin logosu, koyu temada koyu zemin logosu */}
          <div className="relative h-9 w-36 flex-shrink-0">
            <Image
              src="/images/logo/aero-logo-light.png"
              alt={SITE.shortName}
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/images/logo/aero-logo-dark.png"
              alt={SITE.shortName}
              fill
              className="object-contain hidden dark:block"
            />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold leading-tight whitespace-nowrap">
              {locale === 'tr' ? SITE.university.tr : SITE.university.en}
            </span>
            <span className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
              {locale === 'tr' ? 'Uçak ve Uzay Kulübü' : 'Aeronautics and Aerospace Club'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-5">
          {navItems.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium whitespace-nowrap transition-colors hover:text-brand"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium whitespace-nowrap transition-colors hover:text-brand"
              >
                {item.name}
              </Link>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="hidden sm:flex"
          >
            <Languages className="h-5 w-5" />
            <span className="sr-only">{t('toggleLanguage')}</span>
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden sm:flex"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">{t('toggleTheme')}</span>
          </Button>

          {/* Üye Ol: başvuru formu linki girilene kadar gizli (src/config/links.ts) */}
          {hasMembershipForm && (
            <Button
              className="hidden md:inline-flex bg-brand hover:bg-brand-dark"
              onClick={() => window.open(MEMBERSHIP_FORM_URL, '_blank')}
            >
              {t('joinUs')}
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('toggleMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] overflow-y-auto">
              <SheetTitle className="sr-only">
                {t('toggleMenu')}
              </SheetTitle>
              <div className="mb-6">
                <div className="relative h-12 w-40 mb-2">
                  <Image
                    src="/images/logo/aero-logo-light.png"
                    alt={SITE.shortName}
                    fill
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/images/logo/aero-logo-dark.png"
                    alt={SITE.shortName}
                    fill
                    className="object-contain hidden dark:block"
                  />
                </div>
                <div className="flex flex-col ml-1">
                  <span className="text-sm font-semibold leading-tight">
                    {locale === 'tr' ? SITE.university.tr : SITE.university.en}
                  </span>
                  <span className="text-sm text-muted-foreground leading-tight">
                    {locale === 'tr' ? 'Uçak ve Uzay Kulübü' : 'Aeronautics and Aerospace Club'}
                  </span>
                </div>
              </div>
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  )
                )}
                <div className="pt-4 mt-4 border-t space-y-2">
                  {hasMembershipForm && (
                    <Button
                      className="w-full bg-brand hover:bg-brand-dark text-white"
                      onClick={() => {
                        setIsOpen(false);
                        window.open(MEMBERSHIP_FORM_URL, '_blank');
                      }}
                    >
                      {t('joinUs')}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={toggleLanguage}
                      className="flex-1 justify-center"
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      {locale === 'tr' ? 'EN' : 'TR'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleDarkMode}
                      className="h-10 w-10"
                    >
                      {isDarkMode ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
