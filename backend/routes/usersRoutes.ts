/**
 * ShopSphere Users Express Router
 * Defines REST endpoints for /api/users.
 */

import { Router } from 'express';
import { usersController } from '../controllers/usersController';

const router = Router();

router.get('/', (req, res) => usersController.getList(req, res));
router.get('/:id', (req, res) => usersController.getById(req, res));
router.post('/', (req, res) => usersController.create(req, res));
router.put('/:id', (req, res) => usersController.update(req, res));
router.delete('/:id', (req, res) => usersController.remove(req, res));

export default router;
