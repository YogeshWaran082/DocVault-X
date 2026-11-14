import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Import worker via Vite ?url import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  RotateCw,
  Maximize2,
  Minimize2,
  Hand,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  FileText,
  X,
  Lock,
  EyeOff
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
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRenderTasksRef = useRef<Map<number, pdfjsLib.RenderTask>>(new Map());

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [loading, setLoading] = useState<boolean>(true);
  const [_renderingPages, setRenderingPages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sidebar & Pan State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Anti-Screenshot & Security State
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [screenshotWarning, setScreenshotWarning] = useState<string | null>(null);

  // First page dimensions
  const [firstPageDimensions, setFirstPageDimensions] = useState<{ width: number; height: number } | null>(null);

  // 1. Anti-Screenshot / Privacy Protection Listeners
  useEffect(() => {
    // Blur document if browser loses focus or snipping tool steals focus
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    // Keyboard interception for print and screen captures
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('');
        } catch {
          // ignore
        }
        setIsWindowBlurred(true);
        setScreenshotWarning('Notice: Screen capture and screenshots are blocked for this protected document.');
        setTimeout(() => {
          setIsWindowBlurred(false);
          setScreenshotWarning(null);
        }, 2500);
        return;
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setScreenshotWarning('Notice: Printing is restricted by security policy.');
        setTimeout(() => setScreenshotWarning(null), 2500);
        return;
      }

      // Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setScreenshotWarning('Notice: Saving raw document is restricted.');
        setTimeout(() => setScreenshotWarning(null), 2500);
        return;
      }

      // Inspect Shortcuts: Ctrl+Shift+I, Cmd+Option+I, F12
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 2. Load PDF Document from URL / Blob
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

        // Get first page dimensions
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

  // 3. Auto-fit calculation
  const calculateAutoFit = useCallback(
    (mode: FitMode, currentRotation: number = rotation): number => {
      if (!firstPageDimensions || !scrollContainerRef.current) return 1.0;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const containerHeight = scrollContainerRef.current.clientHeight;

      const isRotated90or270 = currentRotation === 90 || currentRotation === 270;
      const pageWidth = isRotated90or270 ? firstPageDimensions.height : firstPageDimensions.width;
      const pageHeight = isRotated90or270 ? firstPageDimensions.width : firstPageDimensions.height;

      const horizontalPadding = containerWidth > 640 ? 48 : 20;
      const verticalPadding = 48;

      const availableWidth = Math.max(180, containerWidth - horizontalPadding);
      const availableHeight = Math.max(180, containerHeight - verticalPadding);

      if (mode === 'width') {
        const fitWidthScale = availableWidth / pageWidth;
        return Math.min(Math.max(fitWidthScale, 0.35), 3.0);
      } else if (mode === 'page') {
        const scaleW = availableWidth / pageWidth;
        const scaleH = availableHeight / pageHeight;
        return Math.min(Math.max(Math.min(scaleW, scaleH), 0.35), 3.0);
      }
      return scale;
    },
    [firstPageDimensions, scale, rotation]
  );

  // Apply fit mode when dimensions, sidebar, or mode changes
  useEffect(() => {
    if (!firstPageDimensions || loading || fitMode === 'custom') return;
    const newScale = calculateAutoFit(fitMode, rotation);
    setScale(newScale);
  }, [firstPageDimensions, fitMode, calculateAutoFit, loading, rotation, sidebarOpen]);

  // 4. Responsive ResizeObserver
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (fitMode === 'width' || fitMode === 'page') {
        const newScale = calculateAutoFit(fitMode, rotation);
        setScale(newScale);
      }
    });

    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [fitMode, calculateAutoFit, rotation]);

  // 5. Render Main PDF Pages
  useEffect(() => {
    if (!pdfDoc || loading) return;

    let isRenderCancelled = false;
    setRenderingPages(true);

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
          const viewport = page.getViewport({ scale, rotation });

          let canvas = pageContainer.querySelector('canvas') as HTMLCanvasElement;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'shadow-2xl rounded-sm block bg-white';
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
  }, [pdfDoc, scale, rotation, loading]);

  // 6. Render Thumbnails into Sidebar
  useEffect(() => {
    if (!pdfDoc || loading || !sidebarOpen) return;

    let isThumbCancelled = false;

    const renderThumbnails = async () => {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (isThumbCancelled) break;

        const thumbContainer = thumbRefs.current[pageNum - 1];
        if (!thumbContainer) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          if (isThumbCancelled) break;

          const baseViewport = page.getViewport({ scale: 1.0, rotation: 0 });
          const thumbWidth = 120;
          const thumbScale = thumbWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: thumbScale, rotation: 0 });

          let canvas = thumbContainer.querySelector('canvas') as HTMLCanvasElement;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'w-full h-auto block rounded shadow bg-white';
            thumbContainer.innerHTML = '';
            thumbContainer.appendChild(canvas);
          }

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;
        } catch {
          // Ignore cancelled renders
        }
      }
    };

    renderThumbnails();

    return () => {
      isThumbCancelled = true;
    };
  }, [pdfDoc, loading, sidebarOpen]);

  // 7. Scroll listener to update active page number indicator
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

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFit = () => {
    if (fitMode === 'width') {
      setFitMode('page');
      setScale(calculateAutoFit('page'));
    } else {
      setFitMode('width');
      setScale(calculateAutoFit('width'));
    }
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

  // Hand Pan Tool Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHandTool || !scrollContainerRef.current) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden bg-[#282c34] select-none text-slate-100"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* =========================================================================
          1. Sleek Top Bar (Matching Reference Image 1)
         ========================================================================= */}
      <header className="shrink-0 h-12 bg-[#323639] border-b border-black/40 px-3 flex items-center justify-between text-xs gap-2 z-30 select-none shadow-md">
        {/* Left: Sidebar Toggle (☰) & Document Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition ${
              sidebarOpen ? 'bg-white/10 text-white' : ''
            }`}
            title={sidebarOpen ? 'Hide Thumbnails' : 'Show Thumbnails'}
            aria-label="Toggle Thumbnails"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-medium text-slate-200 text-sm truncate max-w-[130px] sm:max-w-[240px] md:max-w-[340px]"
              title={title}
            >
              {title}
            </span>
          </div>
        </div>

        {/* Center: Pagination, Zoom Controls, Rotation, Fit & Hand Tool */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Page Counter: [ < ] [ 1 / 4 ] [ > ] */}
          <div className="flex items-center gap-0.5 bg-[#202124]/90 rounded px-1 py-0.5 border border-white/10">
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageSubmit} className="flex items-center gap-1 px-1 font-mono text-xs">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                disabled={loading || numPages === 0}
                className="w-7 text-center bg-transparent border-b border-transparent hover:border-white/30 focus:border-blue-400 py-0.5 text-white font-bold focus:outline-none"
              />
              <span className="text-slate-400">/</span>
              <span className="text-slate-300 font-bold">{numPages || 1}</span>
            </form>

            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages || loading}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-white/15 hidden xs:block" />

          {/* Zoom: [ - ] [ 100% ] [ + ] */}
          <div className="flex items-center gap-0.5 bg-[#202124]/90 rounded px-1 py-0.5 border border-white/10">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.35 || loading}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 text-slate-300"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono px-1.5 min-w-[40px] text-center text-slate-200">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0 || loading}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 text-slate-300"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-white/15 hidden md:block" />

          {/* Fit Toggle Icon */}
          <button
            onClick={handleToggleFit}
            className={`p-1.5 rounded hover:bg-white/10 border border-transparent transition hidden sm:inline-flex text-slate-300 hover:text-white ${
              fitMode === 'width' ? 'text-blue-400' : ''
            }`}
            title={fitMode === 'width' ? 'Fit Entire Page' : 'Fit to Width'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Rotate Clockwise Icon */}
          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-white/10 border border-transparent transition text-slate-300 hover:text-white"
            title="Rotate Clockwise (90°)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Hand Pan Tool */}
          <button
            onClick={() => setIsHandTool((prev) => !prev)}
            className={`p-1.5 rounded border border-transparent transition hidden md:inline-flex ${
              isHandTool ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title={isHandTool ? 'Switch to Selection Tool' : 'Hand Pan Tool'}
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Security Badge & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div
            className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium"
            title="Forensic Watermark & Protected Canvas Active"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Protected</span>
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. Main Body: Thumbnail Sidebar (Left) + Document Viewport (Center)
         ========================================================================= */}
      <div className="flex-1 flex min-h-0 w-full relative overflow-hidden">
        {/* Left Thumbnail Sidebar (Desktop & Mobile Drawer) */}
        {sidebarOpen && (
          <>
            {/* Mobile Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity"
            />

            <aside className="w-44 sm:w-48 shrink-0 bg-[#202124] border-r border-black/40 flex flex-col z-30 h-full overflow-hidden select-none absolute md:relative top-0 bottom-0 left-0 shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200">
              <div className="p-2.5 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Thumbnails ({numPages})
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnails List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Array.from({ length: numPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <div
                      key={`thumb-item-${pageNum}`}
                      onClick={() => {
                        scrollToPage(pageNum);
                        // On small screens, close sidebar when page is selected
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      className="cursor-pointer group flex flex-col items-center"
                    >
                      <div
                        ref={(el) => (thumbRefs.current[idx] = el)}
                        className={`w-28 sm:w-32 min-h-[140px] rounded transition-all duration-150 p-1 flex items-center justify-center bg-[#282c34] border ${
                          isActive
                            ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                            : 'border-white/15 hover:border-white/40 shadow'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 font-mono">P. {pageNum}</span>
                      </div>
                      <span
                        className={`text-[11px] font-mono mt-1 px-2 py-0.5 rounded ${
                          isActive ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>
          </>
        )}

        {/* Center: Main Scrollable Viewport (Matching Image 1 Dark Neutral Canvas Area) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 min-h-0 w-full overflow-y-auto overflow-x-auto relative flex flex-col items-center py-6 px-2 sm:px-6 bg-[#525659] ${
            isHandTool ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {/* Anti-Screenshot Privacy Shield Overlay */}
          {isWindowBlurred && (
            <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-4 shadow-xl">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Protected Document Content</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Display is secured while window is inactive or screen capture tools are active. Click inside the window to return.
              </p>
              <button
                onClick={() => setIsWindowBlurred(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30"
              >
                Resume Viewing
              </button>
            </div>
          )}

          {/* Screenshot Key Alert Toast */}
          {screenshotWarning && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
              <EyeOff className="w-4 h-4" />
              <span>{screenshotWarning}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#525659]/90 z-20">
              <Loader2 className="w-9 h-9 text-blue-400 animate-spin" />
              <p className="text-xs font-medium text-slate-200">Decrypting & rendering document...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="m-auto text-center p-6 max-w-md rounded-2xl bg-red-950/80 border border-red-800 text-red-200 space-y-2">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-1" />
              <h4 className="font-bold text-sm text-white">Unable to Load PDF</h4>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Rendered Canvas Pages Stack */}
          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center gap-6 relative">
              {/* Dynamic Forensic Watermark Overlay */}
              <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none flex flex-wrap items-center justify-around opacity-15 rotate-[-28deg] gap-20 p-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={`wm-${i}`}
                    className="text-[11px] font-mono font-bold text-white tracking-widest whitespace-nowrap select-none"
                  >
                    {watermarkText || `DOCVAULT X • PROTECTED VIEW • ${title} • DO NOT COPY`}
                  </span>
                ))}
              </div>

              {/* Individual Pages */}
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                const isRotated = rotation === 90 || rotation === 270;
                const baseWidth = firstPageDimensions
                  ? isRotated
                    ? firstPageDimensions.height
                    : firstPageDimensions.width
                  : 600;
                const baseHeight = firstPageDimensions
                  ? isRotated
                    ? firstPageDimensions.width
                    : firstPageDimensions.height
                  : 800;

                return (
                  <div
                    key={`pdf-page-${pageNum}`}
                    ref={(el) => (pageRefs.current[index] = el)}
                    id={`pdf-page-${pageNum}`}
                    className="relative transition-transform duration-100 flex items-center justify-center bg-white shadow-2xl rounded-sm"
                    style={{
                      width: `${Math.floor(baseWidth * scale)}px`,
                      minHeight: `${Math.floor(baseHeight * scale)}px`
                    }}
                  >
                    {/* Transparent anti-save/anti-drag touch shield over canvas */}
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
