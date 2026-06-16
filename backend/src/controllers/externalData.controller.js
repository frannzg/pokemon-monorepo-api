import ExternalData from '../models/ExternalData.js';
import { fetchExternalData } from '../services/externalApi.service.js';

export const getStoredData = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 60, sort } = req.query;
    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (type) {
      const types = type.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length === 1) {
        filter.description = { $regex: types[0], $options: 'i' };
      } else if (types.length > 1) {
        filter.$and = types.map(t => ({ description: { $regex: t, $options: 'i' } }));
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 60));
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { title: 1 };
    if (sort === 'id') sortOption = { externalId: 1 };

    const [data, total] = await Promise.all([
      ExternalData.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      ExternalData.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const syncExternalData = async (req, res) => {
  try {
    const externalData = await fetchExternalData();

    const operations = externalData.map((item) => ({
      updateOne: {
        filter: { externalId: item.externalId },
        update: { $set: item },
        upsert: true,
      },
    }));

    await ExternalData.bulkWrite(operations);

    res.json({ message: 'Data synchronized', count: externalData.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoredDataById = async (req, res) => {
  try {
    const data = await ExternalData.findOne({ externalId: req.params.externalId });
    if (!data) return res.status(404).json({ message: 'Pokemon not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPokemon = async (req, res) => {
  try {
    const { title, types, stats, height, weight, baseExperience, abilities, sprite, shinySprite } = req.body;

    if (!title || !types || types.length === 0) {
      return res.status(400).json({ message: 'Name and at least one type are required' });
    }

    const lastPokemon = await ExternalData.findOne().sort({ externalId: -1 });
    let nextId = 100000;
    const lastNum = parseInt(lastPokemon?.externalId);
    if (!isNaN(lastNum) && lastNum >= nextId) {
      nextId = lastNum + 1;
    }

    const externalId = String(nextId);
    const description = types.join(', ');

    const rawData = {
      id: nextId,
      name: title,
      height: height || 0,
      weight: weight || 0,
      base_experience: baseExperience || 0,
      stats: [
        { base_stat: stats?.hp || 0, stat: { name: 'hp' }, effort: 0 },
        { base_stat: stats?.attack || 0, stat: { name: 'attack' }, effort: 0 },
        { base_stat: stats?.defense || 0, stat: { name: 'defense' }, effort: 0 },
        { base_stat: stats?.['special-attack'] || 0, stat: { name: 'special-attack' }, effort: 0 },
        { base_stat: stats?.['special-defense'] || 0, stat: { name: 'special-defense' }, effort: 0 },
        { base_stat: stats?.speed || 0, stat: { name: 'speed' }, effort: 0 },
      ],
      abilities: (abilities || '').split(',').filter(Boolean).map((a, i) => ({
        ability: { name: a.trim() },
        is_hidden: i > 0,
        slot: i + 1,
      })),
      sprites: {
        front_default: sprite || '',
        front_shiny: shinySprite || '',
        other: {
          'official-artwork': {
            front_default: sprite || '',
            front_shiny: shinySprite || '',
          },
        },
      },
      cries: {},
    };

    const pokemon = await ExternalData.create({ externalId, title, description, rawData });
    res.status(201).json(pokemon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePokemon = async (req, res) => {
  try {
    const { externalId } = req.params;
    const existing = await ExternalData.findOne({ externalId });
    if (!existing) return res.status(404).json({ message: 'Pokemon not found' });

    const { title, types, stats, height, weight, baseExperience, abilities, sprite, shinySprite } = req.body;

    if (title !== undefined) existing.title = title;
    if (types !== undefined) existing.description = types.join(', ');

    if (!existing.rawData) existing.rawData = {};

    if (height !== undefined) existing.rawData.height = height;
    if (weight !== undefined) existing.rawData.weight = weight;
    if (baseExperience !== undefined) existing.rawData.base_experience = baseExperience;

    if (stats) {
      const prev = existing.rawData.stats || [];
      existing.rawData.stats = [
        { base_stat: stats.hp ?? prev[0]?.base_stat ?? 0, stat: { name: 'hp' }, effort: 0 },
        { base_stat: stats.attack ?? prev[1]?.base_stat ?? 0, stat: { name: 'attack' }, effort: 0 },
        { base_stat: stats.defense ?? prev[2]?.base_stat ?? 0, stat: { name: 'defense' }, effort: 0 },
        { base_stat: stats['special-attack'] ?? prev[3]?.base_stat ?? 0, stat: { name: 'special-attack' }, effort: 0 },
        { base_stat: stats['special-defense'] ?? prev[4]?.base_stat ?? 0, stat: { name: 'special-defense' }, effort: 0 },
        { base_stat: stats.speed ?? prev[5]?.base_stat ?? 0, stat: { name: 'speed' }, effort: 0 },
      ];
    }

    if (abilities !== undefined) {
      existing.rawData.abilities = abilities.split(',').filter(Boolean).map((a, i) => ({
        ability: { name: a.trim() },
        is_hidden: i > 0,
        slot: i + 1,
      }));
    }

    if (sprite !== undefined || shinySprite !== undefined) {
      if (!existing.rawData.sprites) existing.rawData.sprites = { other: {} };
      if (!existing.rawData.sprites.other) existing.rawData.sprites.other = {};
      existing.rawData.sprites.front_default = sprite ?? (existing.rawData.sprites.front_default || '');
      existing.rawData.sprites.front_shiny = shinySprite ?? (existing.rawData.sprites.front_shiny || '');
      existing.rawData.sprites.other['official-artwork'] = {
        front_default: sprite ?? (existing.rawData.sprites.other['official-artwork']?.front_default || ''),
        front_shiny: shinySprite ?? (existing.rawData.sprites.other['official-artwork']?.front_shiny || ''),
      };
    }

    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStoredData = async (req, res) => {
  try {
    await ExternalData.deleteMany({});
    res.json({ message: 'All data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePokemonById = async (req, res) => {
  try {
    const data = await ExternalData.findOneAndDelete({ externalId: req.params.externalId });
    if (!data) return res.status(404).json({ message: 'Pokemon not found' });
    res.json({ message: 'Pokemon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
