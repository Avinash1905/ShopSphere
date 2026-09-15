/**
 * ShopSphere Checkout Express Router
 * Defines REST endpoints for /api/checkout.
 */

import { Router } from 'express';
import { checkoutController } from '../controllers/checkoutController';

const router = Router();

router.get('/', (req, res) => checkoutController.getList(req, res));
router.get('/:id', (req, res) => checkoutController.getById(req, res));
router.post('/', (req, res) => checkoutController.create(req, res));
router.put('/:id', (req, res) => checkoutController.update(req, res));
router.delete('/:id', (req, res) => checkoutController.remove(req, res));

export default router;
