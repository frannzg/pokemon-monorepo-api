import { Router } from 'express';
import {
  getTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
} from '../../controllers/team.controller.js';

const router = Router();

router.get('/', getTeams);
router.post('/', createTeam);
router.get('/:id', getTeamById);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
