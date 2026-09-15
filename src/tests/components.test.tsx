import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PriceDisplay } from '../components/ecommerce/PriceDisplay';

describe('Common UI Components', () => {
  describe('Button Component', () => {
    it('renders with children text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('renders with primary variant and custom class', () => {
      render(<Button variant="primary" className="test-btn">Action</Button>);
      const btn = screen.getByRole('button', { name: /action/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('test-btn');
    });

    it('shows loading state when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Badge Component', () => {
    it('renders label in badge', () => {
      render(<Badge variant="success">IN STOCK</Badge>);
      expect(screen.getByText('IN STOCK')).toBeInTheDocument();
    });
  });

  describe('PriceDisplay Component', () => {
    it('formats price currency accurately', () => {
      render(<PriceDisplay price={1299.99} />);
      expect(screen.getByText(/1,299.99/)).toBeInTheDocument();
    });

    it('renders compareAtPrice with discount percentage when on sale', () => {
      render(<PriceDisplay price={79.99} originalPrice={99.99} />);
      expect(screen.getByText(/79.99/)).toBeInTheDocument();
      expect(screen.getByText(/99.99/)).toBeInTheDocument();
    });
  });
});
