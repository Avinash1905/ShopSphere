/**
 * ShopSphere Products Express Router
 * Defines REST endpoints for /api/products.
 */

import { Router } from 'express';
import { productsController } from '../controllers/productsController';

const router = Router();

router.get('/', (req, res) => productsController.getList(req, res));
router.get('/:id', (req, res) => productsController.getById(req, res));
router.post('/', (req, res) => productsController.create(req, res));
router.put('/:id', (req, res) => productsController.update(req, res));
router.delete('/:id', (req, res) => productsController.remove(req, res));

export default router;
