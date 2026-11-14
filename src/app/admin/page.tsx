'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, Calendar, ExternalLink, FileText, Mail } from 'lucide-react';
import Link from 'next/link';
import { FEATURES } from '@/config/features';

export default function AdminDashboard() {
  const quickLinks = [
    {
      title: 'Etkinlikler',
      href: '/admin/events',
      icon: Calendar,
      description: 'Etkinlik ekleyin, düzenleyin, silin',
    },
    ...(FEATURES.magazine
      ? [{ title: 'Dergi', href: '/admin/magazine', icon: BookOpen, description: 'Yeni sayı yükleyin, yayınlayın, abonelere duyurun' }]
      : []),
    ...(FEATURES.certificates
      ? [{ title: 'Sertifikalar', href: '/admin/certificates', icon: Award, description: 'Sertifika oluşturun ve katılımcılara mail ile gönderin' }]
      : []),
    { title: 'Bülten', href: '/admin/newsletter', icon: Mail, description: 'Aboneleri görün, duyuru maili gönderin' },
    ...(FEATURES.blog
      ? [{ title: 'Blog', href: '/admin/blog', icon: FileText, description: 'Blog yazılarını yönetin' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Paneli</h1>
        <p className="text-muted-foreground">
          AERO Web Sitesi Yönetim Paneline Hoş Geldiniz
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bilmeniz gerekenler</CardTitle>
          <CardDescription>Panelde yapılan değişiklikler sitede hemen görünür</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Etkinlik ve dergi metinleri Türkçe ve İngilizce girilebilir; İngilizce boş bırakılırsa Türkçesi gösterilir.</li>
            <li>• Taslak olarak kaydedilen dergi sayıları sitede görünmez.</li>
            <li>• Abonelere ve sertifika sahiplerine giden mailler geri alınamaz; göndermeden önce onay sorulur.</li>
            <li>• Ekip, sponsorlar ve sayfa metinleri panelden değil, site dosyalarından güncellenir.</li>
          </ul>
          <Link
            href="/home/tr"
            target="_blank"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            Siteyi yeni sekmede aç
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
