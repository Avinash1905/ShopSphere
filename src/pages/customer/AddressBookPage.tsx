import React, { useState } from 'react';
import { Address } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { MapPin, Plus, Edit3, Trash2, Home, Briefcase, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, AddressFormValues } from '../../schemas/addressSchema';

export const AddressBookPage: React.FC = () => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr_1',
      userId: user?.id || 'usr_1',
      fullName: user?.name || 'Alex Morgan',
      phone: '+1 (555) 234-5678',
      street: '742 Evergreen Terrace',
      apartment: 'Apt 4B',
      city: 'Springfield',
      state: 'Oregon',
      postalCode: '97477',
      country: 'United States',
      type: 'home',
      isDefault: true,
    },
    {
      id: 'addr_2',
      userId: user?.id || 'usr_1',
      fullName: user?.name || 'Alex Morgan',
      phone: '+1 (555) 876-5432',
      street: '100 Silicon Way',
      apartment: 'Suite 300',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94105',
      country: 'United States',
      type: 'work',
      isDefault: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  const handleOpenAdd = () => {
    setEditingAddress(null);
    reset({
      fullName: user?.name || '',
      phone: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      type: 'home',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    reset({
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      type: addr.type,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const onSave = (data: AddressFormValues) => {
    if (editingAddress) {
      setAddresses(
        addresses.map((a) => (a.id === editingAddress.id ? { ...a, ...data } : a))
      );
    } else {
      const newAddr: Address = {
        id: `addr_${Date.now()}`,
        userId: user?.id || 'usr_guest',
        ...data,
      };
      if (data.isDefault) {
        setAddresses(addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr));
      } else {
        setAddresses([...addresses, newAddr]);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Saved Addresses
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your delivery destinations and primary default billing addresses.
          </p>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-5 rounded-xl border-2 transition-all relative ${
              addr.isDefault
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {addr.type === 'home' ? (
                  <Home className="w-4 h-4 text-slate-500" />
                ) : (
                  <Briefcase className="w-4 h-4 text-slate-500" />
                )}
                <span className="font-bold text-slate-900 dark:text-white">
                  {addr.fullName}
                </span>
                {addr.isDefault && (
                  <Badge variant="primary" size="sm">
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-1 hover:text-indigo-600 text-slate-400"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1 hover:text-rose-600 text-slate-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 space-y-0.5">
              <p>{addr.street} {addr.apartment}</p>
              <p>
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p>{addr.country}</p>
              <p className="text-xs text-slate-400 font-mono pt-1">
                Phone: {addr.phone}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">
                {addr.type} Address
              </span>
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
          <Input label="Full Name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Phone Number" error={errors.phone?.message} {...register('phone')} />
          <Input label="Street Address" error={errors.street?.message} {...register('street')} />
          <Input label="Apartment / Suite" error={errors.apartment?.message} {...register('apartment')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Postal Code" error={errors.postalCode?.message} {...register('postalCode')} />
            <Input label="Country" error={errors.country?.message} {...register('country')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Address</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
