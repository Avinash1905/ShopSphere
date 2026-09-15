/**
 * ShopSphere Coupons Express Router
 * Defines REST endpoints for /api/coupons.
 */

import { Router } from 'express';
import { couponsController } from '../controllers/couponsController';

const router = Router();

router.get('/', (req, res) => couponsController.getList(req, res));
router.get('/:id', (req, res) => couponsController.getById(req, res));
router.post('/', (req, res) => couponsController.create(req, res));
router.put('/:id', (req, res) => couponsController.update(req, res));
router.delete('/:id', (req, res) => couponsController.remove(req, res));

export default router;
