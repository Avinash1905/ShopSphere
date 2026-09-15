/**
 * ShopSphere Refunds Express Router
 * Defines REST endpoints for /api/refunds.
 */

import { Router } from 'express';
import { refundsController } from '../controllers/refundsController';

const router = Router();

router.get('/', (req, res) => refundsController.getList(req, res));
router.get('/:id', (req, res) => refundsController.getById(req, res));
router.post('/', (req, res) => refundsController.create(req, res));
router.put('/:id', (req, res) => refundsController.update(req, res));
router.delete('/:id', (req, res) => refundsController.remove(req, res));

export default router;
