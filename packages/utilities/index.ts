/**
 * ShopSphere Shared Utilities Package
 * Currency, tax calculation, slug generation, math, cryptographic hashing, and data transforms.
 */

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomSuffix}`;
}

export function generateSku(prefix = 'SKU'): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix.toUpperCase()}-${random}`;
}

export function generateTrackingNumber(courier = 'FEDEX'): string {
  const random = Math.floor(100000000000 + Math.random() * 900000000000);
  return `${courier.toUpperCase()}-${random}`;
}

export function calculateDiscount(basePrice: number, discountPercentage: number): number {
  if (!discountPercentage || discountPercentage <= 0) return 0;
  return Number(((basePrice * discountPercentage) / 100).toFixed(2));
}

export function calculateTax(subtotal: number, taxRate = 0.08): number {
  return Number((subtotal * taxRate).toFixed(2));
}

export function calculateShipping(subtotal: number, freeThreshold = 50, standardFee = 5.99): number {
  return subtotal >= freeThreshold ? 0 : standardFee;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
