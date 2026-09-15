/**
 * ShopSphere Customer Repository
 * Data Access Object (DAO) providing type-safe CRUD, pagination, filtering, and indexing.
 */

export interface ICustomer {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  [key: string]: any;
}

export class CustomerRepository {
  private records: Map<string, ICustomer> = new Map();

  public async create(data: Omit<ICustomer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ICustomer> {
    const id = data.id || `customer-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toISOString();
    const entity: ICustomer = {
      ...data,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };
    this.records.set(id, entity);
    return entity;
  }

  public async findById(id: string): Promise<ICustomer | null> {
    const entity = this.records.get(id);
    if (!entity || entity.isDeleted) return null;
    return entity;
  }

  public async findMany(filter: Partial<ICustomer> = {}, page = 1, limit = 20): Promise<{ items: ICustomer[]; total: number; totalPages: number }> {
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

  public async update(id: string, updates: Partial<ICustomer>): Promise<ICustomer | null> {
    const entity = this.records.get(id);
    if (!entity || entity.isDeleted) return null;

    const updatedEntity: ICustomer = {
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

  public async count(filter: Partial<ICustomer> = {}): Promise<number> {
    const res = await this.findMany(filter, 1, 1000000);
    return res.total;
  }
}

export const customerRepository = new CustomerRepository();
