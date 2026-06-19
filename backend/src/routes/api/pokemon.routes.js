import { Router } from 'express';
import {
  getStoredData,
  getStoredDataById,
  createPokemon,
  syncExternalData,
  updatePokemon,
  deleteStoredData,
  deletePokemonById,
  getPokemonSpecies,
  getPokemonEvolution,
  getRandomPokemon,
} from '../../controllers/pokemon.controller.js';
import { validatePokemonInput } from '../../middleware/validate.js';

const router = Router();

router.get('/', getStoredData);
router.get('/random', getRandomPokemon);
router.get('/:externalId', getStoredDataById);
router.get('/:externalId/species', getPokemonSpecies);
router.get('/:externalId/evolution', getPokemonEvolution);
router.post('/sync', syncExternalData);
router.post('/', validatePokemonInput, createPokemon);
router.put('/:externalId', updatePokemon);
router.delete('/', deleteStoredData);
router.delete('/:externalId', deletePokemonById);

export default router;
