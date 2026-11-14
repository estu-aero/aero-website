'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { adminFetch } from '@/lib/admin-fetch';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Image as ImageIcon,
  LogOut,
  Menu,
  Mail,
  BookOpen,
  Award,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FEATURES } from '@/config/features';

const ADMIN_ONIZLEME =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN_ONIZLEME === '1';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // YEREL ÖNİZLEME: sadece geliştirme modunda ve .env.development.local içinde
    // NEXT_PUBLIC_ADMIN_ONIZLEME=1 varken giriş istenmez (yayındaki sitede hiçbir zaman çalışmaz).
    // Veriler ve sunucu işlemleri bu modda çalışmaz; sadece panelin görünümü içindir.
    if (ADMIN_ONIZLEME) {
      setUser({ email: 'onizleme@yerel' } as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        setLoading(false);
        return;
      }

      // Sunucuya sor: bu hesap admin listesinde (ADMIN_EMAILS) mi?
      try {
        const response = await adminFetch('/api/admin/session', { method: 'POST' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.admin) {
          await auth.signOut();
          router.push('/');
          return;
        }
        // Yetki yeni verildiyse Firestore'un görmesi için token yenilenir
        if (data.refresh) await user.getIdToken(true);
        setUser(user);
      } catch {
        await auth.signOut();
        router.push('/');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Panel', href: '/admin', icon: LayoutDashboard },
    { name: 'Etkinlikler', href: '/admin/events', icon: Calendar },
    ...(FEATURES.blog ? [{ name: 'Blog', href: '/admin/blog', icon: FileText }] : []),
    ...(FEATURES.magazine ? [{ name: 'Dergi', href: '/admin/magazine', icon: BookOpen }] : []),
    ...(FEATURES.certificates ? [{ name: 'Sertifikalar', href: '/admin/certificates', icon: Award }] : []),
    { name: 'Bülten', href: '/admin/newsletter', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">AERO Admin</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background">
        <div className="flex h-full items-center justify-between px-4">
          <h2 className="text-lg font-semibold">AERO Admin</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col space-y-1 mt-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
