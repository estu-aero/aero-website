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

// Admin panelinden yüklenmiş bir görseli depodan (Vercel Blob) siler: etkinlik silinince veya
// görseli değişince çağrılır. Silinemezse işlem durmaz; sadece konsola yazılır.
export async function gorselSil(url?: string | null) {
  if (!url || !url.includes('.public.blob.vercel-storage.com/')) return;
  try {
    await adminFetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: [url] }),
    });
  } catch (hata) {
    console.error('Görsel depodan silinemedi:', hata);
  }
}
