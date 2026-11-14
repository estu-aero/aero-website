import { NextRequest, NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase/admin';

// Admin listesi: .env içindeki ADMIN_EMAILS (virgülle ayrılmış e-postalar).
// Liste boşsa kimse admin değildir.
export const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email?: string | null) =>
  Boolean(email) && getAdminEmails().includes(email!.toLowerCase());

type AdminCheck =
  | { ok: true; user: DecodedIdToken }
  | { ok: false; response: NextResponse };

// Firebase ID token'ını doğrular ve e-postanın ADMIN_EMAILS içinde olduğunu kontrol eder.
// Kullanım: const admin = await requireAdmin(request); if (!admin.ok) return admin.response;
export async function requireAdmin(request: NextRequest): Promise<AdminCheck> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  let user: DecodedIdToken;
  try {
    // true: iptal edilmiş (silinmiş/devre dışı) hesapların token'ı kabul edilmez
    user = await adminAuth.verifyIdToken(token, true);
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!isAdminEmail(user.email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
