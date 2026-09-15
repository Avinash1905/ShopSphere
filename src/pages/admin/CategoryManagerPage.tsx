import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Plus,
  Trash2,
  Folder,
} from 'lucide-react';

export const CategoryManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'cat_electronics',
      name: 'Electronics & Audio',
      slug: 'electronics',
      description: 'Audio gear, headphones, wearables, and computing devices.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
      productCount: 142,
      isFeatured: true,
      subcategories: [
        { id: 'sub_headphones', name: 'Headphones & Earbuds', slug: 'headphones', productCount: 48 },
        { id: 'sub_wearables', name: 'Smart Watches & Bands', slug: 'wearables', productCount: 36 },
        { id: 'sub_audio', name: 'Hi-Fi Speakers & DACs', slug: 'audio', productCount: 58 },
      ],
    },
    {
      id: 'cat_fashion',
      name: 'Fashion & Apparel',
      slug: 'fashion',
      description: 'Designer streetwear, premium footwear, and accessories.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
      productCount: 98,
      isFeatured: true,
      subcategories: [
        { id: 'sub_mens', name: "Men's Collection", slug: 'mens', productCount: 42 },
        { id: 'sub_womens', name: "Women's Collection", slug: 'womens', productCount: 56 },
      ],
    },
    {
      id: 'cat_home',
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Modern furniture, minimalist decor, and kitchen essentials.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300',
      productCount: 65,
      isFeatured: false,
      subcategories: [
        { id: 'sub_furniture', name: 'Modern Furniture', slug: 'furniture', productCount: 30 },
        { id: 'sub_decor', name: 'Lighting & Decor', slug: 'decor', productCount: 35 },
      ],
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');

  const handleCreateCategory = () => {
    if (!catName) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/\s+/g, '-'),
      description: catDesc,
      image: catImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
      productCount: 0,
      isFeatured: true,
      subcategories: [],
    };
    setCategories([...categories, newCat]);
    setIsModalOpen(false);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatImage('');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Category Taxonomy Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize catalog hierarchies, subcategories, banners, and homepage featured collections.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Add New Category
        </Button>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    {c.isFeatured && <Badge variant="primary" size="sm">Featured</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  <span className="text-[10px] text-slate-500 font-mono">Slug: /{c.slug} • {c.productCount} Total Products</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>

            {/* Subcategories list */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Subcategories ({c.subcategories?.length || 0})
              </span>
              <div className="flex flex-wrap gap-2">
                {c.subcategories?.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300"
                  >
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    {sub.name}
                    <span className="text-[10px] text-slate-500">({sub.productCount})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Category Name"
            placeholder="e.g. Sports & Outdoors"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <Input
            label="Slug"
            placeholder="e.g. sports-outdoors"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
          />
          <Input
            label="Banner / Cover Image URL"
            placeholder="https://images.unsplash.com/..."
            value={catImage}
            onChange={(e) => setCatImage(e.target.value)}
          />
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full p-3 text-sm border border-slate-700 rounded-lg bg-slate-900 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
