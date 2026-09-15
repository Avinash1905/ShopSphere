/**
 * ShopSphere Categories Express Router
 * Defines REST endpoints for /api/categories.
 */

import { Router } from 'express';
import { categoriesController } from '../controllers/categoriesController';

const router = Router();

router.get('/', (req, res) => categoriesController.getList(req, res));
router.get('/:id', (req, res) => categoriesController.getById(req, res));
router.post('/', (req, res) => categoriesController.create(req, res));
router.put('/:id', (req, res) => categoriesController.update(req, res));
router.delete('/:id', (req, res) => categoriesController.remove(req, res));

export default router;
