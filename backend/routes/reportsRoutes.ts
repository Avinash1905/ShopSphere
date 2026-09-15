/**
 * ShopSphere Reports Express Router
 * Defines REST endpoints for /api/reports.
 */

import { Router } from 'express';
import { reportsController } from '../controllers/reportsController';

const router = Router();

router.get('/', (req, res) => reportsController.getList(req, res));
router.get('/:id', (req, res) => reportsController.getById(req, res));
router.post('/', (req, res) => reportsController.create(req, res));
router.put('/:id', (req, res) => reportsController.update(req, res));
router.delete('/:id', (req, res) => reportsController.remove(req, res));

export default router;
