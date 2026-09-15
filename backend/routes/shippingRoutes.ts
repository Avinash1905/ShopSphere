/**
 * ShopSphere Shipping Express Router
 * Defines REST endpoints for /api/shipping.
 */

import { Router } from 'express';
import { shippingController } from '../controllers/shippingController';

const router = Router();

router.get('/', (req, res) => shippingController.getList(req, res));
router.get('/:id', (req, res) => shippingController.getById(req, res));
router.post('/', (req, res) => shippingController.create(req, res));
router.put('/:id', (req, res) => shippingController.update(req, res));
router.delete('/:id', (req, res) => shippingController.remove(req, res));

export default router;
