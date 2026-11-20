'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import type { PageFlip } from 'page-flip';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Gerçekçi sayfa kıvırma efektiyle dergi okuyucu (page-flip / StPageFlip).
// Kütüphane, kıvrılan sayfayı çevirme sırasında kopyalar; tuval (canvas) kopyalanınca içi boş kalır.
// Bu yüzden PDF sayfaları önce resme (JPEG) dönüştürülür ve kütüphaneye resim olarak verilir.

export interface FlipBookHandle {
  next: () => void;
  prev: () => void;
}

interface FlipBookProps {
  pdfUrl: string;
  // Okuma alanının boyutu (piksel)
  width: number;
  height: number;
  onLoad: (pageCount: number) => void;
  // Görünen ilk sayfa (1'den başlar) ve çift sayfa görünümünde olup olmadığı
  onPageChange: (page: number, landscape: boolean) => void;
  onError: () => void;
}

const ON_YUKLEME = 4; // açık sayfanın iki yanında önce resme dönüştürülecek sayfa sayısı

const FlipBook = forwardRef<FlipBookHandle, FlipBookProps>(function FlipBook(
  { pdfUrl, width, height, onLoad, onPageChange, onError },
  ref
) {
  const kapRef = useRef<HTMLDivElement>(null);
  const kitapRef = useRef<PageFlip | null>(null);
  const sayfaElemanlari = useRef<HTMLElement[]>([]);
  const resimler = useRef<(string | null)[]>([]);
  const belgeRef = useRef<PDFDocumentProxy | null>(null);
  const acikSayfa = useRef(0);
  const [belgeHazir, setBelgeHazir] = useState(false);
  const [oran, setOran] = useState(1.414);
  const geriCagri = useRef({ onLoad, onPageChange, onError });
  useEffect(() => {
    geriCagri.current = { onLoad, onPageChange, onError };
  });

  useImperativeHandle(ref, () => ({
    next: () => kitapRef.current?.flipNext(),
    prev: () => kitapRef.current?.flipPrev(),
  }));

  // 1) PDF'i yükle, sayfa elemanlarını hazırla, sayfaları sırayla resme dönüştür
  useEffect(() => {
    let iptal = false;
    const gorev = pdfjs.getDocument({ url: pdfUrl });
    const olusanAdresler: string[] = [];

    (async () => {
      try {
        const belge = await gorev.promise;
        if (iptal) return;
        belgeRef.current = belge;
        const ilk = await belge.getPage(1);
        const vp = ilk.getViewport({ scale: 1 });
        setOran(vp.height / vp.width);

        resimler.current = Array(belge.numPages).fill(null);
        sayfaElemanlari.current = Array.from({ length: belge.numPages }, (_, i) => {
          const sayfa = document.createElement('div');
          sayfa.className = 'aero-flip-sayfa';
          // Kapaklar da yumuşak (kıvrılan) sayfa: "sert" kapak ayarı yandaki sayfayı aynalanmış gösteriyordu
          const resim = document.createElement('img');
          resim.alt = '';
          resim.draggable = false;
          sayfa.appendChild(resim);
          return sayfa;
        });
        geriCagri.current.onLoad(belge.numPages);
        setBelgeHazir(true);

        // Açık sayfanın çevresi önce, sonra baştan sona kalanlar
        const siradaki = () => {
          const merkez = acikSayfa.current;
          const yakin: number[] = [];
          for (let d = 0; d <= ON_YUKLEME; d++) yakin.push(merkez + d, merkez - d);
          const hepsi = [...yakin, ...Array.from({ length: belge.numPages }, (_, i) => i)];
          return hepsi.find((i) => i >= 0 && i < belge.numPages && resimler.current[i] === null);
        };
        for (let i = siradaki(); i !== undefined && !iptal; i = siradaki()) {
          resimler.current[i] = 'yukleniyor';
          const sayfa = await belge.getPage(i + 1);
          const hedefGenislik = Math.min(
            1400,
            Math.max(600, Math.round(window.innerWidth * Math.min(2, window.devicePixelRatio || 1) * 0.5))
          );
          const olcek = hedefGenislik / sayfa.getViewport({ scale: 1 }).width;
          const viewport = sayfa.getViewport({ scale: olcek });
          const tuval = document.createElement('canvas');
          tuval.width = Math.floor(viewport.width);
          tuval.height = Math.floor(viewport.height);
          await sayfa.render({ canvas: tuval, canvasContext: tuval.getContext('2d')!, viewport }).promise;
          const blob = await new Promise<Blob | null>((r) => tuval.toBlob(r, 'image/jpeg', 0.85));
          tuval.width = 0;
          tuval.height = 0;
          if (iptal || !blob) return;
          const adres = URL.createObjectURL(blob);
          olusanAdresler.push(adres);
          resimler.current[i] = adres;
          const eleman = sayfaElemanlari.current[i];
          const resim = eleman?.querySelector('img');
          if (resim) resim.src = adres;
          eleman?.classList.add('hazir');
        }
      } catch (hata) {
        if (!iptal) {
          console.error('Dergi yüklenemedi:', hata);
          geriCagri.current.onError();
        }
      }
    })();

    return () => {
      iptal = true;
      gorev.destroy();
      olusanAdresler.forEach((a) => URL.revokeObjectURL(a));
    };
  }, [pdfUrl]);

  // Sayfa boyutu: çift sayfa ekrana sığacak şekilde (dar ekranda tek sayfa)
  const ciftSayfa = width >= 900;
  const pay = 24;
  const sayfaGenisligi = Math.max(
    120,
    Math.floor(Math.min((width - pay * 2) / (ciftSayfa ? 2 : 1), (height - pay) / oran))
  );
  const sayfaYuksekligi = Math.floor(sayfaGenisligi * oran);

  // 2) Kitabı kur; boyut değişince aynı sayfadan yeniden kur
  useEffect(() => {
    const kap = kapRef.current;
    if (!belgeHazir || !kap || width <= 0 || height <= 0) return;
    let kitap: PageFlip | null = null;
    let iptal = false;
    const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (async () => {
      const { PageFlip } = await import('page-flip');
      if (iptal) return;
      kap.innerHTML = '';
      const icerik = document.createElement('div');
      kap.appendChild(icerik);
      kitap = new PageFlip(icerik, {
        width: sayfaGenisligi,
        height: sayfaYuksekligi,
        size: 'fixed',
        startPage: acikSayfa.current,
        showCover: true,
        usePortrait: !ciftSayfa,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        flippingTime: azHareket ? 150 : 800,
        mobileScrollSupport: false,
        autoSize: true,
        showPageCorners: !azHareket,
      });
      kitap.loadFromHTML(sayfaElemanlari.current);
      kitapRef.current = kitap;
      const bildir = () => {
        if (!kitap) return;
        const index = kitap.getCurrentPageIndex();
        acikSayfa.current = index;
        geriCagri.current.onPageChange(index + 1, kitap.getOrientation() === 'landscape');
      };
      kitap.on('flip', bildir);
      kitap.on('changeOrientation', bildir);
      bildir();
    })();

    return () => {
      iptal = true;
      kitapRef.current = null;
      try {
        kitap?.destroy();
      } catch {
        // kütüphane zaten kaldırıldıysa
      }
    };
  }, [belgeHazir, sayfaGenisligi, sayfaYuksekligi, ciftSayfa, width, height]);

  return (
    <>
      <style>{`
        .aero-flip-sayfa { background: #1f1f23; overflow: hidden; }
        .aero-flip-sayfa img { display: block; width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 150ms; user-select: none; }
        .aero-flip-sayfa.hazir { background: #fff; }
        .aero-flip-sayfa.hazir img { opacity: 1; }
      `}</style>
      <div ref={kapRef} className="flex h-full w-full items-center justify-center" />
    </>
  );
});

export default FlipBook;
