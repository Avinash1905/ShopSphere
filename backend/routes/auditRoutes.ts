/**
 * ShopSphere Audit Express Router
 * Defines REST endpoints for /api/audit.
 */

import { Router } from 'express';
import { auditController } from '../controllers/auditController';

const router = Router();

router.get('/', (req, res) => auditController.getList(req, res));
router.get('/:id', (req, res) => auditController.getById(req, res));
router.post('/', (req, res) => auditController.create(req, res));
router.put('/:id', (req, res) => auditController.update(req, res));
router.delete('/:id', (req, res) => auditController.remove(req, res));

export default router;
