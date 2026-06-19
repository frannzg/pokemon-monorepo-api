import { Request, Response } from 'express';
import Team from '../models/Team.js';
import Pokemon from '../models/Pokemon.js';
import { CreateTeamBody } from '../types/index.js';

export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find().sort({ updatedAt: -1 });

    const teamsWithData = await Promise.all(
      teams.map(async (team) => {
        const pokemonData = await Pokemon.find({
          pokemonId: { $in: team.pokemonIds },
        });
        const pokemonMap: Record<string, typeof pokemonData[0]> = {};
        pokemonData.forEach((p) => {
          pokemonMap[p.pokemonId] = p;
        });
        const sortedPokemon = team.pokemonIds
          .map((id) => pokemonMap[id])
          .filter(Boolean);
        return { ...team.toObject(), pokemonData: sortedPokemon };
      })
    );

    res.json(teamsWithData);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createTeam = async (
  req: Request<Record<string, string>, unknown, CreateTeamBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, pokemonIds } = req.body;
    const ids = pokemonIds || [];
    if (ids.length > 6) {
      res.status(400).json({ message: 'Team cannot have more than 6 Pokémon' });
      return;
    }
    const team = await Team.create({ name, pokemonIds: ids });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    const pokemonData = await Pokemon.find({
      pokemonId: { $in: team.pokemonIds },
    });

    const pokemonMap: Record<string, typeof pokemonData[0]> = {};
    pokemonData.forEach((p) => {
      pokemonMap[p.pokemonId] = p;
    });

    const sortedPokemon = team.pokemonIds
      .map((id) => pokemonMap[id])
      .filter(Boolean);

    res.json({ ...team.toObject(), pokemonData: sortedPokemon });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateTeam = async (
  req: Request<Record<string, string>, unknown, Partial<CreateTeamBody>>,
  res: Response
): Promise<void> => {
  try {
    const { name, pokemonIds } = req.body;
    if (pokemonIds !== undefined && pokemonIds.length > 6) {
      res.status(400).json({ message: 'Team cannot have more than 6 Pokémon' });
      return;
    }
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (pokemonIds !== undefined) update.pokemonIds = pokemonIds;

    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
