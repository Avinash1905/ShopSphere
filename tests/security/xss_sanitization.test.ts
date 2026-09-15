import { describe, it } from '../../systems/testing/test_runner_framework.js';
import { Assert } from '../../systems/testing/assertion_library.js';
import { SecurityFuzzer } from '../../systems/testing/security_fuzzer.js';
import { InputSanitizer } from '../../systems/security/sanitizer.js';

describe('Security: XSS & HTML Sanitization Test', () => {
  it('should neutralize 100% of polyglot XSS test payloads', () => {
    const report = SecurityFuzzer.runXSSFuzzSuite();
    Assert.equal(report.bypassedCount, 0, 'Zero XSS payloads bypassed sanitizer');
    Assert.equal(report.blockedCount, report.totalPayloads, 'All XSS vectors neutralized');
  });

  it('should recursively sanitize deeply nested JSON objects without modifying safe keys', () => {
    const maliciousObject = {
      productTitle: 'Sony Headphones <script>alert(1)</script>',
      attributes: {
        description: '<img src=x onerror=stealCookies()>',
        dimensions: '10x20x30 cm',
      },
      tags: ['audio', '<iframe src="evil.com"></iframe>', 'wireless'],
    };

    const clean = InputSanitizer.sanitizeObject(maliciousObject);
    Assert.isFalse(clean.productTitle.includes('<script>'), 'Title sanitized');
    Assert.isFalse(clean.attributes.description.includes('onerror='), 'Nested description sanitized');
    Assert.equal(clean.attributes.dimensions, '10x20x30 cm', 'Safe values unchanged');
    Assert.isFalse(clean.tags[1].includes('<iframe'), 'Array elements sanitized');
  });
});
