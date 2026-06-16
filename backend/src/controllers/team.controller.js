import Team from '../models/Team.js';
import ExternalData from '../models/ExternalData.js';

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ updatedAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const { name, pokemon } = req.body;
    const team = await Team.create({ name, pokemon: pokemon || [] });
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
