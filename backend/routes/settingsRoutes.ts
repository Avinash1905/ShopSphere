/**
 * ShopSphere Settings Express Router
 * Defines REST endpoints for /api/settings.
 */

import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';

const router = Router();

router.get('/', (req, res) => settingsController.getList(req, res));
router.get('/:id', (req, res) => settingsController.getById(req, res));
router.post('/', (req, res) => settingsController.create(req, res));
router.put('/:id', (req, res) => settingsController.update(req, res));
router.delete('/:id', (req, res) => settingsController.remove(req, res));

export default router;
