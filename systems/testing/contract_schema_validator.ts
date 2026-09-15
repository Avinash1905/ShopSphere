export type ContractFieldType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT' | 'UUID' | 'EMAIL' | 'ISO_DATE';

export interface FieldContractRule {
  fieldName: string;
  type: ContractFieldType;
  required: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface ContractSchemaDefinition {
  contractName: string;
  version: string;
  fields: FieldContractRule[];
}

export interface ContractValidationResult {
  isValid: boolean;
  contractName: string;
  errors: string[];
}

export class ContractSchemaValidator {
  /**
   * Validates an arbitrary payload against a strict Contract Schema definition
   */
  public static validate(schema: ContractSchemaDefinition, payload: Record<string, any>): ContractValidationResult {
    const errors: string[] = [];

    for (const rule of schema.fields) {
      const val = payload[rule.fieldName];

      if (val === undefined || val === null) {
        if (rule.required) {
          errors.push(`Missing required field '${rule.fieldName}'`);
        }
        continue;
      }

      // Type checks
      if (rule.type === 'STRING' && typeof val !== 'string') {
        errors.push(`Field '${rule.fieldName}' must be a string (got ${typeof val})`);
      } else if (rule.type === 'NUMBER' && (typeof val !== 'number' || isNaN(val))) {
        errors.push(`Field '${rule.fieldName}' must be a number`);
      } else if (rule.type === 'BOOLEAN' && typeof val !== 'boolean') {
        errors.push(`Field '${rule.fieldName}' must be a boolean`);
      } else if (rule.type === 'ARRAY' && !Array.isArray(val)) {
        errors.push(`Field '${rule.fieldName}' must be an array`);
      } else if (rule.type === 'UUID') {
        if (typeof val !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
          errors.push(`Field '${rule.fieldName}' is not a valid UUID string`);
        }
      } else if (rule.type === 'EMAIL') {
        if (typeof val !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors.push(`Field '${rule.fieldName}' is not a valid email address`);
        }
      } else if (rule.type === 'ISO_DATE') {
        if (typeof val !== 'string' || isNaN(Date.parse(val))) {
          errors.push(`Field '${rule.fieldName}' is not a valid ISO date timestamp`);
        }
      }

      // Range & Length bounds
      if (typeof val === 'string') {
        if (rule.min !== undefined && val.length < rule.min) {
          errors.push(`Field '${rule.fieldName}' length ${val.length} is below min ${rule.min}`);
        }
        if (rule.max !== undefined && val.length > rule.max) {
          errors.push(`Field '${rule.fieldName}' length ${val.length} exceeds max ${rule.max}`);
        }
        if (rule.pattern && !rule.pattern.test(val)) {
          errors.push(`Field '${rule.fieldName}' does not match required regex pattern`);
        }
      } else if (typeof val === 'number') {
        if (rule.min !== undefined && val < rule.min) {
          errors.push(`Field '${rule.fieldName}' value ${val} is below min ${rule.min}`);
        }
        if (rule.max !== undefined && val > rule.max) {
          errors.push(`Field '${rule.fieldName}' value ${val} exceeds max ${rule.max}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      contractName: schema.contractName,
      errors,
    };
  }
}
