import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/require-admin';
import { MAX_PDF_SIZE } from '@/lib/magazine';

// Dergi dosyaları (PDF ve kapak) tarayıcıdan doğrudan Vercel Blob'a yüklenir.
// Bu uç sadece adminlere, sadece magazine/ klasörü için kısa süreli yükleme izni verir.
const ALLOWED_PATH = /^magazine\/[a-z0-9-]+\.(pdf|jpg)$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    // Yükleme izni isteği: admin olmalı.
    // (Yükleme bitti bildirimi Vercel'den gelir; imzasını handleUpload doğrular.)
    if (body.type === 'blob.generate-client-token') {
      const admin = await requireAdmin(request);
      if (!admin.ok) return admin.response;
    }

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!ALLOWED_PATH.test(pathname)) {
          throw new Error('Invalid upload path');
        }
        const isPdf = pathname.endsWith('.pdf');
        return {
          allowedContentTypes: isPdf ? ['application/pdf'] : ['image/jpeg'],
          maximumSizeInBytes: isPdf ? MAX_PDF_SIZE : 5 * 1024 * 1024,
          // Dosya adına rastgele ek: aynı sayı yeniden yüklenirse eskisinin üzerine yazılmaz
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Magazine upload error:', error);
    return NextResponse.json(
      { error: 'Yükleme başlatılamadı. Depolama (Vercel Blob) ayarlı mı?' },
      { status: 400 }
    );
  }
}

// Silinen bir sayının dosyalarını depodan kaldırır.
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { urls } = await request.json();
    if (!Array.isArray(urls) || urls.length === 0 || urls.length > 10) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Sadece bu sitenin dergi klasöründeki dosyalar silinebilir
    const valid = urls.every((value) => {
      try {
        const url = new URL(String(value));
        return (
          url.protocol === 'https:' &&
          url.hostname.endsWith('.public.blob.vercel-storage.com') &&
          url.pathname.startsWith('/magazine/')
        );
      } catch {
        return false;
      }
    });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid file url' }, { status: 400 });
    }

    await del(urls as string[]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Magazine file delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
