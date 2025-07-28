'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface AdvancedImageViewerProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasNavigation?: boolean;
  imageIndex?: number;
  totalImages?: number;
  imageMetadata?: {
    size?: number;
    dimensions?: { width: number; height: number };
    format?: string;
    uploadDate?: string;
  };
}

type ViewMode = 'fit' | 'fill' | 'actual' | 'width' | 'height';

export default function AdvancedImageViewer({
  imageUrl,
  alt,
  onClose,
  onPrevious,
  onNext,
  hasNavigation = false,
  imageIndex = 0,
  totalImages = 0,
  imageMetadata
}: AdvancedImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resetear valores cuando cambia la imagen
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setViewMode('fit');
  }, [imageUrl]);

  // Ocultar controles automáticamente
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isFullscreen]);

  // Mostrar controles al mover el mouse
  const handleMouseMoveControls = () => {
    if (!showControls) {
      setShowControls(true);
    }
  };

  // Manejo de pantalla completa
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Escuchar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom con rueda del mouse
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));
    setScale(newScale);
  }, [scale]);

  // Zoom con gestos táctiles
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Gesto de pellizco para zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      // Guardar distancia inicial para comparar
      (e.target as any).initialDistance = distance;
      (e.target as any).initialScale = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialDistance = (e.target as any).initialDistance;
      const initialScale = (e.target as any).initialScale;
      
      if (initialDistance && initialScale) {
        const ratio = distance / initialDistance;
        const newScale = Math.max(0.1, Math.min(5, initialScale * ratio));
        setScale(newScale);
      }
    }
  }, []);

  // Arrastrar imagen
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, isDragging, handleMouseMove, handleMouseUp]);

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case '+':
        case '=':
          setScale(prev => Math.min(5, prev * 1.2));
          break;
        case '-':
          setScale(prev => Math.max(0.1, prev * 0.8));
          break;
        case '0':
          resetView();
          break;
        case 'r':
        case 'R':
          setRotation(prev => (prev + 90) % 360);
          break;
        case 'i':
        case 'I':
          setShowInfo(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose, onPrevious, onNext]);

  // Funciones de control
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  };

  const zoomIn = () => setScale(prev => Math.min(5, prev * 1.2));
  const zoomOut = () => setScale(prev => Math.max(0.1, prev * 0.8));
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${
        isFullscreen ? 'cursor-none' : ''
      }`}
      onMouseMove={handleMouseMoveControls}
    >
      {/* Controles superiores */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium">{alt}</h3>
            {hasNavigation && (
              <span className="text-sm opacity-70">
                {imageIndex + 1} / {totalImages}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Información (I)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Pantalla completa (F)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Cerrar (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navegación lateral */}
      {hasNavigation && onPrevious && (
        <button
          onClick={onPrevious}
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all z-10 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          title="Imagen anterior (←)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {hasNavigation && onNext && (
        <button
          onClick={onNext}
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all z-10 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          title="Imagen siguiente (→)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Contenedor de imagen */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          onLoad={handleImageLoad}
          onMouseDown={handleMouseDown}
          className={`max-w-none transition-transform duration-200 ${
            scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'
          } ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            objectFit: viewMode === 'fit' ? 'contain' : viewMode === 'fill' ? 'cover' : 'none',
            width: viewMode === 'width' ? '100%' : viewMode === 'actual' ? 'auto' : '100%',
            height: viewMode === 'height' ? '100%' : viewMode === 'actual' ? 'auto' : '100%',
            maxWidth: viewMode === 'fit' || viewMode === 'fill' ? '100%' : 'none',
            maxHeight: viewMode === 'fit' || viewMode === 'fill' ? '100%' : 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Controles inferiores */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 z-10 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-center items-center space-x-4 text-white">
          {/* Controles de zoom */}
          <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-2">
            <button onClick={zoomOut} className="p-1 hover:bg-white/20 rounded transition-colors" title="Alejar (-)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm min-w-[4rem] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1 hover:bg-white/20 rounded transition-colors" title="Acercar (+)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Modos de visualización */}
          <div className="flex items-center space-x-1 bg-black/50 rounded-lg px-3 py-2">
            {[
              { mode: 'fit' as ViewMode, label: 'Ajustar', icon: '⊞' },
              { mode: 'fill' as ViewMode, label: 'Llenar', icon: '⊡' },
              { mode: 'width' as ViewMode, label: 'Ancho', icon: '↔' },
              { mode: 'actual' as ViewMode, label: '1:1', icon: '1:1' }
            ].map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === mode ? 'bg-white/30' : 'hover:bg-white/20'
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Controles de imagen */}
          <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-2">
            <button onClick={rotateImage} className="p-1 hover:bg-white/20 rounded transition-colors" title="Rotar (R)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={resetView} className="p-1 hover:bg-white/20 rounded transition-colors" title="Reiniciar (0)">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Controles adicionales */}
        <div className="flex justify-center items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2 text-sm">
            <label className="text-white/70">Brillo:</label>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-white/70 w-10">{brightness}%</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <label className="text-white/70">Contraste:</label>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-white/70 w-10">{contrast}%</span>
          </div>
        </div>
      </div>

      {/* Panel de información */}
      {showInfo && (
        <div className="absolute top-20 right-4 bg-black/80 text-white rounded-lg p-4 max-w-xs z-20">
          <h4 className="font-medium mb-3">Información de la imagen</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-white/70">Dimensiones:</span> {imageDimensions.width} × {imageDimensions.height}px</div>
            <div><span className="text-white/70">Formato:</span> {imageMetadata?.format?.toUpperCase() || 'N/A'}</div>
            <div><span className="text-white/70">Tamaño:</span> {formatFileSize(imageMetadata?.size)}</div>
            <div><span className="text-white/70">Subida:</span> {imageMetadata?.uploadDate ? new Date(imageMetadata.uploadDate).toLocaleDateString() : 'N/A'}</div>
            <div><span className="text-white/70">Zoom:</span> {Math.round(scale * 100)}%</div>
            <div><span className="text-white/70">Rotación:</span> {rotation}°</div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/60">
            <div>⌨️ Atajos de teclado:</div>
            <div>F - Pantalla completa</div>
            <div>+/- - Zoom</div>
            <div>R - Rotar</div>
            <div>I - Info</div>
            <div>0 - Reiniciar</div>
            <div>←/→ - Navegar</div>
          </div>
        </div>
      )}
    </div>
  );
}
