/**
 * ShopSphere Reviews Express Router
 * Defines REST endpoints for /api/reviews.
 */

import { Router } from 'express';
import { reviewsController } from '../controllers/reviewsController';

const router = Router();

router.get('/', (req, res) => reviewsController.getList(req, res));
router.get('/:id', (req, res) => reviewsController.getById(req, res));
router.post('/', (req, res) => reviewsController.create(req, res));
router.put('/:id', (req, res) => reviewsController.update(req, res));
router.delete('/:id', (req, res) => reviewsController.remove(req, res));

export default router;
