import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Import worker via Vite ?url import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Loader2,
  FileText
} from 'lucide-react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PdfViewerProps {
  url: string;
  watermarkText?: string | null;
  title?: string;
  onLoadSuccess?: (numPages: number) => void;
  onError?: (err: Error) => void;
}

type FitMode = 'custom' | 'width' | 'page';

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  watermarkText,
  title = 'Document',
  onLoadSuccess,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRenderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingPages, setRenderingPages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Store original first page dimensions to compute fit ratios
  const [firstPageDimensions, setFirstPageDimensions] = useState<{ width: number; height: number } | null>(null);

  // 1. Load PDF Document from URL / Blob
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true
    });

    loadingTask.promise
      .then(async (doc) => {
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');
        if (onLoadSuccess) onLoadSuccess(doc.numPages);

        // Get first page to know base dimensions
        try {
          const page1 = await doc.getPage(1);
          const viewport = page1.getViewport({ scale: 1.0 });
          if (!isCancelled) {
            setFirstPageDimensions({ width: viewport.width, height: viewport.height });
          }
        } catch (e) {
          console.warn('Could not inspect first page dimensions:', e);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('PDF load error:', err);
        const msg = err.message || 'Failed to load PDF document';
        setError(msg);
        if (onError) onError(err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [url]);

  // 2. Calculate automatic scale for "Fit Width" and "Fit Page"
  const calculateAutoFit = useCallback(
    (mode: FitMode): number => {
      if (!firstPageDimensions || !scrollContainerRef.current) return 1.0;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const containerHeight = scrollContainerRef.current.clientHeight;

      // Leave padding space (e.g. 32px padding on desktop/tablet, 16px on mobile)
      const horizontalPadding = containerWidth > 640 ? 48 : 24;
      const verticalPadding = 48;

      const availableWidth = Math.max(200, containerWidth - horizontalPadding);
      const availableHeight = Math.max(200, containerHeight - verticalPadding);

      if (mode === 'width') {
        const fitWidthScale = availableWidth / firstPageDimensions.width;
        // Clamp scale reasonably between 0.35 and 3.0
        return Math.min(Math.max(fitWidthScale, 0.35), 3.0);
      } else if (mode === 'page') {
        const scaleW = availableWidth / firstPageDimensions.width;
        const scaleH = availableHeight / firstPageDimensions.height;
        const fitPageScale = Math.min(scaleW, scaleH);
        return Math.min(Math.max(fitPageScale, 0.35), 3.0);
      }
      return scale;
    },
    [firstPageDimensions, scale]
  );

  // Apply fit mode when dimensions or mode changes
  useEffect(() => {
    if (!firstPageDimensions || loading || fitMode === 'custom') return;
    const newScale = calculateAutoFit(fitMode);
    setScale(newScale);
  }, [firstPageDimensions, fitMode, calculateAutoFit, loading]);

  // 3. Responsive ResizeObserver to update auto-fit on window resize / orientation change
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (fitMode === 'width' || fitMode === 'page') {
        const newScale = calculateAutoFit(fitMode);
        setScale(newScale);
      }
    });

    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [fitMode, calculateAutoFit]);

  // 4. Render all pages on canvas elements
  useEffect(() => {
    if (!pdfDoc || loading) return;

    let isRenderCancelled = false;
    setRenderingPages(true);

    // Cancel any previous in-flight render tasks
    activeRenderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // Ignored
      }
    });
    activeRenderTasksRef.current.clear();

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (isRenderCancelled) break;

        const pageContainer = pageRefs.current[pageNum - 1];
        if (!pageContainer) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          if (isRenderCancelled) break;

          const dpr = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale });

          let canvas = pageContainer.querySelector('canvas') as HTMLCanvasElement;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'shadow-xl rounded-sm block bg-white';
            pageContainer.innerHTML = '';
            pageContainer.appendChild(canvas);
          }

          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.setTransform(1, 0, 0, 1, 0, 0);

          const renderContext = {
            canvasContext: ctx,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
            viewport: viewport
          };

          const renderTask = page.render(renderContext);
          activeRenderTasksRef.current.set(pageNum, renderTask);

          await renderTask.promise;
          activeRenderTasksRef.current.delete(pageNum);
        } catch (renderErr: any) {
          // If a render was cancelled due to re-scaling or unmounting, that's expected
          if (renderErr?.name !== 'RenderingCancelledException') {
            console.warn(`Render error on page ${pageNum}:`, renderErr);
          }
        }
      }

      if (!isRenderCancelled) {
        setRenderingPages(false);
      }
    };

    renderAllPages();

    return () => {
      isRenderCancelled = true;
      activeRenderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // Ignored
        }
      });
      activeRenderTasksRef.current.clear();
    };
  }, [pdfDoc, scale, loading]);

  // 5. Scroll listener to update active page number indicator
  const handleScroll = () => {
    if (!scrollContainerRef.current || numPages === 0) return;
    const containerTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;
    const midPoint = containerTop + containerHeight / 3;

    for (let i = 0; i < pageRefs.current.length; i++) {
      const pageEl = pageRefs.current[i];
      if (pageEl) {
        const offsetTop = pageEl.offsetTop;
        const offsetHeight = pageEl.offsetHeight;
        if (midPoint >= offsetTop && midPoint <= offsetTop + offsetHeight) {
          const newPage = i + 1;
          if (newPage !== currentPage) {
            setCurrentPage(newPage);
            setPageInput(String(newPage));
          }
          break;
        }
      }
    }
  };

  const scrollToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(pageNum, numPages));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
    const targetPageEl = pageRefs.current[clamped - 1];
    if (targetPageEl && scrollContainerRef.current) {
      targetPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) {
      scrollToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Zoom actions
  const handleZoomIn = () => {
    setFitMode('custom');
    setScale((prev) => Math.min(prev + 0.15, 3.0));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setScale((prev) => Math.max(prev - 0.15, 0.35));
  };

  const handleResetZoom = () => {
    setFitMode('custom');
    setScale(1.0);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden bg-slate-900 select-none text-slate-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Header Toolbar */}
      <div className="shrink-0 h-12 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between text-xs gap-2 z-20">
        {/* Left: Document Info & Page Navigator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <FileText className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="hidden md:inline truncate max-w-[160px] font-semibold text-slate-200">
              {title}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Pagination */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <form onSubmit={handlePageSubmit} className="flex items-center gap-1 text-[11px] font-mono">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                disabled={loading || numPages === 0}
                className="w-8 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-white font-bold focus:outline-none focus:border-brand-500"
              />
              <span className="text-slate-400">/ {numPages || 1}</span>
            </form>

            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center/Right: Zoom & Fit Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Fit Width */}
          <button
            onClick={() => {
              setFitMode('width');
              setScale(calculateAutoFit('width'));
            }}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
              fitMode === 'width'
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Fit to Container Width"
          >
            Fit Width
          </button>

          {/* Fit Page */}
          <button
            onClick={() => {
              setFitMode('page');
              setScale(calculateAutoFit('page'));
            }}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition hidden xs:inline-block ${
              fitMode === 'page'
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Fit Entire Page to Viewport Height"
          >
            Fit Page
          </button>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.4 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono px-1.5 min-w-[42px] text-center text-slate-200">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0 || loading}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hidden sm:block"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Full-Height Document Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto relative flex flex-col items-center py-6 px-2 sm:px-4 bg-slate-950/95"
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-30">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs font-medium text-slate-300">Decrypting & rendering document pages...</p>
          </div>
        )}

        {/* Error Screen */}
        {error && (
          <div className="m-auto text-center p-6 max-w-md rounded-2xl bg-red-950/40 border border-red-800 text-red-300 space-y-2">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-1" />
            <h4 className="font-bold text-sm text-red-200">Unable to Render PDF</h4>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Pages Container */}
        {!loading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-6 relative">
            {/* Optional Forensic Watermark Overlay across entire document area */}
            {watermarkText && (
              <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none flex flex-wrap items-center justify-around opacity-15 rotate-[-25deg] gap-16 p-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="text-xs font-mono font-bold text-white whitespace-nowrap">
                    {watermarkText}
                  </span>
                ))}
              </div>
            )}

            {Array.from({ length: numPages }).map((_, index) => (
              <div
                key={`page-${index + 1}`}
                ref={(el) => (pageRefs.current[index] = el)}
                id={`pdf-page-${index + 1}`}
                className="relative rounded-sm shadow-2xl transition-all duration-150 flex items-center justify-center min-h-[300px] bg-slate-900 border border-slate-800/80"
                style={{
                  // Placeholder sizing based on first page aspect ratio while rendering
                  width: firstPageDimensions ? `${Math.floor(firstPageDimensions.width * scale)}px` : 'auto',
                  minHeight: firstPageDimensions ? `${Math.floor(firstPageDimensions.height * scale)}px` : '400px'
                }}
              >
                {/* Canvas will be injected into this div by render loop */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-mono pointer-events-none">
                  Page {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Bottom Status Strip */}
      <div className="shrink-0 h-7 bg-slate-900/90 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 z-10">
        <div className="flex items-center gap-3 truncate">
          <span>{numPages > 0 ? `${numPages} page${numPages > 1 ? 's' : ''}` : '0 pages'}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Viewing Page {currentPage} of {numPages || 1}</span>
        </div>
        <div className="flex items-center gap-3">
          {renderingPages && (
            <span className="flex items-center gap-1.5 text-brand-400 text-[10px]">
              <Loader2 className="w-3 h-3 animate-spin" /> Rendering...
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            Protected Canvas Rendering • Download Disabled
          </span>
        </div>
      </div>
    </div>
  );
};
