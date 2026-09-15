import { QueryBuilder } from './query_builder.js';
import { MigrationDatabaseAdapter } from '../migrations/runner.js';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  path: string;
  productCount: number;
  children: CategoryNode[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export class HierarchicalCategoryQueryEngine {
  private db: MigrationDatabaseAdapter;

  constructor(db: MigrationDatabaseAdapter) {
    this.db = db;
  }

  /**
   * Generates a recursive CTE query string to fetch all descendants of a given category or root
   */
  public buildRecursiveSubtreeQuery(rootCategoryId?: string): { sql: string; params: any[] } {
    const isRoot = !rootCategoryId;
    const initialWhere = isRoot ? 'parent_id IS NULL' : 'id = ?';
    const params = isRoot ? [] : [rootCategoryId];

    const sql = `
WITH RECURSIVE category_tree AS (
  SELECT 
    id, 
    name, 
    slug, 
    parent_id, 
    1 AS depth, 
    CAST(name AS CHAR(1000)) AS full_path
  FROM categories
  WHERE ${initialWhere}
  
  UNION ALL
  
  SELECT 
    c.id, 
    c.name, 
    c.slug, 
    c.parent_id, 
    ct.depth + 1 AS depth,
    CONCAT(ct.full_path, ' > ', c.name) AS full_path
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY depth ASC, name ASC;
    `.trim();

    return { sql, params };
  }

  /**
   * Builds the complete nested category hierarchy tree with product counts
   */
  public async getCategoryHierarchyTree(rootId?: string): Promise<CategoryNode[]> {
    // 1. Fetch categories
    const { sql, params } = QueryBuilder.select('id', 'name', 'slug', 'parent_id')
      .from('categories')
      .orderBy('name', 'ASC')
      .toSQL();

    const categoryRows = await this.db.query<any>(sql, params);

    // 2. Fetch product counts per category
    const countQb = QueryBuilder.select('category_id', 'COUNT(id) AS count')
      .from('products')
      .where("status = 'PUBLISHED'")
      .groupBy('category_id');

    const countSQL = countQb.toSQL();
    const countRows = await this.db.query<{ category_id: string; count: number }>(countSQL.sql, countSQL.params);
    const countMap = new Map<string, number>();
    for (const cr of countRows) {
      countMap.set(cr.category_id, Number(cr.count || 0));
    }

    // 3. Build node lookup map
    const nodeMap = new Map<string, CategoryNode>();
    for (const cat of categoryRows) {
      nodeMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parent_id,
        level: 1,
        path: cat.name,
        productCount: countMap.get(cat.id) || 0,
        children: [],
      });
    }

    // 4. Assemble tree
    const rootNodes: CategoryNode[] = [];

    for (const node of nodeMap.values()) {
      if (!node.parentId || (rootId && node.id === rootId)) {
        rootNodes.push(node);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          node.level = parent.level + 1;
          node.path = `${parent.path} > ${node.name}`;
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    }

    // Roll up product counts to parent nodes
    const rollupCounts = (n: CategoryNode): number => {
      let total = n.productCount;
      for (const child of n.children) {
        total += rollupCounts(child);
      }
      n.productCount = total;
      return total;
    };

    for (const root of rootNodes) {
      rollupCounts(root);
    }

    if (rootId) {
      return rootNodes.filter((n) => n.id === rootId);
    }

    return rootNodes;
  }

  /**
   * Generates breadcrumb navigation trail for a leaf category up to the root
   */
  public async getBreadcrumbs(categoryId: string): Promise<BreadcrumbItem[]> {
    const { sql, params } = QueryBuilder.select('id', 'name', 'slug', 'parent_id')
      .from('categories')
      .toSQL();

    const rows = await this.db.query<any>(sql, params);
    const catMap = new Map<string, any>();
    for (const r of rows) {
      catMap.set(r.id, r);
    }

    const trail: BreadcrumbItem[] = [];
    let currentId: string | null = categoryId;
    const visited = new Set<string>();

    while (currentId && catMap.has(currentId)) {
      if (visited.has(currentId)) {
        // Break infinite loop if cycle exists
        break;
      }
      visited.add(currentId);
      const cat = catMap.get(currentId);
      trail.unshift({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: 1, // Will adjust next
      });
      currentId = cat.parent_id;
    }

    // Adjust level index
    trail.forEach((item, index) => {
      item.level = index + 1;
    });

    return trail;
  }

  /**
   * Validates if moving categoryId under newParentId would produce a circular graph dependency
   */
  public async validateHierarchyCycle(categoryId: string, newParentId: string | null): Promise<boolean> {
    if (!newParentId) return true; // Moving to root is always safe
    if (categoryId === newParentId) return false; // Cannot be its own parent

    const { sql, params } = QueryBuilder.select('id', 'parent_id')
      .from('categories')
      .toSQL();

    const rows = await this.db.query<any>(sql, params);
    const parentMap = new Map<string, string | null>();
    for (const r of rows) {
      parentMap.set(r.id, r.parent_id);
    }

    let cursor: string | null | undefined = newParentId;
    while (cursor) {
      if (cursor === categoryId) {
        return false; // Cycle detected!
      }
      cursor = parentMap.get(cursor);
    }

    return true; // Safe
  }
}
