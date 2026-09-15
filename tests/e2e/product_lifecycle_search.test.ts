import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { FixturesLoader } from '../../systems/testing/fixtures_loader.js';
import { SearchPipeline } from '../../systems/search/search_pipeline.js';
import { ProductFactory } from '../../systems/testing/test_factories.js';
import { AuditAction } from '../../systems/audit/audit_types.js';

describe('E2E: Product Lifecycle & Search Pipeline Test', () => {
  it('should create product, index in search engine, perform queries, update price, and maintain audit trail', async () => {
    const { uow } = await FixturesLoader.setupTestDatabase();
    const searchPipeline = new SearchPipeline();

    // 1. Seller creates new Product
    const newProduct = ProductFactory.create({
      id: 'prod-lifecycle-01',
      title: 'Dyson V15 Detect Cordless Vacuum Cleaner',
      slug: 'dyson-v15-detect-cordless-vacuum',
      description: 'Laser reveals invisible dust with intelligent suction power optimization and LCD screen.',
      base_price: 749.99,
      tags: ['dyson', 'vacuum', 'cleaning', 'cordless', 'home'],
      attributes: { base_price: 749.99, rating_average: 4.88, total_sales_count: 50, in_stock: true },
    });
    await uow.products.create(newProduct);

    // 2. Index into Search Engine
    searchPipeline.indexProduct({
      id: newProduct.id,
      title: newProduct.title,
      description: newProduct.description,
      brandName: 'Dyson',
      categoryName: 'Home & Kitchen',
      tags: newProduct.tags,
      attributes: newProduct.attributes,
    });

    // 3. Customer searches for "Dyson Cordless Vacuum"
    const searchResult = searchPipeline.execute({ query: 'Dyson Cordless Vacuum' });
    Assert.greaterThan(searchResult.total, 0, 'Found newly indexed product');
    Assert.equal(searchResult.items[0].docId, newProduct.id, 'Dyson V15 ranked top');

    // 4. Update product price & record audit diff
    const oldPrice = newProduct.base_price;
    const newPrice = 699.99;
    await uow.products.update(newProduct.id, { base_price: newPrice });

    await uow.auditLogs.recordEvent({
      id: 'aud-prod-lifecycle-update',
      actor_id: 'seller-apple',
      actor_type: 'USER',
      action: AuditAction.PRODUCT_UPDATED,
      entity_name: 'products',
      entity_id: newProduct.id,
      old_values: { base_price: oldPrice },
      new_values: { base_price: newPrice },
      changed_fields: ['base_price'],
      status: 'SUCCESS',
      severity: 'INFO',
    });

    // Verify audit record
    const history = await uow.auditLogs.getEntityHistory('products', newProduct.id);
    Assert.greaterThan(history.length, 0, 'Price change recorded in audit log');
    Assert.equal(history[0].new_values!.base_price, newPrice, 'New price verified in audit log');
  });
});
