import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/require-admin';

// Yüklemeye izin verilen klasörler (Vercel Blob içinde <klasör>/dosya)
const ALLOWED_FOLDERS = ['events', 'blog', 'general', 'sponsors', 'team'];
// Vercel'de sunucuya gönderilen istek gövdesi 4,5 MB ile sınırlı
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

// Dosyanın gerçek türü ilk baytlarından (imzasından) anlaşılır; tarayıcının bildirdiği türe güvenilmez.
function detectImageExtension(bytes: Uint8Array): string | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return 'gif';
  // WebP: "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

// Dosya adını sadeleştirir: "Etkinlik Afişi.JPG" -> "etkinlik-afisi"
function slugify(name: string) {
  return (
    name
      .replace(/\.[^/.]+$/, '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'gorsel'
  );
}

// Görsel yükleme (etkinlik, blog kapakları): sadece adminler çağırabilir. Görsel Vercel Blob'a yüklenir.
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') || 'general');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. En fazla 4 MB olabilir.' },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = detectImageExtension(bytes);
    if (!extension) {
      return NextResponse.json(
        { error: 'Geçersiz dosya türü. Sadece JPEG, PNG, WebP ve GIF yüklenebilir.' },
        { status: 400 }
      );
    }

    // Uzantı dosya adından değil, tespit edilen türden alınır; rastgele ek ile adres tahmin edilemez
    const blob = await put(`${folder}/${slugify(file.name)}.${extension}`, Buffer.from(bytes), {
      access: 'public',
      contentType: CONTENT_TYPES[extension],
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      path: blob.pathname,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Yükleme başarısız. Depolama (Vercel Blob) ayarlı mı?' },
      { status: 500 }
    );
  }
}

// Yüklenmiş görselleri depodan siler (etkinlik silinince veya görseli değişince). Sadece adminler çağırabilir.
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const body = await request.json().catch(() => null);
    const urls: unknown = body?.urls;
    if (!Array.isArray(urls) || urls.length === 0 || urls.length > 10) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Sadece bu API'nin yüklediği klasörlerdeki dosyalar silinebilir
    const valid = urls.every((value) => {
      try {
        const url = new URL(String(value));
        return (
          url.protocol === 'https:' &&
          url.hostname.endsWith('.public.blob.vercel-storage.com') &&
          ALLOWED_FOLDERS.some((folder) => url.pathname.startsWith(`/${folder}/`))
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
    console.error('Upload delete error:', error);
    return NextResponse.json({ error: 'Silme başarısız.' }, { status: 500 });
  }
}
