import { MigrationDatabaseAdapter } from '../migrations/runner.js';
import { TransactionManager, TransactionOptions } from './transaction_manager.js';
import { UserRepository } from './user.repository.js';
import { RoleRepository, PermissionRepository } from './role_permission.repository.js';
import { SellerRepository } from './seller.repository.js';
import { ProductRepository } from './product.repository.js';
import { CategoryRepository } from './category.repository.js';
import { BrandRepository } from './brand.repository.js';
import { VariantRepository } from './variant.repository.js';
import { InventoryRepository } from './inventory.repository.js';
import { CartRepository, CartItemRepository } from './cart.repository.js';
import { WishlistRepository, WishlistItemRepository } from './wishlist.repository.js';
import { OrderRepository, OrderItemRepository } from './order.repository.js';
import { PaymentRepository } from './payment.repository.js';
import { CouponRepository, CouponUsageRepository } from './coupon.repository.js';
import { ReviewRepository, ReviewVoteRepository } from './review.repository.js';
import { AddressRepository } from './address.repository.js';
import { NotificationRepository } from './notification.repository.js';
import { AuditLogRepository } from './audit_log.repository.js';

export class UnitOfWork {
  private db: MigrationDatabaseAdapter;
  private txManager: TransactionManager;

  // Cached repositories
  public users: UserRepository;
  public roles: RoleRepository;
  public permissions: PermissionRepository;
  public sellers: SellerRepository;
  public products: ProductRepository;
  public categories: CategoryRepository;
  public brands: BrandRepository;
  public variants: VariantRepository;
  public inventory: InventoryRepository;
  public carts: CartRepository;
  public cartItems: CartItemRepository;
  public wishlists: WishlistRepository;
  public wishlistItems: WishlistItemRepository;
  public orders: OrderRepository;
  public orderItems: OrderItemRepository;
  public payments: PaymentRepository;
  public coupons: CouponRepository;
  public couponUsages: CouponUsageRepository;
  public reviews: ReviewRepository;
  public reviewVotes: ReviewVoteRepository;
  public addresses: AddressRepository;
  public notifications: NotificationRepository;
  public auditLogs: AuditLogRepository;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
    this.txManager = new TransactionManager(db);

    this.users = new UserRepository(db);
    this.roles = new RoleRepository(db);
    this.permissions = new PermissionRepository(db);
    this.sellers = new SellerRepository(db);
    this.products = new ProductRepository(db);
    this.categories = new CategoryRepository(db);
    this.brands = new BrandRepository(db);
    this.variants = new VariantRepository(db);
    this.inventory = new InventoryRepository(db);
    this.carts = new CartRepository(db);
    this.cartItems = new CartItemRepository(db);
    this.wishlists = new WishlistRepository(db);
    this.wishlistItems = new WishlistItemRepository(db);
    this.orders = new OrderRepository(db);
    this.orderItems = new OrderItemRepository(db);
    this.payments = new PaymentRepository(db);
    this.coupons = new CouponRepository(db);
    this.couponUsages = new CouponUsageRepository(db);
    this.reviews = new ReviewRepository(db);
    this.reviewVotes = new ReviewVoteRepository(db);
    this.addresses = new AddressRepository(db);
    this.notifications = new NotificationRepository(db);
    this.auditLogs = new AuditLogRepository(db);
  }

  public async execute<R>(
    operation: (uow: UnitOfWork) => Promise<R>,
    options?: TransactionOptions
  ): Promise<R> {
    return this.txManager.runInTransaction(async () => {
      return await operation(this);
    }, options);
  }

  public getDatabase(): MigrationDatabaseAdapter {
    return this.db;
  }
}
