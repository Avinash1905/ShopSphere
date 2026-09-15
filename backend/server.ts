/**
 * ShopSphere Enterprise REST API Server
 * Express application mounting all 26 domain routers, security middleware, and error handlers.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Domain Routes
import authRoutes from './routes/authRoutes';
app.use('/api/auth', authRoutes);
import usersRoutes from './routes/usersRoutes';
app.use('/api/users', usersRoutes);
import customersRoutes from './routes/customersRoutes';
app.use('/api/customers', customersRoutes);
import sellersRoutes from './routes/sellersRoutes';
app.use('/api/sellers', sellersRoutes);
import adminRoutes from './routes/adminRoutes';
app.use('/api/admin', adminRoutes);
import productsRoutes from './routes/productsRoutes';
app.use('/api/products', productsRoutes);
import categoriesRoutes from './routes/categoriesRoutes';
app.use('/api/categories', categoriesRoutes);
import brandsRoutes from './routes/brandsRoutes';
app.use('/api/brands', brandsRoutes);
import variantsRoutes from './routes/variantsRoutes';
app.use('/api/variants', variantsRoutes);
import inventoryRoutes from './routes/inventoryRoutes';
app.use('/api/inventory', inventoryRoutes);
import cartRoutes from './routes/cartRoutes';
app.use('/api/cart', cartRoutes);
import wishlistRoutes from './routes/wishlistRoutes';
app.use('/api/wishlist', wishlistRoutes);
import checkoutRoutes from './routes/checkoutRoutes';
app.use('/api/checkout', checkoutRoutes);
import paymentsRoutes from './routes/paymentsRoutes';
app.use('/api/payments', paymentsRoutes);
import ordersRoutes from './routes/ordersRoutes';
app.use('/api/orders', ordersRoutes);
import shippingRoutes from './routes/shippingRoutes';
app.use('/api/shipping', shippingRoutes);
import returnsRoutes from './routes/returnsRoutes';
app.use('/api/returns', returnsRoutes);
import refundsRoutes from './routes/refundsRoutes';
app.use('/api/refunds', refundsRoutes);
import reviewsRoutes from './routes/reviewsRoutes';
app.use('/api/reviews', reviewsRoutes);
import ratingsRoutes from './routes/ratingsRoutes';
app.use('/api/ratings', ratingsRoutes);
import couponsRoutes from './routes/couponsRoutes';
app.use('/api/coupons', couponsRoutes);
import notificationsRoutes from './routes/notificationsRoutes';
app.use('/api/notifications', notificationsRoutes);
import searchRoutes from './routes/searchRoutes';
app.use('/api/search', searchRoutes);
import analyticsRoutes from './routes/analyticsRoutes';
app.use('/api/analytics', analyticsRoutes);
import reportsRoutes from './routes/reportsRoutes';
app.use('/api/reports', reportsRoutes);
import auditRoutes from './routes/auditRoutes';
app.use('/api/audit', auditRoutes);
import settingsRoutes from './routes/settingsRoutes';
app.use('/api/settings', settingsRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ShopSphere Enterprise API', timestamp: new Date().toISOString() });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.'
    }
  });
});

export default app;

import { initializeDatabase } from '../database/db';

if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`⚡ ShopSphere API Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to initialize database:', err);
  });
}
