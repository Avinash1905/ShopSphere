/**
 * ShopSphere Customers Express Router
 * Defines REST endpoints for /api/customers.
 */

import { Router } from 'express';
import { customersController } from '../controllers/customersController';

const router = Router();

router.get('/', (req, res) => customersController.getList(req, res));
router.get('/:id', (req, res) => customersController.getById(req, res));
router.post('/', (req, res) => customersController.create(req, res));
router.put('/:id', (req, res) => customersController.update(req, res));
router.delete('/:id', (req, res) => customersController.remove(req, res));

export default router;
