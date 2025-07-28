'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  imageId: number;
  alt: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  priority?: boolean;
  refreshKey?: number;
  useHighQuality?: boolean; // Nueva prop para forzar alta calidad
}

export default function OptimizedImage({ 
  imageId, 
  alt, 
  className = '', 
  onClick, 
  style, 
  priority = false,
  refreshKey = 0,
  useHighQuality = false
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || priority) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current && !priority) {
      observer.observe(imgRef.current);
    } else if (priority) {
      setIsInView(true);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleHighQualityLoad = () => {
    setHighQualityLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Image load error for ID:', imageId);
  };

  // Build image URLs
  const thumbnailUrl = `/api/images/${imageId}/thumbnail?v=${refreshKey}`;
  const fullImageUrl = `/api/images/${imageId}?v=${refreshKey}`;

  // Determine which image to show based on context
  const shouldUseHighQuality = useHighQuality || priority;
  const initialImageUrl = shouldUseHighQuality ? fullImageUrl : thumbnailUrl;

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={style}
      onClick={onClick}
    >
      {!isInView && !priority ? (
        // Placeholder while not in view
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      ) : imageError ? (
        // Error state
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Error loading image</p>
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" 
                   style={{ animationDuration: '1.5s' }} />
            </div>
          )}
          
          {/* Optimized Image */}
          <Image
            src={initialImageUrl}
            alt={alt}
            fill
            style={{ objectFit: 'cover' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            quality={shouldUseHighQuality ? 90 : 75}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Progressive enhancement: Load high quality version for thumbnails */}
          {!shouldUseHighQuality && imageLoaded && isInView && (
            <Image
              src={fullImageUrl}
              alt={alt}
              fill
              style={{ objectFit: 'cover' }}
              onLoad={handleHighQualityLoad}
              onError={() => {}} // Ignore errors for high quality version
              quality={90}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`transition-opacity duration-500 ${
                highQualityLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </>
      )}
    </div>
  );
}
