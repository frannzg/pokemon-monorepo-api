import { Router } from 'express';
import {
  getStoredData,
  getStoredDataById,
  createPokemon,
  syncExternalData,
  updatePokemon,
  deleteStoredData,
  deletePokemonById,
} from '../controllers/externalData.controller.js';

const router = Router();

router.get('/', getStoredData);
router.get('/:externalId', getStoredDataById);
router.post('/', createPokemon);
router.post('/sync', syncExternalData);
router.put('/:externalId', updatePokemon);
router.delete('/:externalId', deletePokemonById);
router.delete('/', deleteStoredData);

export default router;
