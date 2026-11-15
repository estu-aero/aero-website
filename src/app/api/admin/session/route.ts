import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { isAdminEmail } from '@/lib/auth/require-admin';

// ADMIN_EMAILS listesinden çıkarılmış ama hesabında hâlâ "admin" yetkisi duran kullanıcıların
// yetkisini geri alır ve oturumlarını kapatır. Herhangi bir admin paneli açtığında çalışır
// (sunucu örneği başına en fazla 10 dakikada bir). Açık kalan tarayıcı oturumu en geç 1 saat içinde düşer.
let sonTemizlik = 0;
async function eskiAdminleriTemizle() {
  if (Date.now() - sonTemizlik < 10 * 60 * 1000) return;
  sonTemizlik = Date.now();
  try {
    let pageToken: string | undefined;
    do {
      const sayfa = await adminAuth.listUsers(1000, pageToken);
      for (const kullanici of sayfa.users) {
        if (kullanici.customClaims?.admin === true && !isAdminEmail(kullanici.email)) {
          await adminAuth.setCustomUserClaims(kullanici.uid, { admin: false });
          await adminAuth.revokeRefreshTokens(kullanici.uid);
        }
      }
      pageToken = sayfa.pageToken;
    } while (pageToken);
  } catch (hata) {
    sonTemizlik = 0;
    console.error('Admin cleanup error:', hata);
  }
}

// Admin paneli açılırken çağrılır. Giriş yapan kişinin ADMIN_EMAILS içinde olup olmadığına bakar
// ve Firestore kurallarının kullandığı "admin" yetkisini (custom claim) buna göre verir ya da geri alır.
export async function POST(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await adminAuth.verifyIdToken(token, true);
    const admin = isAdminEmail(user.email);
    const hasClaim = user.admin === true;

    if (admin !== hasClaim) {
      await adminAuth.setCustomUserClaims(user.uid, { admin });
    }

    if (admin) await eskiAdminleriTemizle();

    // refresh: true ise tarayıcı token'ını yenilemeli (yeni yetki token'a o zaman işlenir)
    return NextResponse.json(
      { admin, refresh: admin !== hasClaim },
      { status: admin ? 200 : 403 }
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
