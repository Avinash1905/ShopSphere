export type ProductStatus = 'draft' | 'pending_approval' | 'pending' | 'active' | 'rejected' | 'archived';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  image?: string;
  parentId?: string | null;
  subcategories?: Category[];
  itemCount?: number;
  productCount?: number;
  featured?: boolean;
  isFeatured?: boolean;
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
  name: string;
  value: string;
  imageExtraUrl?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'color' | 'size' | 'select' | 'text';
  options: ProductAttributeOption[];
}

export interface ProductVariant {
  id: string;
  productId?: string;
  sku: string;
  name?: string;
  title?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  inventoryQuantity: number;
  stock?: number;
  stockStatus?: StockStatus;
  attributes: Record<string, string>;
  barcode?: string;
  imageUrl?: string;
  weightKg?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  alt?: string;
  isPrimary: boolean;
  order?: number;
}

export interface ProductSpecification {
  group?: string;
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  name?: string;
  slug: string;
  shortDescription?: string;
  description: string;
  brand: Brand;
  category: Category;
  categoryId?: string;
  subCategory?: Category;
  tags: string[];
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  currency?: string;
  status: ProductStatus;
  stockStatus: StockStatus;
  totalInventory: number;
  stock?: number;
  sku: string;
  images: ProductImage[];
  attributes?: ProductAttribute[];
  variants: ProductVariant[];
  specifications: ProductSpecification[] | any;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  isTrending?: boolean;
  isDealOfTheDay?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  returnPolicyDays?: number;
  warrantyInfo?: string;
  shippingWeightKg?: number;
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
