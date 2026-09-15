import React, { useState } from 'react';
import { ProductImage } from '../../types';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ImageGalleryProps {
  images: ProductImage[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const activeImage = images[selectedIndex] || images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Main Image with Interactive Loupe Zoom */}
      <div
        className="relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-100 border border-surface-200 cursor-crosshair group shadow-xs"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={activeImage?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'}
          alt={activeImage?.altText || title}
          className="h-full w-full object-cover transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {isZoomed && (
          <div
            className="absolute inset-0 pointer-events-none hidden md:block"
            style={{
              backgroundImage: `url(${activeImage?.url})`,
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundSize: '220%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Zoom Hint */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-3xs font-bold text-surface-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Roll over to zoom</span>
        </div>

        {/* Carousel navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-surface-700 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-surface-700 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                idx === selectedIndex
                  ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-surface-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={img.altText} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
