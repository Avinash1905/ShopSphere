/**
 * ShopSphere Notifications Express Router
 * Defines REST endpoints for /api/notifications.
 */

import { Router } from 'express';
import { notificationsController } from '../controllers/notificationsController';

const router = Router();

router.get('/', (req, res) => notificationsController.getList(req, res));
router.get('/:id', (req, res) => notificationsController.getById(req, res));
router.post('/', (req, res) => notificationsController.create(req, res));
router.put('/:id', (req, res) => notificationsController.update(req, res));
router.delete('/:id', (req, res) => notificationsController.remove(req, res));

export default router;
