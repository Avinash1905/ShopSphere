/**
 * ShopSphere Brands Express Router
 * Defines REST endpoints for /api/brands.
 */

import { Router } from 'express';
import { brandsController } from '../controllers/brandsController';

const router = Router();

router.get('/', (req, res) => brandsController.getList(req, res));
router.get('/:id', (req, res) => brandsController.getById(req, res));
router.post('/', (req, res) => brandsController.create(req, res));
router.put('/:id', (req, res) => brandsController.update(req, res));
router.delete('/:id', (req, res) => brandsController.remove(req, res));

export default router;
