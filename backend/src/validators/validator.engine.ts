/**
 * Pure TypeScript Schema Validation Engine
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export interface ValidationIssue {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export interface ValidationEngineResult<T> {
  isValid: boolean;
  data: T;
  errors: ValidationIssue[];
}

export abstract class BaseSchema<T = unknown> {
  protected isRequired = false;
  protected isNullable = false;
  protected customValidators: Array<(val: T) => string | null> = [];
  protected defaultValue?: T;

  public required(message = 'Field is required'): this {
    this.isRequired = true;
    return this;
  }

  public optional(): this {
    this.isRequired = false;
    return this;
  }

  public nullable(): this {
    this.isNullable = true;
    return this;
  }

  public default(val: T): this {
    this.defaultValue = val;
    return this;
  }

  public custom(validator: (val: T) => string | null): this {
    this.customValidators.push(validator);
    return this;
  }

  public abstract validate(value: unknown, path?: string): { value: T; errors: ValidationIssue[] };
}

export class StringSchema extends BaseSchema<string> {
  private minLengthVal?: number;
  private maxLengthVal?: number;
  private patternVal?: RegExp;
  private patternMessage?: string;
  private isEmailVal = false;
  private isUuidVal = false;
  private allowedValues?: string[];
  private shouldTrim = true;
  private shouldLowercase = false;

  public min(len: number, message?: string): this {
    this.minLengthVal = len;
    return this;
  }

  public max(len: number, message?: string): this {
    this.maxLengthVal = len;
    return this;
  }

  public matches(regex: RegExp, message = 'Invalid format'): this {
    this.patternVal = regex;
    this.patternMessage = message;
    return this;
  }

  public email(message = 'Must be a valid email address'): this {
    this.isEmailVal = true;
    return this;
  }

  public uuid(message = 'Must be a valid UUID'): this {
    this.isUuidVal = true;
    return this;
  }

  public oneOf(values: string[], message?: string): this {
    this.allowedValues = values;
    return this;
  }

  public trim(enabled = true): this {
    this.shouldTrim = enabled;
    return this;
  }

  public lowercase(enabled = true): this {
    this.shouldLowercase = enabled;
    return this;
  }

  public validate(value: unknown, path = ''): { value: string; errors: ValidationIssue[] } {
    const errors: ValidationIssue[] = [];

    if (value === undefined || value === null || value === '') {
      if (this.defaultValue !== undefined) {
        return { value: this.defaultValue, errors: [] };
      }
      if (this.isRequired) {
        errors.push({ field: path, message: `${path || 'Field'} is required`, code: 'REQUIRED', received: value });
      }
      return { value: (value ?? '') as string, errors };
    }

    if (typeof value !== 'string') {
      errors.push({ field: path, message: `${path || 'Field'} must be a string`, code: 'INVALID_TYPE', received: typeof value });
      return { value: String(value), errors };
    }

    let processed = value;
    if (this.shouldTrim) processed = processed.trim();
    if (this.shouldLowercase) processed = processed.toLowerCase();

    if (this.minLengthVal !== undefined && processed.length < this.minLengthVal) {
      errors.push({
        field: path,
        message: `${path || 'Field'} must be at least ${this.minLengthVal} characters long`,
        code: 'MIN_LENGTH',
        received: processed.length,
      });
    }

    if (this.maxLengthVal !== undefined && processed.length > this.maxLengthVal) {
      errors.push({
        field: path,
        message: `${path || 'Field'} cannot exceed ${this.maxLengthVal} characters`,
        code: 'MAX_LENGTH',
        received: processed.length,
      });
    }

    if (this.isEmailVal) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(processed)) {
        errors.push({ field: path, message: `${path || 'Field'} must be a valid email address`, code: 'INVALID_EMAIL', received: processed });
      }
    }

    if (this.isUuidVal) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(processed)) {
        errors.push({ field: path, message: `${path || 'Field'} must be a valid UUID`, code: 'INVALID_UUID', received: processed });
      }
    }

    if (this.allowedValues && !this.allowedValues.includes(processed)) {
      errors.push({
        field: path,
        message: `${path || 'Field'} must be one of: ${this.allowedValues.join(', ')}`,
        code: 'INVALID_CHOICE',
        received: processed,
      });
    }

    if (this.patternVal && !this.patternVal.test(processed)) {
      errors.push({
        field: path,
        message: this.patternMessage || `${path || 'Field'} format is invalid`,
        code: 'PATTERN_MISMATCH',
        received: processed,
      });
    }

    for (const customFn of this.customValidators) {
      const customErr = customFn(processed);
      if (customErr) {
        errors.push({ field: path, message: customErr, code: 'CUSTOM_VALIDATION_FAILED', received: processed });
      }
    }

    return { value: processed, errors };
  }
}

export class NumberSchema extends BaseSchema<number> {
  private minVal?: number;
  private maxVal?: number;
  private isIntVal = false;
  private isPositiveVal = false;

  public min(val: number): this {
    this.minVal = val;
    return this;
  }

  public max(val: number): this {
    this.maxVal = val;
    return this;
  }

  public integer(): this {
    this.isIntVal = true;
    return this;
  }

  public positive(): this {
    this.isPositiveVal = true;
    return this;
  }

  public validate(value: unknown, path = ''): { value: number; errors: ValidationIssue[] } {
    const errors: ValidationIssue[] = [];

    if (value === undefined || value === null || value === '') {
      if (this.defaultValue !== undefined) {
        return { value: this.defaultValue, errors: [] };
      }
      if (this.isRequired) {
        errors.push({ field: path, message: `${path || 'Field'} is required`, code: 'REQUIRED', received: value });
      }
      return { value: 0, errors };
    }

    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num)) {
      errors.push({ field: path, message: `${path || 'Field'} must be a valid number`, code: 'INVALID_NUMBER', received: value });
      return { value: 0, errors };
    }

    if (this.isIntVal && !Number.isInteger(num)) {
      errors.push({ field: path, message: `${path || 'Field'} must be an integer`, code: 'NOT_AN_INTEGER', received: num });
    }

    if (this.isPositiveVal && num <= 0) {
      errors.push({ field: path, message: `${path || 'Field'} must be greater than 0`, code: 'NOT_POSITIVE', received: num });
    }

    if (this.minVal !== undefined && num < this.minVal) {
      errors.push({ field: path, message: `${path || 'Field'} must be at least ${this.minVal}`, code: 'MIN_VALUE', received: num });
    }

    if (this.maxVal !== undefined && num > this.maxVal) {
      errors.push({ field: path, message: `${path || 'Field'} cannot exceed ${this.maxVal}`, code: 'MAX_VALUE', received: num });
    }

    return { value: num, errors };
  }
}

export class BooleanSchema extends BaseSchema<boolean> {
  public validate(value: unknown, path = ''): { value: boolean; errors: ValidationIssue[] } {
    const errors: ValidationIssue[] = [];

    if (value === undefined || value === null) {
      if (this.defaultValue !== undefined) {
        return { value: this.defaultValue, errors: [] };
      }
      if (this.isRequired) {
        errors.push({ field: path, message: `${path || 'Field'} is required`, code: 'REQUIRED', received: value });
      }
      return { value: false, errors };
    }

    if (typeof value === 'boolean') {
      return { value, errors: [] };
    }

    if (value === 'true' || value === 1 || value === '1') {
      return { value: true, errors: [] };
    }

    if (value === 'false' || value === 0 || value === '0') {
      return { value: false, errors: [] };
    }

    errors.push({ field: path, message: `${path || 'Field'} must be a boolean`, code: 'INVALID_BOOLEAN', received: value });
    return { value: false, errors };
  }
}

export class ArraySchema<T> extends BaseSchema<T[]> {
  private itemSchema: BaseSchema<T>;
  private minItemsVal?: number;
  private maxItemsVal?: number;

  constructor(itemSchema: BaseSchema<T>) {
    super();
    this.itemSchema = itemSchema;
  }

  public min(count: number): this {
    this.minItemsVal = count;
    return this;
  }

  public max(count: number): this {
    this.maxItemsVal = count;
    return this;
  }

  public validate(value: unknown, path = ''): { value: T[]; errors: ValidationIssue[] } {
    const errors: ValidationIssue[] = [];

    if (!Array.isArray(value)) {
      if (this.isRequired) {
        errors.push({ field: path, message: `${path || 'Field'} must be an array`, code: 'INVALID_ARRAY', received: typeof value });
      }
      return { value: this.defaultValue || [], errors };
    }

    if (this.minItemsVal !== undefined && value.length < this.minItemsVal) {
      errors.push({
        field: path,
        message: `${path || 'Array'} must contain at least ${this.minItemsVal} items`,
        code: 'MIN_ITEMS',
        received: value.length,
      });
    }

    if (this.maxItemsVal !== undefined && value.length > this.maxItemsVal) {
      errors.push({
        field: path,
        message: `${path || 'Array'} cannot contain more than ${this.maxItemsVal} items`,
        code: 'MAX_ITEMS',
        received: value.length,
      });
    }

    const validatedItems: T[] = [];
    for (let i = 0; i < value.length; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      const result = this.itemSchema.validate(value[i], itemPath);
      validatedItems.push(result.value);
      errors.push(...result.errors);
    }

    return { value: validatedItems, errors };
  }
}

export class ObjectSchema<T extends Record<string, any>> extends BaseSchema<T> {
  private shape: { [K in keyof T]: BaseSchema<T[K]> };
  private allowUnknown = false;

  constructor(shape: { [K in keyof T]: BaseSchema<T[K]> }) {
    super();
    this.shape = shape;
  }

  public passthrough(): this {
    this.allowUnknown = true;
    return this;
  }

  public validate(value: unknown, path = ''): { value: T; errors: ValidationIssue[] } {
    const errors: ValidationIssue[] = [];

    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      if (this.isRequired) {
        errors.push({ field: path, message: `${path || 'Object'} is required and must be an object`, code: 'INVALID_OBJECT', received: typeof value });
      }
      return { value: {} as T, errors };
    }

    const inputObj = value as Record<string, unknown>;
    const validatedResult: Record<string, unknown> = {};

    for (const [key, schema] of Object.entries(this.shape as Record<string, BaseSchema>)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const res = schema.validate(inputObj[key], fieldPath);
      validatedResult[key] = res.value;
      errors.push(...res.errors);
    }

    if (this.allowUnknown) {
      for (const [key, val] of Object.entries(inputObj)) {
        if (!(key in this.shape)) {
          validatedResult[key] = val;
        }
      }
    }

    for (const customFn of this.customValidators) {
      const customErr = customFn(validatedResult as T);
      if (customErr) {
        errors.push({ field: path, message: customErr, code: 'CUSTOM_OBJECT_VALIDATION_FAILED' });
      }
    }

    return { value: validatedResult as T, errors };
  }

  public parse(value: unknown): ValidationEngineResult<T> {
    const res = this.validate(value);
    return {
      isValid: res.errors.length === 0,
      data: res.value,
      errors: res.errors,
    };
  }
}

export const v = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  array: <T>(itemSchema: BaseSchema<T>) => new ArraySchema<T>(itemSchema),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: BaseSchema<T[K]> }) => new ObjectSchema<T>(shape),
};
