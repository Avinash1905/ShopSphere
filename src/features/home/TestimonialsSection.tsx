import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Sarah Jenkins',
    location: 'Austin, TX',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    comment: 'ShopSphere completely transformed how I order premium tech gear. The iPhone 15 Pro arrived within 24 hours with serialized tamper proof seals and official warranty.',
    rating: 5,
    productPurchased: 'Apple iPhone 15 Pro Max',
  },
  {
    id: 't-2',
    name: 'Michael Chang',
    location: 'San Francisco, CA',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    comment: 'The multi-vendor transparency is incredible. Seeing seller ratings, direct chat capabilities, and return policies up front makes checking out seamless.',
    rating: 5,
    productPurchased: 'Sony WH-1000XM5 Headphones',
  },
  {
    id: 't-3',
    name: 'Emily Thornton',
    location: 'Chicago, IL',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    comment: 'Nordic Oak Dining Table is even more breathtaking in person. Smooth delivery coordination and impeccable customer concierge support.',
    rating: 5,
    productPurchased: 'Nordic Solid White Oak Table',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-2xs font-bold uppercase tracking-widest text-brand-600">
          Customer Satisfaction
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          Loved by 100,000+ Discerning Shoppers
        </h2>
        <p className="text-xs text-surface-500">
          Real experiences from verified customers across the ShopSphere ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="flex flex-col justify-between rounded-3xl border border-surface-200 bg-white p-6 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-brand-200 relative"
          >
            <Quote className="absolute top-5 right-5 h-8 w-8 text-surface-100 -z-0" />
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-surface-700 leading-relaxed italic">
                "{t.comment}"
              </p>
            </div>

            <div className="pt-6 border-t border-surface-100 flex items-center gap-3 z-10 mt-4">
              <img
                src={t.avatar}
                alt={t.name}
                className="h-10 w-10 rounded-full object-cover border border-surface-200"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-surface-900">{t.name}</span>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1.5 text-3xs text-surface-400">
                  <span>{t.location}</span>
                  <span>•</span>
                  <span className="text-brand-600 font-semibold">{t.productPurchased}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
