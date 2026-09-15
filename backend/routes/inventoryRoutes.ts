/**
 * ShopSphere Inventory Express Router
 * Defines REST endpoints for /api/inventory.
 */

import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController';

const router = Router();

router.get('/', (req, res) => inventoryController.getList(req, res));
router.get('/:id', (req, res) => inventoryController.getById(req, res));
router.post('/', (req, res) => inventoryController.create(req, res));
router.put('/:id', (req, res) => inventoryController.update(req, res));
router.delete('/:id', (req, res) => inventoryController.remove(req, res));

export default router;
