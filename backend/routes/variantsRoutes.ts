/**
 * ShopSphere Variants Express Router
 * Defines REST endpoints for /api/variants.
 */

import { Router } from 'express';
import { variantsController } from '../controllers/variantsController';

const router = Router();

router.get('/', (req, res) => variantsController.getList(req, res));
router.get('/:id', (req, res) => variantsController.getById(req, res));
router.post('/', (req, res) => variantsController.create(req, res));
router.put('/:id', (req, res) => variantsController.update(req, res));
router.delete('/:id', (req, res) => variantsController.remove(req, res));

export default router;
