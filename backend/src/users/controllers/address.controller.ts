/**
 * User Address Management HTTP Controller
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { Request, Response, NextFunction } from 'express';
import { AddressService, userServices } from '../services';
import { ResponseBuilder } from '../../core/response/ApiResponse';
import { AuthenticationError } from '../../core/errors/DomainErrors';
import { PaginationHelper } from '../../core/response/PaginationMeta';

export class AddressController {
  private readonly addressService: AddressService;

  constructor(addressService: AddressService = userServices.addressService) {
    this.addressService = addressService;
  }

  /**
   * POST /api/v1/users/me/addresses
   */
  public createAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const address = await this.addressService.createAddress(req.user.id, req.body);
      ResponseBuilder.created(res, address, 'Address created successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/me/addresses
   */
  public getUserAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const type = req.query.addressType as any;

      const { addresses, total } = await this.addressService.getUserAddresses(req.user.id, page, limit, type);
      const paginationMeta = PaginationHelper.buildMeta(total, page, limit);

      ResponseBuilder.paginated(res, addresses, paginationMeta);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/users/me/addresses/:id
   */
  public getAddressById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const address = await this.addressService.getAddressById(req.params.id, req.user.id);
      ResponseBuilder.success(res, address);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me/addresses/:id
   */
  public updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const updated = await this.addressService.updateAddress(req.params.id, req.user.id, req.body);
      ResponseBuilder.success(res, updated, 'Address updated successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/users/me/addresses/:id
   */
  public deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      await this.addressService.deleteAddress(req.params.id, req.user.id);
      ResponseBuilder.success(res, { deleted: true }, 'Address deleted successfully');
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me/addresses/:id/default-shipping
   */
  public setDefaultShipping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      await this.addressService.setDefaultAddress(req.params.id, req.user.id, 'shipping');
      ResponseBuilder.success(res, { defaultShipping: true }, 'Default shipping address updated');
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/users/me/addresses/:id/default-billing
   */
  public setDefaultBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      await this.addressService.setDefaultAddress(req.params.id, req.user.id, 'billing');
      ResponseBuilder.success(res, { defaultBilling: true }, 'Default billing address updated');
    } catch (err) {
      next(err);
    }
  };
}

export const addressController = new AddressController();
