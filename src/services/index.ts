import { apiAuthService } from './api/authService';
import { mockAuthService } from './mock/mockAuthService';
import { apiProductService } from './api/productService';
import { mockProductService } from './mock/mockProductService';
import { apiSearchService } from './api/searchService';
import { mockSearchService } from './mock/mockSearchService';
import { apiCartService } from './api/cartService';
import { mockCartService } from './mock/mockCartService';
import { apiOrderService } from './api/orderService';
import { mockOrderService } from './mock/mockOrderService';
import { apiPaymentService } from './api/paymentService';
import { mockPaymentService } from './mock/mockPaymentService';
import { apiSellerService } from './api/sellerService';
import { mockSellerService } from './mock/mockSellerService';
import { apiAdminService } from './api/adminService';
import { mockAdminService } from './mock/mockAdminService';
import { apiCouponService } from './api/couponService';
import { mockCouponService } from './mock/mockCouponService';
import { apiReviewService } from './api/reviewService';
import { mockReviewService } from './mock/mockReviewService';
import { apiNotificationService } from './api/notificationService';
import { mockNotificationService } from './mock/mockNotificationService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const authService = USE_MOCK ? mockAuthService : apiAuthService;
export const productService = USE_MOCK ? mockProductService : apiProductService;
export const searchService = USE_MOCK ? mockSearchService : apiSearchService;
export const cartService = USE_MOCK ? mockCartService : apiCartService;
export const orderService = USE_MOCK ? mockOrderService : apiOrderService;
export const paymentService = USE_MOCK ? mockPaymentService : apiPaymentService;
export const sellerService = USE_MOCK ? mockSellerService : apiSellerService;
export const adminService = USE_MOCK ? mockAdminService : apiAdminService;
export const couponService = USE_MOCK ? mockCouponService : apiCouponService;
export const reviewService = USE_MOCK ? mockReviewService : apiReviewService;
export const notificationService = USE_MOCK ? mockNotificationService : apiNotificationService;

export * from './api/httpClient';
export * from './mock/mockStorage';
