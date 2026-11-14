'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { upload } from '@vercel/blob/client';
import {
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Trash2,
  Upload,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase/client';
import { adminFetch } from '@/lib/admin-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MAGAZINE_COLLECTION,
  MAX_PDF_SIZE,
  type MagazineIssue,
  formatIssueDate,
} from '@/lib/magazine';

type AdminIssue = MagazineIssue & {
  announcedAt?: { toDate: () => Date } | null;
  announcedCount?: number;
};

type Message = { type: 'success' | 'error'; text: string } | null;

const emptyForm = {
  number: '',
  title: '',
  date: '',
  description: '',
  titleEn: '',
  descriptionEn: '',
};

// PDF'in sayfa sayısını okur ve ilk sayfasından kapak görseli üretir
async function readPdf(file: File) {
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const firstPage = await pdf.getPage(1);
  const baseViewport = firstPage.getViewport({ scale: 1 });
  const viewport = firstPage.getViewport({ scale: 800 / baseViewport.width });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Kapak oluşturulamadı.');
  await firstPage.render({ canvas, canvasContext: context, viewport }).promise;

  const cover = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Kapak oluşturulamadı.'))),
      'image/jpeg',
      0.85
    )
  );

  return { pages: pdf.numPages, cover };
}

export default function AdminMagazinePage() {
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{ pages: number; cover: Blob } | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [readingPdf, setReadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadIssues = async () => {
    try {
      const snapshot = await getDocs(collection(db, MAGAZINE_COLLECTION));
      const loaded = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as AdminIssue)
        .sort((a, b) => b.number - a.number);
      setIssues(loaded);
      // Yeni sayı numarasını otomatik öner
      setForm((current) =>
        current.number
          ? current
          : { ...current, number: String((loaded[0]?.number ?? 0) + 1) }
      );
    } catch (error) {
      console.error('Error loading issues:', error);
      setMessage({ type: 'error', text: 'Sayılar yüklenemedi.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const handlePdfChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    setPdfFile(null);
    setPdfInfo(null);
    setCoverPreview(null);
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Lütfen bir PDF dosyası seçin.' });
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setMessage({
        type: 'error',
        text: `PDF çok büyük (${(file.size / 1024 / 1024).toFixed(0)} MB). En fazla 50 MB olabilir; tasarımcınızdan "web için küçültülmüş" sürümü isteyin.`,
      });
      event.target.value = '';
      return;
    }

    setReadingPdf(true);
    try {
      const info = await readPdf(file);
      setPdfFile(file);
      setPdfInfo(info);
      setCoverPreview(URL.createObjectURL(info.cover));
    } catch (error) {
      console.error('PDF read error:', error);
      setMessage({
        type: 'error',
        text: 'PDF okunamadı. Dosya bozuk veya şifreli olabilir.',
      });
      event.target.value = '';
    } finally {
      setReadingPdf(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    setMessage(null);
    const number = Number(form.number);
    if (!Number.isInteger(number) || number < 1) {
      setMessage({ type: 'error', text: 'Sayı numarası 1 veya daha büyük bir tam sayı olmalı.' });
      return;
    }
    if (!form.title.trim() || !form.date) {
      setMessage({ type: 'error', text: 'Başlık ve yayın tarihi zorunlu.' });
      return;
    }
    if (!pdfFile || !pdfInfo) {
      setMessage({ type: 'error', text: 'Lütfen derginin PDF dosyasını seçin.' });
      return;
    }
    if (issues.some((issue) => issue.number === number)) {
      setMessage({ type: 'error', text: `Sayı ${number} zaten var. Farklı bir numara girin veya eskisini silin.` });
      return;
    }

    setSaving(true);
    setProgress(0);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      const uploadOptions = {
        access: 'public' as const,
        handleUploadUrl: '/api/admin/magazine/upload',
        headers: { Authorization: `Bearer ${token}` },
      };

      const cover = await upload(`magazine/sayi-${number}-kapak.jpg`, pdfInfo.cover, {
        ...uploadOptions,
        contentType: 'image/jpeg',
      });
      const pdf = await upload(`magazine/sayi-${number}.pdf`, pdfFile, {
        ...uploadOptions,
        contentType: 'application/pdf',
        multipart: true,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      await addDoc(collection(db, MAGAZINE_COLLECTION), {
        number,
        title: form.title.trim(),
        titleEn: form.titleEn.trim(),
        description: form.description.trim(),
        descriptionEn: form.descriptionEn.trim(),
        date: form.date,
        coverUrl: cover.url,
        pdfUrl: pdf.url,
        pages: pdfInfo.pages,
        sizeBytes: pdfFile.size,
        status,
        createdAt: serverTimestamp(),
      });

      setMessage({
        type: 'success',
        text:
          status === 'published'
            ? `Sayı ${number} yayınlandı.`
            : `Sayı ${number} taslak olarak kaydedildi. Sitede görünmesi için "Yayınla"ya basın.`,
      });
      setForm({ ...emptyForm, number: String(number + 1) });
      setPdfFile(null);
      setPdfInfo(null);
      setCoverPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadIssues();
    } catch (error) {
      console.error('Issue save error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Kaydetme başarısız.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (issue: AdminIssue) => {
    setBusyId(issue.id);
    setMessage(null);
    try {
      const status = issue.status === 'published' ? 'draft' : 'published';
      await updateDoc(doc(db, MAGAZINE_COLLECTION, issue.id), { status });
      await loadIssues();
    } catch (error) {
      console.error('Status update error:', error);
      setMessage({ type: 'error', text: 'Durum değiştirilemedi.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (issue: AdminIssue) => {
    if (!confirm(`"${issue.title}" silinsin mi? PDF ve kapak da silinir; bu işlem geri alınamaz.`)) return;
    setBusyId(issue.id);
    setMessage(null);
    try {
      await deleteDoc(doc(db, MAGAZINE_COLLECTION, issue.id));
      // Dosyalar silinemese bile kayıt silindi; depoda artık dosya kalabilir
      await adminFetch('/api/admin/magazine/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [issue.pdfUrl, issue.coverUrl] }),
      }).catch((error) => console.error('File delete error:', error));
      await loadIssues();
    } catch (error) {
      console.error('Issue delete error:', error);
      setMessage({ type: 'error', text: 'Sayı silinemedi.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleAnnounce = async (issue: AdminIssue) => {
    const again = issue.announcedAt
      ? 'Bu sayı daha önce duyuruldu. Aboneler aynı maili İKİNCİ KEZ alacak.\n\n'
      : '';
    if (!confirm(`${again}"${issue.title}" tüm bülten abonelerine mail ile duyurulsun mu? Gönderilen mail geri alınamaz.`)) return;
    setBusyId(issue.id);
    setMessage(null);
    try {
      const response = await adminFetch('/api/admin/magazine/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: issue.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Duyuru gönderilemedi.');
      }
      setMessage({
        type: 'success',
        text: `Duyuru gönderildi: ${data.sent}/${data.total} aboneye ulaştı.`,
      });
      await loadIssues();
    } catch (error) {
      console.error('Announce error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Duyuru gönderilemedi.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const setField = (field: keyof typeof emptyForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dergi</h1>
        <p className="text-muted-foreground mt-2">
          Yeni sayı yükleyin, yayınlayın ve abonelere duyurun.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100' : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'}`}
        >
          {message.text}
        </div>
      )}

      {/* Yeni sayı formu */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Sayı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf">1. Derginin PDF dosyası (en fazla 50 MB)</Label>
                <Input
                  id="pdf"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  disabled={saving || readingPdf}
                />
                <p className="text-xs text-muted-foreground">
                  Kapak görseli PDF&apos;in ilk sayfasından otomatik oluşturulur.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="number">2. Sayı numarası</Label>
                  <Input id="number" type="number" min={1} value={form.number} onChange={setField('number')} disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">3. Yayın tarihi</Label>
                  <Input id="date" type="date" value={form.date} onChange={setField('date')} disabled={saving} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">4. Başlık</Label>
                <Input id="title" placeholder="Örn: Sayı 1 · Kış 2026" value={form.title} onChange={setField('title')} disabled={saving} maxLength={120} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">5. Kısa açıklama (isteğe bağlı)</Label>
                <Textarea id="description" rows={3} placeholder="Bu sayıda neler var? 1-2 cümle." value={form.description} onChange={setField('description')} disabled={saving} maxLength={500} />
              </div>

              <details className="rounded-lg border px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">
                  İngilizce başlık ve açıklama (isteğe bağlı)
                </summary>
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Boş bırakırsanız sitenin İngilizce sürümünde Türkçe metin gösterilir.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Başlık (İngilizce)</Label>
                    <Input id="titleEn" placeholder="E.g. Issue 1 · Winter 2026" value={form.titleEn} onChange={setField('titleEn')} disabled={saving} maxLength={120} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">Açıklama (İngilizce)</Label>
                    <Textarea id="descriptionEn" rows={3} value={form.descriptionEn} onChange={setField('descriptionEn')} disabled={saving} maxLength={500} />
                  </div>
                </div>
              </details>

              {saving && (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Yükleniyor... %{progress}. Lütfen sayfayı kapatmayın.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={() => handleSave('published')} disabled={saving || readingPdf} className="bg-brand hover:bg-brand-dark">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Yayınla
                </Button>
                <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving || readingPdf}>
                  Taslak olarak kaydet
                </Button>
              </div>
            </div>

            {/* Kapak önizlemesi */}
            <div>
              <p className="mb-2 text-sm font-medium">Kapak önizlemesi</p>
              <div className="relative flex aspect-[600/849] items-center justify-center overflow-hidden rounded-lg border bg-muted text-center text-xs text-muted-foreground">
                {readingPdf ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="Kapak önizlemesi" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-4">PDF seçince kapak burada görünür</span>
                )}
              </div>
              {pdfInfo && pdfFile && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {pdfInfo.pages} sayfa · {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mevcut sayılar */}
      <Card>
        <CardHeader>
          <CardTitle>Sayılar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : issues.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-8 w-8" />
              Henüz sayı yüklenmedi.
            </div>
          ) : (
            <div className="divide-y">
              {issues.map((issue) => {
                const busy = busyId === issue.id;
                const published = issue.status === 'published';
                return (
                  <div key={issue.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded border bg-muted">
                      <Image src={issue.coverUrl} alt="" fill sizes="68px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{issue.title}</p>
                        <Badge className={published ? 'bg-green-600 text-white' : 'bg-neutral-500 text-white'}>
                          {published ? 'Yayında' : 'Taslak'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sayı {issue.number} · {formatIssueDate(issue.date, 'tr')} · {issue.pages} sayfa
                      </p>
                      {issue.announcedAt && (
                        <p className="text-xs text-muted-foreground">
                          Abonelere duyuruldu: {issue.announcedAt.toDate().toLocaleDateString('tr-TR')}
                          {issue.announcedCount ? ` (${issue.announcedCount} kişi)` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(issue)} disabled={busy}>
                        {published ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {published ? 'Taslağa al' : 'Yayınla'}
                      </Button>
                      {published && (
                        <Button variant="outline" size="sm" onClick={() => handleAnnounce(issue)} disabled={busy}>
                          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                          Abonelere duyur
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(issue)} disabled={busy} className="text-red-600 hover:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
