import Team from '../models/Team.js';
import ExternalData from '../models/ExternalData.js';

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ updatedAt: -1 });

    const teamsWithData = await Promise.all(teams.map(async (team) => {
      const pokemonData = await ExternalData.find({
        externalId: { $in: team.pokemon },
      });
      const pokemonMap = {};
      pokemonData.forEach((p) => {
        pokemonMap[p.externalId] = p;
      });
      const sortedPokemon = team.pokemon.map((id) => pokemonMap[id]).filter(Boolean);
      return { ...team.toObject(), pokemonData: sortedPokemon };
    }));

    res.json(teamsWithData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, pokemon } = req.body;
    const ids = pokemon || [];
    if (ids.length > 6) return res.status(400).json({ message: 'Team cannot have more than 6 Pokémon' });
    const team = await Team.create({ name, pokemon: ids });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const pokemonData = await ExternalData.find({
      externalId: { $in: team.pokemon },
    });

    const pokemonMap = {};
    pokemonData.forEach((p) => {
      pokemonMap[p.externalId] = p;
    });

    const sortedPokemon = team.pokemon.map((id) => pokemonMap[id]).filter(Boolean);

    res.json({ ...team.toObject(), pokemonData: sortedPokemon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { name, pokemon } = req.body;
    if (pokemon !== undefined && pokemon.length > 6) {
      return res.status(400).json({ message: 'Team cannot have more than 6 Pokémon' });
    }
    const update = {};
    if (name !== undefined) update.name = name;
    if (pokemon !== undefined) update.pokemon = pokemon;

    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
