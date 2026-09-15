/**
 * ShopSphere Admin Express Router
 * Defines REST endpoints for /api/admin.
 */

import { Router } from 'express';
import { adminController } from '../controllers/adminController';

const router = Router();

router.get('/', (req, res) => adminController.getList(req, res));
router.get('/:id', (req, res) => adminController.getById(req, res));
router.post('/', (req, res) => adminController.create(req, res));
router.put('/:id', (req, res) => adminController.update(req, res));
router.delete('/:id', (req, res) => adminController.remove(req, res));

export default router;
