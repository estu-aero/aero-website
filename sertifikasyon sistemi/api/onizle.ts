import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sablonBul, SABLONLAR } from '../ayarlar';
import { sertifikaUret, sablonVarMi } from '../lib/pdf-uret';
import { dogrulamaAdresi } from '../lib/mail';

const istekSemasi = z.object({
  template: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1).max(600),
});

// Deneme sertifikası: hiçbir yere kaydedilmez, sadece PDF olarak geri döner.
// Şablondaki yazı konumlarını kontrol etmek için kullanılır.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const ayrisma = istekSemasi.safeParse(await request.json().catch(() => null));
  if (!ayrisma.success) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const sablon = sablonBul(ayrisma.data.template);
  if (!sablon) {
    return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 400 });
  }
  if (!(await sablonVarMi(sablon.dosya))) {
    return NextResponse.json(
      { error: `Şablon dosyası yok: "sertifikasyon sistemi/sablonlar/${sablon.dosya}"` },
      { status: 400 }
    );
  }

  const ornekKimlik = 'AERO-ORNK-0000-0000';
  const pdf = await sertifikaUret(sablon, {
    isim: ayrisma.data.name,
    metin: ayrisma.data.text,
    kimlik: ornekKimlik,
    dogrulamaAdresi: dogrulamaAdresi(ornekKimlik),
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' },
  });
}

// Admin panelindeki şablon listesi: hangi şablon dosyalarının yüklendiğini gösterir
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const liste = await Promise.all(
    SABLONLAR.map(async (s) => ({
      id: s.id,
      ad: s.ad,
      dosya: s.dosya,
      metinSablonu: s.metinSablonu,
      sabitTarih: s.sabitTarih ?? null,
      var: await sablonVarMi(s.dosya),
    }))
  );
  return NextResponse.json({ templates: liste });
}
