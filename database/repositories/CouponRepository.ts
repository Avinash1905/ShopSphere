/**
 * ShopSphere Coupon Repository
 * Data Access Object (DAO) providing type-safe CRUD, pagination, filtering, and indexing.
 */

export interface ICoupon {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  [key: string]: any;
}

export class CouponRepository {
  private records: Map<string, ICoupon> = new Map();

  public async create(data: Omit<ICoupon, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ICoupon> {
    const id = data.id || `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toISOString();
    const entity: ICoupon = {
      ...data,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };
    this.records.set(id, entity);
    return entity;
  }

  public async findById(id: string): Promise<ICoupon | null> {
    const entity = this.records.get(id);
    if (!entity || entity.isDeleted) return null;
    return entity;
  }

  public async findMany(filter: Partial<ICoupon> = {}, page = 1, limit = 20): Promise<{ items: ICoupon[]; total: number; totalPages: number }> {
    let matches = Array.from(this.records.values()).filter(e => !e.isDeleted);

    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined) {
        matches = matches.filter(e => e[k] === v);
      }
    }

    const total = matches.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = matches.slice(startIndex, startIndex + limit);

    return { items, total, totalPages };
  }

  public async update(id: string, updates: Partial<ICoupon>): Promise<ICoupon | null> {
    const entity = this.records.get(id);
    if (!entity || entity.isDeleted) return null;

    const updatedEntity: ICoupon = {
      ...entity,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.records.set(id, updatedEntity);
    return updatedEntity;
  }

  public async delete(id: string, softDelete = true): Promise<boolean> {
    const entity = this.records.get(id);
    if (!entity) return false;

    if (softDelete) {
      entity.isDeleted = true;
      entity.updatedAt = new Date().toISOString();
      return true;
    }

    return this.records.delete(id);
  }

  public async count(filter: Partial<ICoupon> = {}): Promise<number> {
    const res = await this.findMany(filter, 1, 1000000);
    return res.total;
  }
}

export const couponRepository = new CouponRepository();
