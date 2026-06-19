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
} from '../controllers/pokemon.controller.js';
import { validatePokemonInput } from '../middleware/validate.js';

const router = Router();

router.get('/', getStoredData);
router.get('/random', getRandomPokemon);
router.get('/:id', getStoredDataById);
router.get('/:id/species', getPokemonSpecies);
router.get('/:id/evolution', getPokemonEvolution);
router.post('/sync', syncExternalData);
router.post('/', validatePokemonInput, createPokemon);
router.put('/:id', updatePokemon);
router.delete('/', deleteStoredData);
router.delete('/:id', deletePokemonById);

export default router;
