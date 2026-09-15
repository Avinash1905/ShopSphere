import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCard } from '../../components/ui/ProductCard';
import { Flame, ArrowRight } from 'lucide-react';

export const DealsSection: React.FC = () => {
  const { dealsOfTheDay, products } = useProductStore();
  const { addItem } = useCartStore();
  const { wishlist, toggleWishlist } = useWishlistStore();

  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayDeals = dealsOfTheDay.length > 0 ? dealsOfTheDay : products.slice(0, 4);

  return (
    <section className="rounded-3xl bg-gradient-to-br from-rose-50/70 via-orange-50/50 to-amber-50/60 p-6 sm:p-8 border border-rose-200/60 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-3xs font-bold uppercase text-white tracking-wider">
                Limited Time
              </span>
              <span className="text-2xs font-semibold text-rose-700">Deals refresh daily</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-surface-900 tracking-tight">
              Flash Deals of the Day
            </h3>
          </div>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-surface-600 mr-1">Ends in:</span>
          <div className="flex items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-900 text-white text-xs font-bold shadow-xs">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="font-bold text-surface-900">:</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-900 text-white text-xs font-bold shadow-xs">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="font-bold text-surface-900">:</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayDeals.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlist.some((w) => w.id === product.id)}
            onWishlistToggle={() => toggleWishlist(product)}
            onAddToCart={() => addItem(product.id, product.variants[0]?.id, 1)}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/catalog?filter=deals"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-50 transition-colors"
        >
          <span>View All 80+ Flash Deals</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
};
