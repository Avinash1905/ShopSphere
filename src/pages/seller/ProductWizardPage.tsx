import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSellerStore } from '../../store/sellerStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

type WizardStep = 'basics' | 'media' | 'variants' | 'pricing' | 'seo';

interface VariantOption {
  name: string;
  values: string[];
}

export const ProductWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createProduct } = useSellerStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState(`SS-${Math.floor(1000 + Math.random() * 9000)}`);

  // Step 2: Media
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Step 3: Variants
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([
    { name: 'Color', values: ['Space Gray', 'Matte Black', 'Silver'] },
    { name: 'Storage / Size', values: ['Standard', 'Pro 256GB'] },
  ]);

  // Step 4: Pricing & Inventory
  const [basePrice, setBasePrice] = useState(199.99);
  const [comparePrice, setComparePrice] = useState(249.99);
  const [costPerItem, setCostPerItem] = useState(110.00);
  const [stockQuantity, setStockQuantity] = useState(50);
  const [barcode, setBarcode] = useState('8901234567890');

  // Step 5: SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'basics', label: '1. Basic Information' },
    { id: 'media', label: '2. Product Images' },
    { id: 'variants', label: '3. Options & Variants' },
    { id: 'pricing', label: '4. Pricing & Inventory' },
    { id: 'seo', label: '5. Review & Submit' },
  ];

  const handleAddImage = () => {
    if (!imageUrlInput) return;
    setImages([...images, imageUrlInput]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
    const updated = [...variantOptions];
    updated[optIndex].values = updated[optIndex].values.filter((_, i) => i !== valIndex);
    setVariantOptions(updated);
  };

  const handleCreateProduct = async () => {
    setIsSubmitting(true);
    try {
      await createProduct({
        name: title || 'New Premium Audio System',
        brand: { id: 'b_1', name: brand || 'Aura Sound', slug: (brand || 'aura').toLowerCase().replace(/\s+/g, '-') },
        category: { id: 'c_1', name: category || 'Electronics', slug: (category || 'electronics').toLowerCase().replace(/\s+/g, '-') },
        description: description || 'High fidelity acoustic audio profile.',
        sku,
        price: basePrice,
        compareAtPrice: comparePrice,
        stock: stockQuantity,
        totalInventory: stockQuantity,
        images: images.map((url, idx) => ({
          id: `img_${idx}`,
          url,
          alt: title,
          isPrimary: idx === 0,
        })),
        variants: [
          {
            id: 'var_1',
            sku: `${sku}-BLK`,
            name: 'Matte Black',
            price: basePrice,
            inventoryQuantity: Math.floor(stockQuantity / 2),
            stock: Math.floor(stockQuantity / 2),
            attributes: { color: 'Black' },
          },
        ],
        specifications: {
          Connectivity: 'Bluetooth 5.3',
          'Battery Life': '40 Hours',
          Warranty: '2 Years Manufacturer',
        },
        tags: ['wireless', 'anc', 'audiophile', 'new'],
      });
      navigate('/seller/products');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {id ? 'Edit Product Listing' : 'Create New Product Listing'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Step-by-step wizard to publish high-converting catalog listings.
          </p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {steps.map((s) => {
          const isActive = currentStep === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(s.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Wizard Step Panels */}
      <Card className="p-6 sm:p-8">
        {/* Step 1: Basics */}
        {currentStep === 'basics' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</h2>
            <Input
              label="Product Title"
              placeholder="e.g. Aura Wireless Noise Cancelling Headphones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Brand Name"
                placeholder="e.g. Aura Sound"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Electronics">Electronics & Gadgets</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Home & Living">Home & Kitchen</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                </select>
              </div>
              <Input
                label="Master SKU"
                placeholder="SS-8492"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Product Description
              </label>
              <textarea
                rows={5}
                placeholder="Detailed features, materials, craftsmanship, and specs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep('media')} className="gap-2">
                Continue to Media <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {currentStep === 'media' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Gallery</h2>

            <div className="flex gap-3">
              <Input
                placeholder="Enter image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddImage} className="gap-1.5 shrink-0">
                <Plus className="w-4 h-4" /> Add Image
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {images.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100">
                  <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Cover Image
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCurrentStep('basics')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('variants')} className="gap-2">
                Continue to Variants <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Variants */}
        {currentStep === 'variants' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Product Options & Variants</h2>
                <p className="text-xs text-slate-500">Configure multi-option variations like Colors, Sizes, and Materials.</p>
              </div>
            </div>

            <div className="space-y-4">
              {variantOptions.map((opt, optIdx) => (
                <div key={optIdx} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold uppercase text-slate-500">{opt.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val, valIdx) => (
                      <span
                        key={valIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCurrentStep('media')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('pricing')} className="gap-2">
                Continue to Pricing <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Pricing & Inventory */}
        {currentStep === 'pricing' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pricing & Stock Levels</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Selling Price ($)"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Compare-at Price ($)"
                type="number"
                value={comparePrice}
                onChange={(e) => setComparePrice(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Cost Per Item ($)"
                type="number"
                value={costPerItem}
                onChange={(e) => setCostPerItem(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Total Inventory Stock"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              />
              <Input
                label="Barcode / UPC / EAN"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              <b>Profit Margin:</b> ${ (basePrice - costPerItem).toFixed(2) } ({ basePrice > 0 ? (((basePrice - costPerItem) / basePrice) * 100).toFixed(1) : 0 }%)
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCurrentStep('variants')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('seo')} className="gap-2">
                Continue to Final Review <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 'seo' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">SEO & Final Review</h2>

            <div className="space-y-4">
              <Input
                label="SEO Meta Title"
                placeholder={title || 'Product Page Title'}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Appears in search engine results snippets..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white">Listing Summary:</h4>
              <p><b>Product:</b> {title || 'Untitled'}</p>
              <p><b>Brand:</b> {brand} | <b>Category:</b> {category} | <b>SKU:</b> {sku}</p>
              <p><b>Price:</b> ${basePrice.toFixed(2)} | <b>Total Units:</b> {stockQuantity}</p>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCurrentStep('pricing')}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleCreateProduct}
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Publish Listing
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
