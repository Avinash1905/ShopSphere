import { TestRunner } from '../systems/testing/test_runner_framework.js';

// Import Integration Tests
import './integration/database_integration.test.js';
import './integration/schema_comparator.test.js';
import './integration/repository_integration.test.js';
import './integration/search_integration.test.js';
import './integration/analytics_integration.test.js';
import './integration/security_integration.test.js';
import './integration/audit_integration.test.js';

// Import E2E Tests
import './e2e/checkout_flow_audit.test.js';
import './e2e/product_lifecycle_search.test.js';
import './e2e/seller_analytics_pipeline.test.js';
import './e2e/security_threat_mitigation.test.js';

// Import Performance Benchmark Tests
import './performance/search_benchmark.test.js';
import './performance/repository_concurrency.test.js';
import './performance/analytics_aggregation_benchmark.test.js';
import './performance/rate_limiter_load.test.js';

// Import Security Penetration Tests
import './security/rbac_permission.test.js';
import './security/sql_injection_defense.test.js';
import './security/xss_sanitization.test.js';
import './security/rate_limiting_defense.test.js';

async function main() {
  try {
    const summary = await TestRunner.runAll();
    console.log(`\n🎉 All ${summary.passed} tests passed successfully!`);
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Test run failed:', err.message);
    process.exit(1);
  }
}

main();
