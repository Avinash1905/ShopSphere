export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'rejected' | 'archived';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string | null;
  subcategories?: Category[];
  itemCount?: number;
  featured?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  featured?: boolean;
}

export interface ProductAttributeOption {
  id: string;
  name: string;      // e.g., 'Midnight Black', 'Space Gray', '128GB', 'XL'
  value: string;     // e.g., '#111827', '128gb'
  imageExtraUrl?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;      // e.g., 'Color', 'Size', 'Storage', 'Material'
  type: 'color' | 'size' | 'select' | 'text';
  options: ProductAttributeOption[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;     // e.g., "iPhone 15 Pro - Space Gray / 256GB"
  price: number;
  originalPrice?: number;
  costPrice?: number;
  inventoryQuantity: number;
  stockStatus: StockStatus;
  attributes: Record<string, string>; // { "Color": "Space Gray", "Storage": "256GB" }
  barcode?: string;
  imageUrl?: string;
  weightKg?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductSpecification {
  group: string; // e.g., "General", "Display", "Battery", "Dimensions"
  key: string;   // e.g., "Screen Size"
  value: string; // e.g., "6.7 inches OLED"
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  brand: Brand;
  category: Category;
  subCategory?: Category;
  tags: string[];
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  currency: string;
  status: ProductStatus;
  stockStatus: StockStatus;
  totalInventory: number;
  sku: string;
  images: ProductImage[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  rating: number;
  reviewCount: number;
  featured?: boolean;
  isTrending?: boolean;
  isDealOfTheDay?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  returnPolicyDays: number;
  warrantyInfo?: string;
  shippingWeightKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterParams {
  query?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  stockStatus?: StockStatus[];
  tags?: string[];
  sortBy?: 'featured' | 'newest' | 'price_low_high' | 'price_high_low' | 'rating' | 'discount';
  page?: number;
  limit?: number;
  sellerId?: string;
  status?: ProductStatus;
}
