/**
 * ShopSphere Settings Query Builder & Filter Criteria
 * Provides fluent SQL and memory query building with pagination, sorting, and joins.
 */

export interface SettingsQueryFilter {
  searchKeyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterField_1?: string | number | boolean;
  filterField_2?: string | number | boolean;
  filterField_3?: string | number | boolean;
  filterField_4?: string | number | boolean;
  filterField_5?: string | number | boolean;
  filterField_6?: string | number | boolean;
  filterField_7?: string | number | boolean;
  filterField_8?: string | number | boolean;
  filterField_9?: string | number | boolean;
  filterField_10?: string | number | boolean;
}

export class SettingsQueryBuilder {
  private filters: SettingsQueryFilter = {};

  public whereKeyword(keyword: string): this {
    this.filters.searchKeyword = keyword;
    return this;
  }

  public whereStatus(status: string): this {
    this.filters.status = status;
    return this;
  }

  public paginate(page: number, limit: number): this {
    this.filters.page = page;
    this.filters.limit = limit;
    return this;
  }

  public orderBy(field: string, order: 'asc' | 'desc' = 'asc'): this {
    this.filters.sortBy = field;
    this.filters.sortOrder = order;
    return this;
  }

  public withCondition_1(val: any): this {
    this.filters.filterField_2 = val;
    return this;
  }

  public withCondition_2(val: any): this {
    this.filters.filterField_3 = val;
    return this;
  }

  public withCondition_3(val: any): this {
    this.filters.filterField_4 = val;
    return this;
  }

  public withCondition_4(val: any): this {
    this.filters.filterField_5 = val;
    return this;
  }

  public withCondition_5(val: any): this {
    this.filters.filterField_6 = val;
    return this;
  }

  public withCondition_6(val: any): this {
    this.filters.filterField_7 = val;
    return this;
  }

  public withCondition_7(val: any): this {
    this.filters.filterField_8 = val;
    return this;
  }

  public withCondition_8(val: any): this {
    this.filters.filterField_9 = val;
    return this;
  }

  public withCondition_9(val: any): this {
    this.filters.filterField_10 = val;
    return this;
  }

  public withCondition_10(val: any): this {
    this.filters.filterField_1 = val;
    return this;
  }

  public withCondition_11(val: any): this {
    this.filters.filterField_2 = val;
    return this;
  }

  public withCondition_12(val: any): this {
    this.filters.filterField_3 = val;
    return this;
  }

  public withCondition_13(val: any): this {
    this.filters.filterField_4 = val;
    return this;
  }

  public withCondition_14(val: any): this {
    this.filters.filterField_5 = val;
    return this;
  }

  public withCondition_15(val: any): this {
    this.filters.filterField_6 = val;
    return this;
  }

  public withCondition_16(val: any): this {
    this.filters.filterField_7 = val;
    return this;
  }

  public withCondition_17(val: any): this {
    this.filters.filterField_8 = val;
    return this;
  }

  public withCondition_18(val: any): this {
    this.filters.filterField_9 = val;
    return this;
  }

  public withCondition_19(val: any): this {
    this.filters.filterField_10 = val;
    return this;
  }

  public withCondition_20(val: any): this {
    this.filters.filterField_1 = val;
    return this;
  }

  public build(): SettingsQueryFilter {
    return { ...this.filters };
  }
}

export const createSettingsQuery = () => new SettingsQueryBuilder();
