import { Router } from 'express';
import {
  getStoredData,
  getStoredDataById,
  syncExternalData,
  deleteStoredData,
} from '../controllers/externalData.controller.js';

const router = Router();

router.get('/', getStoredData);
router.get('/:externalId', getStoredDataById);
router.post('/sync', syncExternalData);
router.delete('/', deleteStoredData);

export default router;
