import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name,
  size = 'md',
  isOnline,
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (text?: string) => {
    if (!text) return '?';
    const parts = text.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizes = {
    xs: 'h-6 w-6 text-2xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5 ring-1',
    sm: 'h-2 w-2 ring-1.5',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3 w-3 ring-2',
    xl: 'h-3.5 w-3.5 ring-2',
  };

  return (
    <div className={cn('relative inline-block shrink-0', className)} {...props}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full overflow-hidden font-semibold bg-brand-100 text-brand-700 select-none border border-surface-200',
          sizes[size]
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name || alt)}</span>
        )}
      </div>
      {typeof isOnline === 'boolean' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white',
            isOnline ? 'bg-success-500' : 'bg-surface-400',
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
};
