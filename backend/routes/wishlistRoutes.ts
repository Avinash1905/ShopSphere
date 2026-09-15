/**
 * ShopSphere Wishlist Express Router
 * Defines REST endpoints for /api/wishlist.
 */

import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController';

const router = Router();

router.get('/', (req, res) => wishlistController.getList(req, res));
router.get('/:id', (req, res) => wishlistController.getById(req, res));
router.post('/', (req, res) => wishlistController.create(req, res));
router.put('/:id', (req, res) => wishlistController.update(req, res));
router.delete('/:id', (req, res) => wishlistController.remove(req, res));

export default router;
