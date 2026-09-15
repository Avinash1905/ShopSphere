import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useUiStore } from '../../store/uiStore';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { RatingStars } from '../../components/ui/RatingStars';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import { QuantitySelector } from '../../components/ui/QuantitySelector';
import { Tabs } from '../../components/ui/Tabs';
import { ImageGallery } from '../../features/product/ImageGallery';
import { VariantSelector } from '../../features/product/VariantSelector';
import { ProductSpecs } from '../../features/product/ProductSpecs';
import { ReviewList } from '../../features/reviews/ReviewList';
import { RatingBreakdownCard } from '../../features/reviews/RatingBreakdownCard';
import { WriteReviewModal } from '../../features/reviews/WriteReviewModal';
import { ProductGrid } from '../../features/catalog/ProductGrid';
import {
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  CheckCircle,
  Share2,
} from 'lucide-react';
import { ProductVariant } from '../../types';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selectedProduct, fetchProductBySlug, products, isLoading } = useProductStore();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addToast } = useUiStore();

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [matchedVariant, setMatchedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProductBySlug(slug).then((prod) => {
        // Initialize default attributes from first variant
        if (prod.attributes && prod.attributes.length > 0) {
          const defaults: Record<string, string> = {};
          prod.attributes.forEach((attr) => {
            defaults[attr.name] = attr.options[0]?.name;
          });
          setSelectedAttributes(defaults);
          setMatchedVariant(prod.variants[0]);
        }
      });
    }
  }, [slug, fetchProductBySlug]);

  const handleAttributeChange = (attributeName: string, optionName: string) => {
    if (!selectedProduct) return;
    const updated = { ...selectedAttributes, [attributeName]: optionName };
    setSelectedAttributes(updated);

    // Find matching variant
    const variant = selectedProduct.variants.find((v) => {
      return Object.entries(updated).every(([k, val]) => v.attributes[k] === val);
    });
    setMatchedVariant(variant || selectedProduct.variants[0]);
  };

  if (isLoading || !selectedProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-surface-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mx-auto mb-4" />
        <p className="text-xs font-semibold">Loading product specifications...</p>
      </div>
    );
  }

  const isWishlisted = isInWishlist(selectedProduct.id);
  const currentPrice = matchedVariant ? matchedVariant.price : selectedProduct.price;
  const currentOriginalPrice = matchedVariant ? matchedVariant.originalPrice : selectedProduct.originalPrice;

  const handleAddToCart = async () => {
    await addItem(selectedProduct.id, matchedVariant?.id, quantity);
    addToast({
      type: 'success',
      title: 'Added to Cart!',
      message: `${selectedProduct.title} (${quantity}x) added to your cart.`,
    });
  };

  const handleBuyNow = async () => {
    await addItem(selectedProduct.id, matchedVariant?.id, quantity);
    navigate('/checkout');
  };

  const relatedProducts = products.filter(
    (p) => p.id !== selectedProduct.id && p.category.id === selectedProduct.category.id
  ).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Catalog', href: '/catalog' },
          { label: selectedProduct.category.name, href: `/catalog?category=${selectedProduct.category.slug}` },
          { label: selectedProduct.title, isCurrent: true },
        ]}
      />

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 sticky top-28">
          <ImageGallery images={selectedProduct.images} title={selectedProduct.title} />
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Brand & Badges */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to={`/catalog?brands=${selectedProduct.brand.id}`}
              className="text-xs font-bold uppercase tracking-widest text-brand-600 hover:underline"
            >
              {selectedProduct.brand.name}
            </Link>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                addToast({ type: 'info', title: 'Link Copied', message: 'Product URL copied to clipboard.' });
              }}
              className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-900 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight leading-snug">
            {selectedProduct.title}
          </h1>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3">
            <RatingStars rating={selectedProduct.rating} reviewCount={selectedProduct.reviewCount} size="sm" />
            <span className="text-surface-300">|</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> 100% Authentic Verified
            </span>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl bg-surface-50 p-4 border border-surface-200">
            <PriceDisplay
              price={currentPrice}
              originalPrice={currentOriginalPrice}
              size="2xl"
            />
            <p className="text-2xs text-surface-500 mt-1">
              Inclusive of all applicable platform taxes. Free express shipping on orders over $75.
            </p>
          </div>

          {/* Short Description */}
          <p className="text-xs text-surface-600 leading-relaxed">
            {selectedProduct.shortDescription}
          </p>

          {/* Variant Selector */}
          <VariantSelector
            product={selectedProduct}
            selectedAttributes={selectedAttributes}
            onAttributeChange={handleAttributeChange}
            matchedVariant={matchedVariant}
          />

          {/* Quantity & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-surface-500">
                  Quantity
                </span>
                <QuantitySelector
                  quantity={quantity}
                  min={1}
                  max={matchedVariant?.inventoryQuantity || selectedProduct.totalInventory || 10}
                  onChange={setQuantity}
                />
              </div>

              {/* Wishlist Toggle Button */}
              <div className="flex flex-col space-y-1 flex-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-surface-500">
                  Wishlist
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(selectedProduct)}
                  className={`btn-secondary h-10 w-full rounded-xl flex items-center justify-center gap-2 text-xs font-bold ${
                    isWishlisted ? 'text-rose-600 border-rose-200 bg-rose-50/50' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Main CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn-secondary h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-brand-600 text-brand-700 hover:bg-brand-50 shadow-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Cart</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn-primary h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-500/25"
              >
                <Zap className="h-4 w-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-surface-200 bg-white p-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Truck className="h-5 w-5 text-brand-600" />
              <span className="text-2xs font-bold text-surface-800">2-3 Day Delivery</span>
              <span className="text-3xs text-surface-400">Tracked shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <span className="text-2xs font-bold text-surface-800">{selectedProduct.returnPolicyDays}-Day Return</span>
              <span className="text-3xs text-surface-400">Direct refund</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-2xs font-bold text-surface-800">1-Yr Warranty</span>
              <span className="text-3xs text-surface-400">Official support</span>
            </div>
          </div>

          {/* Seller Card */}
          <div className="flex items-center justify-between rounded-2xl border border-surface-200 bg-surface-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-3xs font-bold uppercase tracking-wider text-surface-400">Sold & Shipped by</p>
                <h5 className="text-xs font-bold text-surface-900">{selectedProduct.sellerName}</h5>
              </div>
            </div>
            <Link
              to="/seller/profile"
              className="rounded-lg bg-white px-3 py-1.5 text-2xs font-bold text-brand-600 border border-surface-200 hover:bg-surface-50 shadow-2xs"
            >
              Visit Store
            </Link>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="space-y-6 pt-6 border-t border-surface-200">
        <Tabs
          tabs={[
            { id: 'description', label: 'Detailed Description' },
            { id: 'specifications', label: 'Specifications & Dimensions' },
            { id: 'reviews', label: `Customer Reviews (${selectedProduct.reviewCount})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />

        <div className="pt-2">
          {activeTab === 'description' && (
            <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line bg-white p-8 rounded-3xl border border-surface-200 shadow-2xs">
              {selectedProduct.description}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="bg-white p-8 rounded-3xl border border-surface-200 shadow-2xs">
              <ProductSpecs specifications={selectedProduct.specifications} />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 bg-white p-8 rounded-3xl border border-surface-200 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-8">
                  <RatingBreakdownCard productId={selectedProduct.id} />
                </div>
                <div className="md:col-span-4 text-center md:text-right">
                  <button
                    type="button"
                    onClick={() => setIsWriteReviewOpen(true)}
                    className="btn-primary px-6 py-3 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Write a Verified Review
                  </button>
                </div>
              </div>

              <ReviewList productId={selectedProduct.id} />
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        productId={selectedProduct.id}
        productTitle={selectedProduct.title}
      />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-surface-200">
          <h3 className="text-xl font-bold text-surface-900">You Might Also Like</h3>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
};
