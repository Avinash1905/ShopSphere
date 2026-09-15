/**
 * Request Validation Middleware Factory
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from '../validators/validator.engine';
import { ValidationError, FieldValidationError } from '../core/errors/DomainErrors';

export interface ValidationTargetSchemas {
  body?: ObjectSchema<any>;
  query?: ObjectSchema<any>;
  params?: ObjectSchema<any>;
}

export function validate(schemaOrTargets: ObjectSchema<any> | ValidationTargetSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: FieldValidationError[] = [];

    if ('body' in schemaOrTargets || 'query' in schemaOrTargets || 'params' in schemaOrTargets) {
      const targets = schemaOrTargets as ValidationTargetSchemas;

      if (targets.body) {
        const bodyRes = targets.body.validate(req.body);
        if (bodyRes.errors.length > 0) {
          allErrors.push(...bodyRes.errors);
        } else {
          req.body = bodyRes.value;
        }
      }

      if (targets.query) {
        const queryRes = targets.query.validate(req.query);
        if (queryRes.errors.length > 0) {
          allErrors.push(...queryRes.errors);
        } else {
          req.query = queryRes.value;
        }
      }

      if (targets.params) {
        const paramsRes = targets.params.validate(req.params);
        if (paramsRes.errors.length > 0) {
          allErrors.push(...paramsRes.errors);
        } else {
          req.params = paramsRes.value;
        }
      }
    } else {
      // Direct body schema
      const bodySchema = schemaOrTargets as ObjectSchema<any>;
      const bodyRes = bodySchema.validate(req.body);
      if (bodyRes.errors.length > 0) {
        allErrors.push(...bodyRes.errors);
      } else {
        req.body = bodyRes.value;
      }
    }

    if (allErrors.length > 0) {
      throw new ValidationError('Request validation failed', allErrors);
    }

    next();
  };
}
