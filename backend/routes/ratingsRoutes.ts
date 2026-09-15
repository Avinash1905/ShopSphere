/**
 * ShopSphere Ratings Express Router
 * Defines REST endpoints for /api/ratings.
 */

import { Router } from 'express';
import { ratingsController } from '../controllers/ratingsController';

const router = Router();

router.get('/', (req, res) => ratingsController.getList(req, res));
router.get('/:id', (req, res) => ratingsController.getById(req, res));
router.post('/', (req, res) => ratingsController.create(req, res));
router.put('/:id', (req, res) => ratingsController.update(req, res));
router.delete('/:id', (req, res) => ratingsController.remove(req, res));

export default router;
