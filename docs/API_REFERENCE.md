# ShopSphere REST API Reference Specification

All API endpoints follow standardized JSON responses with error contracts and pagination envelopes.

## 📌 Standard Response Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 📚 26 API Domains
- `/api/auth` — Complete CRUD and domain actions for auth
- `/api/users` — Complete CRUD and domain actions for users
- `/api/customers` — Complete CRUD and domain actions for customers
- `/api/sellers` — Complete CRUD and domain actions for sellers
- `/api/admin` — Complete CRUD and domain actions for admin
- `/api/products` — Complete CRUD and domain actions for products
- `/api/categories` — Complete CRUD and domain actions for categories
- `/api/brands` — Complete CRUD and domain actions for brands
- `/api/variants` — Complete CRUD and domain actions for variants
- `/api/inventory` — Complete CRUD and domain actions for inventory
- `/api/cart` — Complete CRUD and domain actions for cart
- `/api/wishlist` — Complete CRUD and domain actions for wishlist
- `/api/checkout` — Complete CRUD and domain actions for checkout
- `/api/payments` — Complete CRUD and domain actions for payments
- `/api/orders` — Complete CRUD and domain actions for orders
- `/api/shipping` — Complete CRUD and domain actions for shipping
- `/api/returns` — Complete CRUD and domain actions for returns
- `/api/refunds` — Complete CRUD and domain actions for refunds
- `/api/reviews` — Complete CRUD and domain actions for reviews
- `/api/ratings` — Complete CRUD and domain actions for ratings
- `/api/coupons` — Complete CRUD and domain actions for coupons
- `/api/notifications` — Complete CRUD and domain actions for notifications
- `/api/search` — Complete CRUD and domain actions for search
- `/api/analytics` — Complete CRUD and domain actions for analytics
- `/api/reports` — Complete CRUD and domain actions for reports
- `/api/audit` — Complete CRUD and domain actions for audit
- `/api/settings` — Complete CRUD and domain actions for settings
