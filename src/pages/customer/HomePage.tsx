import React, { useEffect } from 'react';
import { HeroSlider } from '../../features/home/HeroSlider';
import { CategoryShowcase } from '../../features/home/CategoryShowcase';
import { DealsSection } from '../../features/home/DealsSection';
import { TrendingProducts } from '../../features/home/TrendingProducts';
import { BrandSpotlight } from '../../features/home/BrandSpotlight';
import { TestimonialsSection } from '../../features/home/TestimonialsSection';
import { useProductStore } from '../../store/productStore';

export const HomePage: React.FC = () => {
  const { fetchHomeShowcase } = useProductStore();

  useEffect(() => {
    fetchHomeShowcase();
  }, [fetchHomeShowcase]);

  return (
    <div className="space-y-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
      <HeroSlider />
      <CategoryShowcase />
      <DealsSection />
      <TrendingProducts />
      <BrandSpotlight />
      <TestimonialsSection />
    </div>
  );
};
