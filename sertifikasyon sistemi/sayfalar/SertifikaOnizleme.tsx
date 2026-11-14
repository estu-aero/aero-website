'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

// PDF çözümleyici ayrı bir iş parçacığında çalışır; dosyası public/ içinden sunulur
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Doğrulanan sertifikanın PDF'ini sayfanın içinde gösterir (yeni sekme açmadan)
export default function SertifikaOnizleme({
  pdfUrl,
  baslik,
  yukleniyorMetni,
  hataMetni,
}: {
  pdfUrl: string;
  baslik: string;
  yukleniyorMetni: string;
  hataMetni: string;
}) {
  const kutuRef = useRef<HTMLDivElement>(null);
  const [genislik, setGenislik] = useState(0);

  // Belge, kutunun genişliğine sığacak şekilde çizilir
  useEffect(() => {
    const kutu = kutuRef.current;
    if (!kutu) return;
    const gozlemci = new ResizeObserver(([giris]) => setGenislik(Math.floor(giris.contentRect.width)));
    gozlemci.observe(kutu);
    return () => gozlemci.disconnect();
  }, []);

  return (
    <div ref={kutuRef} aria-label={baslik}>
      <Document
        file={pdfUrl}
        loading={
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {yukleniyorMetni}
          </div>
        }
        error={<p className="py-24 text-center text-muted-foreground">{hataMetni}</p>}
      >
        {genislik > 0 && (
          <Page
            pageNumber={1}
            width={genislik}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="overflow-hidden rounded-sm shadow-2xl"
          />
        )}
      </Document>
    </div>
  );
}
