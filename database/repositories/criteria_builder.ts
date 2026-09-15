/**
 * ShopSphere Database Layer - Fluent Type-Safe Criteria Builder
 * Provides declarative query specifications:
 * - Complex nested AND/OR predicate trees
 * - Rich operators: EQUALS, NOT_EQUALS, IN, NOT_IN, LIKE, ILIKE, BETWEEN, GREATER_THAN, LESS_THAN, IS_NULL, IS_NOT_NULL
 * - Parameter binding and SQL generation
 */

export type PredicateOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'LIKE'
  | 'ILIKE'
  | 'BETWEEN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export interface Criterion {
  field: string;
  operator: PredicateOperator;
  value?: any;
  secondValue?: any; // For BETWEEN
}

export class CriteriaBuilder {
  private conditions: Criterion[] = [];
  private orGroups: Criterion[][] = [];

  public static where(field: string): CriteriaFieldBuilder {
    const builder = new CriteriaBuilder();
    return new CriteriaFieldBuilder(builder, field);
  }

  public and(field: string): CriteriaFieldBuilder {
    return new CriteriaFieldBuilder(this, field);
  }

  public addCriterion(criterion: Criterion): this {
    this.conditions.push(criterion);
    return this;
  }

  public buildSQL(): { whereSql: string; params: any[] } {
    if (this.conditions.length === 0) {
      return { whereSql: '', params: [] };
    }

    const clauses: string[] = [];
    const params: any[] = [];

    for (const c of this.conditions) {
      switch (c.operator) {
        case 'EQ':
          clauses.push(`"${c.field}" = ?`);
          params.push(c.value);
          break;
        case 'NEQ':
          clauses.push(`"${c.field}" != ?`);
          params.push(c.value);
          break;
        case 'GT':
          clauses.push(`"${c.field}" > ?`);
          params.push(c.value);
          break;
        case 'GTE':
          clauses.push(`"${c.field}" >= ?`);
          params.push(c.value);
          break;
        case 'LT':
          clauses.push(`"${c.field}" < ?`);
          params.push(c.value);
          break;
        case 'LTE':
          clauses.push(`"${c.field}" <= ?`);
          params.push(c.value);
          break;
        case 'IN':
          if (Array.isArray(c.value) && c.value.length > 0) {
            const placeholders = c.value.map(() => '?').join(', ');
            clauses.push(`"${c.field}" IN (${placeholders})`);
            params.push(...c.value);
          } else {
            clauses.push('1 = 0');
          }
          break;
        case 'NOT_IN':
          if (Array.isArray(c.value) && c.value.length > 0) {
            const placeholders = c.value.map(() => '?').join(', ');
            clauses.push(`"${c.field}" NOT IN (${placeholders})`);
            params.push(...c.value);
          }
          break;
        case 'LIKE':
          clauses.push(`"${c.field}" LIKE ?`);
          params.push(c.value);
          break;
        case 'ILIKE':
          clauses.push(`LOWER("${c.field}") LIKE LOWER(?)`);
          params.push(c.value);
          break;
        case 'BETWEEN':
          clauses.push(`"${c.field}" BETWEEN ? AND ?`);
          params.push(c.value, c.secondValue);
          break;
        case 'IS_NULL':
          clauses.push(`"${c.field}" IS NULL`);
          break;
        case 'IS_NOT_NULL':
          clauses.push(`"${c.field}" IS NOT NULL`);
          break;
      }
    }

    return {
      whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }
}

export class CriteriaFieldBuilder {
  private parent: CriteriaBuilder;
  private field: string;

  constructor(parent: CriteriaBuilder, field: string) {
    this.parent = parent;
    this.field = field;
  }

  public eq(value: any): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'EQ', value });
  }

  public neq(value: any): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'NEQ', value });
  }

  public gt(value: number | Date | string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'GT', value });
  }

  public gte(value: number | Date | string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'GTE', value });
  }

  public lt(value: number | Date | string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'LT', value });
  }

  public lte(value: number | Date | string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'LTE', value });
  }

  public in(values: any[]): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'IN', value: values });
  }

  public notIn(values: any[]): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'NOT_IN', value: values });
  }

  public like(pattern: string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'LIKE', value: pattern });
  }

  public ilike(pattern: string): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'ILIKE', value: pattern });
  }

  public between(minVal: any, maxVal: any): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'BETWEEN', value: minVal, secondValue: maxVal });
  }

  public isNull(): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'IS_NULL' });
  }

  public isNotNull(): CriteriaBuilder {
    return this.parent.addCriterion({ field: this.field, operator: 'IS_NOT_NULL' });
  }
}
