/**
 * ShopSphere Auth Express Router
 * Defines REST endpoints for /api/auth.
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.get('/', (req, res) => authController.getList(req, res));
router.get('/:id', (req, res) => authController.getById(req, res));
router.post('/', (req, res) => authController.create(req, res));
router.put('/:id', (req, res) => authController.update(req, res));
router.delete('/:id', (req, res) => authController.remove(req, res));

export default router;
