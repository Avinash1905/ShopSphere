import { create } from 'zustand';
import { Product, Category, Brand, ProductFilterParams } from '../types';
import { productService } from '../services';

interface ProductState {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  categories: Category[];
  brands: Brand[];
  featuredProducts: Product[];
  trendingProducts: Product[];
  dealsOfTheDay: Product[];
  selectedProduct: Product | null;
  filters: ProductFilterParams;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  error: string | null;

  fetchProducts: (params?: ProductFilterParams) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<Product>;
  fetchMetadata: () => Promise<void>;
  fetchHomeShowcase: () => Promise<void>;
  setFilters: (filters: Partial<ProductFilterParams>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedProduct: (product: Product | null) => void;
}

const INITIAL_FILTERS: ProductFilterParams = {
  page: 1,
  limit: 12,
  sortBy: 'featured',
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  totalProducts: 0,
  totalPages: 1,
  currentPage: 1,
  categories: [],
  brands: [],
  featuredProducts: [],
  trendingProducts: [],
  dealsOfTheDay: [],
  selectedProduct: null,
  filters: INITIAL_FILTERS,
  viewMode: 'grid',
  isLoading: false,
  error: null,

  fetchProducts: async (customParams) => {
    const activeFilters = { ...get().filters, ...customParams };
    set({ isLoading: true, error: null, filters: activeFilters });
    try {
      const res = await productService.getProducts(activeFilters);
      set({
        products: res.data,
        totalProducts: res.pagination.total,
        totalPages: res.pagination.totalPages,
        currentPage: res.pagination.page,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchProductBySlug: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await productService.getProductBySlug(slug);
      set({ selectedProduct: res.data, isLoading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchMetadata: async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
      ]);
      set({ categories: catRes.data, brands: brandRes.data });
    } catch (err: any) {
      console.error('Failed to load categories and brands', err);
    }
  },

  fetchHomeShowcase: async () => {
    try {
      const [featRes, trendRes, dealsRes] = await Promise.all([
        productService.getFeaturedProducts(8),
        productService.getTrendingProducts(8),
        productService.getDealsOfTheDay(4),
      ]);
      set({
        featuredProducts: featRes.data,
        trendingProducts: trendRes.data,
        dealsOfTheDay: dealsRes.data,
      });
    } catch (err: any) {
      console.error('Failed to load home showcase', err);
    }
  },

  setFilters: (newFilters) => {
    const updated = { ...get().filters, ...newFilters, page: newFilters.page || 1 };
    set({ filters: updated });
    get().fetchProducts(updated);
  },

  resetFilters: () => {
    set({ filters: INITIAL_FILTERS });
    get().fetchProducts(INITIAL_FILTERS);
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}));
