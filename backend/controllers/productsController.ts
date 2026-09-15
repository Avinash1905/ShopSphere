/**
 * ShopSphere Products REST Controller
 * Handles HTTP requests, input validation, and business logic delegation for /api/products.
 */

import { Request, Response } from 'express';
import { productRepository } from '../../database/repositories/ProductRepository';

export class ProductsController {
  public async getList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const categoryId = req.query.categoryId as string | undefined;

      const filter = categoryId ? { categoryId } : {};
      const result = await productRepository.findMany(filter, page, limit);

      res.json({
        success: true,
        message: 'Successfully retrieved products list.',
        data: result.items,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
          hasPrev: page > 1
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productRepository.findById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found.` }
        });
        return;
      }

      res.json({
        success: true,
        message: `Successfully retrieved product ${id}.`,
        data: product
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const created = await productRepository.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Successfully created product resource.',
        data: created
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await productRepository.update(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found.` }
        });
        return;
      }

      res.json({
        success: true,
        message: `Successfully updated product ${id}.`,
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }
  }

  public async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await productRepository.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found.` }
        });
        return;
      }

      res.json({
        success: true,
        message: `Successfully removed product ${id}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
    }
  }
}

export const productsController = new ProductsController();
