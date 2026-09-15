/**
 * ShopSphere Analytics Express Router
 * Defines REST endpoints for /api/analytics.
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

router.get('/', (req, res) => analyticsController.getList(req, res));
router.get('/:id', (req, res) => analyticsController.getById(req, res));
router.post('/', (req, res) => analyticsController.create(req, res));
router.put('/:id', (req, res) => analyticsController.update(req, res));
router.delete('/:id', (req, res) => analyticsController.remove(req, res));

export default router;
