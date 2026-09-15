/**
 * ShopSphere Payments Express Router
 * Defines REST endpoints for /api/payments.
 */

import { Router } from 'express';
import { paymentsController } from '../controllers/paymentsController';

const router = Router();

router.get('/', (req, res) => paymentsController.getList(req, res));
router.get('/:id', (req, res) => paymentsController.getById(req, res));
router.post('/', (req, res) => paymentsController.create(req, res));
router.put('/:id', (req, res) => paymentsController.update(req, res));
router.delete('/:id', (req, res) => paymentsController.remove(req, res));

export default router;
