// page-flip (StPageFlip, MIT) kendi tip tanımını içermiyor; kullandığımız kısmın tanımı.
declare module 'page-flip' {
  export interface FlipSetting {
    startPage?: number;
    size?: 'fixed' | 'stretch';
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }

  export interface FlipEvent<T = unknown> {
    data: T;
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: FlipSetting);
    loadFromHTML(items: HTMLElement[]): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): 'portrait' | 'landscape';
    on(event: 'flip', callback: (e: FlipEvent<number>) => void): this;
    on(event: 'changeOrientation', callback: (e: FlipEvent<'portrait' | 'landscape'>) => void): this;
    on(event: 'init' | 'update', callback: (e: FlipEvent<{ page: number; mode: 'portrait' | 'landscape' }>) => void): this;
    destroy(): void;
  }
}
