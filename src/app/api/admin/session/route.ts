import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { isAdminEmail } from '@/lib/auth/require-admin';

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

    // refresh: true ise tarayıcı token'ını yenilemeli (yeni yetki token'a o zaman işlenir)
    return NextResponse.json(
      { admin, refresh: admin !== hasClaim },
      { status: admin ? 200 : 403 }
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
