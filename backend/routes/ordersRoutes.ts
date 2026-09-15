/**
 * ShopSphere Orders Express Router
 * Defines REST endpoints for /api/orders.
 */

import { Router } from 'express';
import { ordersController } from '../controllers/ordersController';

const router = Router();

router.get('/', (req, res) => ordersController.getList(req, res));
router.get('/:id', (req, res) => ordersController.getById(req, res));
router.post('/', (req, res) => ordersController.create(req, res));
router.put('/:id', (req, res) => ordersController.update(req, res));
router.delete('/:id', (req, res) => ordersController.remove(req, res));

export default router;
