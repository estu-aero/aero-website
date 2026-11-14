'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogFormData {
  title: { tr: string; en: string };
  excerpt: { tr: string; en: string };
  content: { tr: string; en: string };
  author: string;
  category: string;
  image: string;
  date: string;
  published: boolean;
}

interface UploadedImage {
  url: string;
  name: string;
}

export default function CreateBlogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tr' | 'en'>('tr');
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState<BlogFormData>({
    title: { tr: '', en: '' },
    excerpt: { tr: '', en: '' },
    content: { tr: '', en: '' },
    author: '',
    category: '',
    image: '',
    date: new Date().toISOString().split('T')[0],
    published: true,
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.tr || !formData.title.en) {
      alert('Lütfen başlık alanlarını doldurun');
      return;
    }
    if (!formData.content.tr || !formData.content.en) {
      alert('Lütfen içerik alanlarını doldurun');
      return;
    }
    if (!formData.author) {
      alert('Lütfen yazar adını girin');
      return;
    }

    setSaving(true);
    try {
      const slug = generateSlug(formData.title.en);
      
      await addDoc(collection(db, 'blog'), {
        ...formData,
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert('Blog yazısı başarıyla oluşturuldu!');
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert('Blog yazısı oluşturulurken hata oluştu');
    } finally {
      setSaving(false);
    }
  };


  const handleContentImageUpload = (url: string, path: string) => {
    const fileName = path.split('/').pop() || 'image';
    setUploadedImages([...uploadedImages, { url, name: fileName }]);
    
    // Markdown formatında ekle
    const markdownImage = `\n![${fileName}](${url})\n`;
    const currentContent = formData.content[activeTab];
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [activeTab]: currentContent + markdownImage
      }
    });
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById(`content-${activeTab}`) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content[activeTab];
    const before = currentContent.substring(0, start);
    const selected = currentContent.substring(start, end);
    const after = currentContent.substring(end);
    
    let newContent = '';
    switch(syntax) {
      case 'bold':
        newContent = before + '**' + (selected || 'kalın metin') + '**' + after;
        break;
      case 'italic':
        newContent = before + '*' + (selected || 'italik metin') + '*' + after;
        break;
      case 'heading':
        newContent = before + '\n## ' + (selected || 'Başlık') + '\n' + after;
        break;
      case 'link':
        newContent = before + '[' + (selected || 'link metni') + '](url)' + after;
        break;
      case 'list':
        newContent = before + '\n- ' + (selected || 'liste öğesi') + '\n' + after;
        break;
      case 'code':
        newContent = before + '\n```\n' + (selected || 'kod bloğu') + '\n```\n' + after;
        break;
      default:
        return;
    }
    
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [activeTab]: newContent
      }
    });
  };
  const handleImageUpload = (url: string, _path: string) => {
    setFormData({ ...formData, image: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="sm">
            ← Geri
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Yeni Blog Yazısı</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Başlık */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title-tr">Başlık (Türkçe) *</Label>
            <Input
              id="title-tr"
              value={formData.title.tr}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, tr: e.target.value } })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title-en">Title (English) *</Label>
            <Input
              id="title-en"
              value={formData.title.en}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
              required
            />
          </div>
        </div>

        {/* Markdown Editor */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>İçerik (Markdown) *</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={activeTab === 'tr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('tr')}
                >
                  Türkçe
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('en')}
                >
                  English
                </Button>
                <Button
                  type="button"
                  variant={previewMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? 'Düzenle' : 'Önizle'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            {!previewMode && (
              <div className="flex flex-wrap gap-2 border-b pb-2">
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('bold')}>
                  <strong>B</strong>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('italic')}>
                  <em>I</em>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('heading')}>
                  H
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('link')}>
                  🔗
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('list')}>
                  •
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertMarkdown('code')}>
                  {'<>'}
                </Button>
                <div className="ml-auto">
                  <ImageUpload 
                    onUploadComplete={handleContentImageUpload}
                    folder="blog"
                  />
                </div>
              </div>
            )}

            {/* Editor/Preview */}
            {previewMode ? (
              <div className="prose dark:prose-invert max-w-none p-4 border rounded-lg min-h-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formData.content[activeTab] || '*İçerik henüz girilmedi*'}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea
                id={`content-${activeTab}`}
                value={formData.content[activeTab]}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  content: { ...formData.content, [activeTab]: e.target.value } 
                })}
                rows={20}
                className="font-mono text-sm"
                placeholder="Markdown formatında içerik yazın..."
                required
              />
            )}

            {/* Yüklenen Görseller */}
            {uploadedImages.length > 0 && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">Yüklenen Görseller</Label>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                      {img.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Özet */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="excerpt-tr">Özet (Türkçe)</Label>
            <Textarea
              id="excerpt-tr"
              value={formData.excerpt.tr}
              onChange={(e) => setFormData({ ...formData, excerpt: { ...formData.excerpt, tr: e.target.value } })}
              rows={3}
              placeholder="Kısa bir özet yazın..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt-en">Excerpt (English)</Label>
            <Textarea
              id="excerpt-en"
              value={formData.excerpt.en}
              onChange={(e) => setFormData({ ...formData, excerpt: { ...formData.excerpt, en: e.target.value } })}
              rows={3}
              placeholder="Write a short excerpt..."
            />
          </div>
        </div>

        {/* İçerik */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="content-tr">İçerik (Türkçe) *</Label>
            <Textarea
              id="content-tr"
              value={formData.content.tr}
              onChange={(e) => setFormData({ ...formData, content: { ...formData.content, tr: e.target.value } })}
              rows={12}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-en">Content (English) *</Label>
            <Textarea
              id="content-en"
              value={formData.content.en}
              onChange={(e) => setFormData({ ...formData, content: { ...formData.content, en: e.target.value } })}
              rows={12}
              required
            />
          </div>
        </div>

        {/* Yazar ve Kategori */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author">Yazar *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Yazar adı"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Örn: Teknoloji, Etkinlik, Duyuru"
            />
          </div>
        </div>

        {/* Tarih */}
        <div className="space-y-2">
          <Label htmlFor="date">Yayın Tarihi</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        {/* Durum */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="published" className="cursor-pointer">
            Hemen yayınla
          </Label>
        </div>

        {/* Görsel Yükleme */}
        <div className="space-y-2">
          <Label>Öne Çıkan Görsel</Label>
          <ImageUpload onUploadComplete={handleImageUpload} currentImageUrl={formData.image} />
        </div>

        {/* Butonlar */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand-dark"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              'Oluştur'
            )}
          </Button>
          <Link href="/admin/blog">
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
