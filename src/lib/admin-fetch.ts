import { auth } from '@/lib/firebase/client';

// Admin API'lerine giriş yapan kullanıcının kimliğiyle istek atar.
export async function adminFetch(input: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
