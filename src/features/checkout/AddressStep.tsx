import React, { useState } from 'react';
import { Address } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Check, Plus, MapPin, Edit3, Trash2, Home, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, AddressFormValues } from '../../schemas/checkoutSchemas';

interface AddressStepProps {
  selectedAddressId: string | null;
  onSelectAddress: (address: Address) => void;
  onProceed: () => void;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  selectedAddressId,
  onSelectAddress,
  onProceed,
}) => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || [
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
    defaultValues: {
      type: 'home',
      isDefault: false,
    },
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

  const onSaveAddress = (data: AddressFormValues) => {
    if (editingAddress) {
      const updated = addresses.map((a) =>
        a.id === editingAddress.id ? { ...a, ...data } : a
      );
      setAddresses(updated);
    } else {
      const newAddr: Address = {
        id: `addr_${Date.now()}`,
        userId: user?.id || 'usr_guest',
        ...data,
      };
      setAddresses([...addresses, newAddr]);
      onSelectAddress(newAddr);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shipping Address</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select the destination for your order package.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpenAdd} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;
          return (
            <Card
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className={`p-5 cursor-pointer transition-all border-2 relative hover:border-indigo-400 ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {addr.type === 'home' ? (
                    <Home className="w-4 h-4 text-slate-500" />
                  ) : addr.type === 'work' ? (
                    <Briefcase className="w-4 h-4 text-slate-500" />
                  ) : (
                    <MapPin className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white text-base">
                    {addr.fullName}
                  </span>
                  {addr.isDefault && (
                    <Badge variant="secondary" size="sm">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(addr);
                    }}
                    className="p-1 hover:text-indigo-600 text-slate-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                    className="p-1 hover:text-rose-600 text-slate-400 dark:hover:text-rose-400 transition-colors"
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
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-1 font-mono">
                  Phone: {addr.phone}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {addr.type} Delivery
                </span>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          disabled={!selectedAddressId}
          onClick={onProceed}
          className="min-w-[180px]"
        >
          Continue to Shipping
        </Button>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSubmit(onSaveAddress)} className="space-y-4 pt-2">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +1 (555) 000-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Street Address"
            placeholder="123 Main St"
            error={errors.street?.message}
            {...register('street')}
          />
          <Input
            label="Apartment, Suite, Unit (Optional)"
            placeholder="Apt 4B"
            error={errors.apartment?.message}
            {...register('apartment')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Springfield"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="State / Province"
              placeholder="Oregon"
              error={errors.state?.message}
              {...register('state')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Postal / Zip Code"
              placeholder="97477"
              error={errors.postalCode?.message}
              {...register('postalCode')}
            />
            <Input
              label="Country"
              placeholder="United States"
              error={errors.country?.message}
              {...register('country')}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Address Type:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="home"
                  {...register('type')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Home
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="work"
                  {...register('type')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Work
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  value="other"
                  {...register('type')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Other
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAddress ? 'Save Changes' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
