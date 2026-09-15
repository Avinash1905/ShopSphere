/**
 * ShopSphere Cart Express Router
 * Defines REST endpoints for /api/cart.
 */

import { Router } from 'express';
import { cartController } from '../controllers/cartController';

const router = Router();

router.get('/', (req, res) => cartController.getList(req, res));
router.get('/:id', (req, res) => cartController.getById(req, res));
router.post('/', (req, res) => cartController.create(req, res));
router.put('/:id', (req, res) => cartController.update(req, res));
router.delete('/:id', (req, res) => cartController.remove(req, res));

export default router;
