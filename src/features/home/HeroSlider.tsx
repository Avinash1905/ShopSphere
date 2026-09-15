import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    tag: 'Flagship Launch Event',
    title: 'Apple iPhone 15 Pro Max in Natural Titanium',
    subtitle: 'A17 Pro Gaming Processor • 5x Optical Zoom • Aerospace Titanium Design',
    price: '$1,199.00',
    originalPrice: '$1,299.00',
    link: '/product/apple-iphone-15-pro-max-titanium',
    bgGradient: 'from-surface-950 via-surface-900 to-brand-950',
    accentColor: 'text-brand-400',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 'slide-2',
    tag: 'Audiophile Silence',
    title: 'Sony WH-1000XM5 Wireless ANC Headphones',
    subtitle: 'Dual Processors • 8 Microphones • LDAC High-Res Audio & 30h Battery',
    price: '$348.00',
    originalPrice: '$399.99',
    link: '/product/sony-wh-1000xm5-wireless-noise-cancelling-headphones',
    bgGradient: 'from-surface-900 via-slate-900 to-indigo-950',
    accentColor: 'text-indigo-400',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 'slide-3',
    tag: 'Iconic Streetwear Heritage',
    title: 'Air Jordan 1 Retro High OG - Chicago Reimagined',
    subtitle: 'Cracked Full-Grain Leather • Encapsulated Air-Sole • Timeless Silhouette',
    price: '$180.00',
    originalPrice: '$220.00',
    link: '/product/nike-air-jordan-1-retro-high-og-chicago',
    bgGradient: 'from-stone-950 via-neutral-900 to-rose-950',
    accentColor: 'text-rose-400',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
  },
];

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface-950 text-white shadow-2xl border border-surface-800">
      <div className={`relative min-h-[460px] md:min-h-[520px] bg-gradient-to-r ${slide.bgGradient} flex items-center transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Text Info */}
          <div className="lg:col-span-7 space-y-6 z-10 animate-fade-in text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{slide.tag}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {slide.title}
            </h1>

            <p className="text-sm sm:text-base text-surface-300 max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-white">{slide.price}</span>
              <span className="text-lg line-through text-surface-400">{slide.originalPrice}</span>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-xs font-bold border border-emerald-500/30">
                In Stock & Ready to Dispatch
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to={slide.link}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Shop This Deal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                Explore All Deals
              </Link>
            </div>
          </div>

          {/* Right Image Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative aspect-square w-72 sm:w-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white backdrop-blur-md bg-white/10 p-3 rounded-2xl border border-white/15">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Official Warranty
                </span>
                <span className="font-bold text-amber-300">Fast Express Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 flex items-center justify-center transition-colors z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/25 flex items-center justify-center transition-colors z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-8 bg-brand-500' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
