import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from '../layouts/CustomerLayout';
import { SellerLayout } from '../layouts/SellerLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Route Guards
import { RoleGuard } from './RoleGuard';

// Customer & Public Pages
import { HomePage } from '../pages/customer/HomePage';
import { CatalogPage } from '../pages/customer/CatalogPage';
import { CategoryPage } from '../pages/customer/CategoryPage';
import { ProductDetailPage } from '../pages/customer/ProductDetailPage';
import { CartPage } from '../pages/customer/CartPage';
import { WishlistPage } from '../pages/customer/WishlistPage';
import { CheckoutPage } from '../pages/customer/CheckoutPage';
import { OrderSuccessPage } from '../pages/customer/OrderSuccessPage';
import { OrderTrackingPage } from '../pages/customer/OrderTrackingPage';
import { OrderHistoryPage } from '../pages/customer/OrderHistoryPage';
import { OrderDetailPage } from '../pages/customer/OrderDetailPage';
import { InvoicePage } from '../pages/customer/InvoicePage';
import { CustomerProfilePage } from '../pages/customer/CustomerProfilePage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';

// Seller Portal Pages
import { SellerDashboardPage } from '../pages/seller/SellerDashboardPage';
import { SellerProductsPage } from '../pages/seller/SellerProductsPage';
import { ProductWizardPage } from '../pages/seller/ProductWizardPage';
import { SellerInventoryPage } from '../pages/seller/SellerInventoryPage';
import { SellerOrdersPage } from '../pages/seller/SellerOrdersPage';
import { SellerReturnsPage } from '../pages/seller/SellerReturnsPage';
import { SellerCouponsPage } from '../pages/seller/SellerCouponsPage';
import { SellerAnalyticsPage } from '../pages/seller/SellerAnalyticsPage';
import { SellerPayoutsPage } from '../pages/seller/SellerPayoutsPage';
import { StoreSettingsPage } from '../pages/seller/StoreSettingsPage';

// Admin Portal Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { UserDetailPage } from '../pages/admin/UserDetailPage';
import { AdminSellersPage } from '../pages/admin/AdminSellersPage';
import { SellerApprovalPage } from '../pages/admin/SellerApprovalPage';
import { AdminProductApprovalsPage } from '../pages/admin/AdminProductApprovalsPage';
import { CategoryManagerPage } from '../pages/admin/CategoryManagerPage';
import { GlobalCouponsPage } from '../pages/admin/GlobalCouponsPage';
import { ReviewModerationPage } from '../pages/admin/ReviewModerationPage';
import { DisputeCenterPage } from '../pages/admin/DisputeCenterPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { PlatformSettingsPage } from '../pages/admin/PlatformSettingsPage';

// Common
import { NotFoundPage } from '../pages/common/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/invoice/:orderId" element={<InvoicePage />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
      </Route>

      {/* Seller Portal Protected Routes */}
      <Route
        path="/seller"
        element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboardPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="products/new" element={<ProductWizardPage />} />
        <Route path="products/edit/:id" element={<ProductWizardPage />} />
        <Route path="inventory" element={<SellerInventoryPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="returns" element={<SellerReturnsPage />} />
        <Route path="coupons" element={<SellerCouponsPage />} />
        <Route path="analytics" element={<SellerAnalyticsPage />} />
        <Route path="payouts" element={<SellerPayoutsPage />} />
        <Route path="settings" element={<StoreSettingsPage />} />
      </Route>

      {/* Super Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="sellers" element={<AdminSellersPage />} />
        <Route path="seller-approvals" element={<SellerApprovalPage />} />
        <Route path="product-approvals" element={<AdminProductApprovalsPage />} />
        <Route path="categories" element={<CategoryManagerPage />} />
        <Route path="coupons" element={<GlobalCouponsPage />} />
        <Route path="reviews" element={<ReviewModerationPage />} />
        <Route path="disputes" element={<DisputeCenterPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
