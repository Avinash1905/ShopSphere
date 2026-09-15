/**
 * ShopSphere Sellers Express Router
 * Defines REST endpoints for /api/sellers.
 */

import { Router } from 'express';
import { sellersController } from '../controllers/sellersController';

const router = Router();

router.get('/', (req, res) => sellersController.getList(req, res));
router.get('/:id', (req, res) => sellersController.getById(req, res));
router.post('/', (req, res) => sellersController.create(req, res));
router.put('/:id', (req, res) => sellersController.update(req, res));
router.delete('/:id', (req, res) => sellersController.remove(req, res));

export default router;
