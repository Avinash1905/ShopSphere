/**
 * ShopSphere Search Express Router
 * Defines REST endpoints for /api/search.
 */

import { Router } from 'express';
import { searchController } from '../controllers/searchController';

const router = Router();

router.get('/', (req, res) => searchController.getList(req, res));
router.get('/:id', (req, res) => searchController.getById(req, res));
router.post('/', (req, res) => searchController.create(req, res));
router.put('/:id', (req, res) => searchController.update(req, res));
router.delete('/:id', (req, res) => searchController.remove(req, res));

export default router;
