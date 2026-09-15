/**
 * ShopSphere Returns Express Router
 * Defines REST endpoints for /api/returns.
 */

import { Router } from 'express';
import { returnsController } from '../controllers/returnsController';

const router = Router();

router.get('/', (req, res) => returnsController.getList(req, res));
router.get('/:id', (req, res) => returnsController.getById(req, res));
router.post('/', (req, res) => returnsController.create(req, res));
router.put('/:id', (req, res) => returnsController.update(req, res));
router.delete('/:id', (req, res) => returnsController.remove(req, res));

export default router;
