import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToGitHub, generateImageFilename } from '@/lib/github-upload';
import { requireAdmin } from '@/lib/auth/require-admin';

// Yüklemeye izin verilen klasörler (public/images/<klasör>)
const ALLOWED_FOLDERS = ['events', 'blog', 'general', 'sponsors', 'team'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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

// Görsel yükleme: sadece adminler çağırabilir.
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
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = detectImageExtension(bytes);
    if (!extension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Uzantı dosya adından değil, tespit edilen türden alınır
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    const filename = generateImageFilename(`${baseName}.${extension}`);
    const path = `public/images/${folder}/${filename}`;

    const result = await uploadImageToGitHub(file, path);

    if (!result.success) {
      console.error('Upload failed:', result.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      filename,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
