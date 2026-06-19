import { Request, Response } from 'express';
import Pokemon from '../models/Pokemon.js';
import {
  fetchExternalData,
  fetchPokemonSpecies,
  fetchEvolutionChain,
} from '../services/pokeapi.service.js';
import {
  PokemonQueryParams,
  CreatePokemonBody,
  PokemonRawData,
} from '../types/index.js';

export const getStoredData = async (
  req: Request<Record<string, string>, unknown, unknown, PokemonQueryParams>,
  res: Response
): Promise<void> => {
  try {
    const { search, type, ids, page = '1', limit = '60', sort } = req.query;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (type) {
      const types = type.split(',').map((t: string) => t.trim()).filter(Boolean);
      if (types.length === 1) {
        filter.types = { $regex: types[0], $options: 'i' };
      } else if (types.length > 1) {
        filter.$and = types.map((t: string) => ({ types: { $regex: t, $options: 'i' } }));
      }
    }
    if (ids) {
      const idList = ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      if (idList.length > 0) {
        filter.pokemonId = { $in: idList };
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 60));
    const skip = (pageNum - 1) * limitNum;

    const sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'name') sortOption.name = 1;
    if (sort === 'id') sortOption.pokemonId = 1;

    const [data, total] = await Promise.all([
      Pokemon.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Pokemon.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const syncExternalData = async (req: Request, res: Response): Promise<void> => {
  try {
    const externalData = await fetchExternalData();

    const operations = externalData.map((item) => ({
      updateOne: {
        filter: { pokemonId: item.pokemonId },
        update: { $set: item },
        upsert: true,
      },
    }));

    await Pokemon.bulkWrite(operations);

    res.json({ message: 'Data synchronized', count: externalData.length });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getStoredDataById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let data = await Pokemon.findOne({ pokemonId: id });
    if (!data) {
      data = await Pokemon.findOne({ name: { $regex: new RegExp(`^${id}$`, 'i') } });
    }
    if (!data) {
      res.status(404).json({ message: 'Pokemon not found' });
      return;
    }

    let prev: { pokemonId: string; name: string } | null = null;
    let next: { pokemonId: string; name: string } | null = null;
    const numId = parseInt(data.pokemonId);
    if (!isNaN(numId)) {
      const [prevResult, nextResult] = await Promise.all([
        Pokemon.findOne({ pokemonId: { $lt: String(numId) } })
          .sort({ pokemonId: -1 })
          .select('pokemonId name'),
        Pokemon.findOne({ pokemonId: { $gt: String(numId) } })
          .sort({ pokemonId: 1 })
          .select('pokemonId name'),
      ]);
      if (prevResult) prev = { pokemonId: prevResult.pokemonId, name: prevResult.name };
      if (nextResult) next = { pokemonId: nextResult.pokemonId, name: nextResult.name };
    }

    const obj = data.toObject();
    res.json({
      ...obj,
      prevPokemon: prev,
      nextPokemon: next,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const createPokemon = async (
  req: Request<Record<string, string>, unknown, CreatePokemonBody>,
  res: Response
): Promise<void> => {
  try {
    const { name, types, stats, height, weight, baseExperience, abilities, sprite, shinySprite } =
      req.body;

    if (!name || !types || types.length === 0) {
      res.status(400).json({ message: 'Name and at least one type are required' });
      return;
    }

    const lastPokemon = await Pokemon.findOne().sort({ pokemonId: -1 });
    let nextId = 100000;
    const lastNum = parseInt(lastPokemon?.pokemonId ?? '');
    if (!isNaN(lastNum) && lastNum >= nextId) {
      nextId = lastNum + 1;
    }

    const pokemonId = String(nextId);
    const typesStr = types.join(', ');

    const rawData: PokemonRawData = {
      id: nextId,
      name,
      height: height || 0,
      weight: weight || 0,
      base_experience: baseExperience || 0,
      types: types.map((t) => ({ type: { name: t } })),
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

    const pokemon = await Pokemon.create({ pokemonId, name, types: typesStr, rawData });
    res.status(201).json(pokemon);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updatePokemon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await Pokemon.findOne({ pokemonId: id });
    if (!existing) {
      res.status(404).json({ message: 'Pokemon not found' });
      return;
    }

    const {
      name,
      types,
      stats,
      height,
      weight,
      baseExperience,
      abilities,
      sprite,
      shinySprite,
    } = req.body as CreatePokemonBody;

    if (name !== undefined) existing.name = name;
    if (types !== undefined) existing.types = types.join(', ');

    if (!existing.rawData) existing.rawData = {} as PokemonRawData;

    const raw = existing.rawData as PokemonRawData;

    if (height !== undefined) raw.height = height;
    if (weight !== undefined) raw.weight = weight;
    if (baseExperience !== undefined) raw.base_experience = baseExperience;

    if (stats) {
      const prev = raw.stats || [];
      raw.stats = [
        { base_stat: stats.hp ?? prev[0]?.base_stat ?? 0, stat: { name: 'hp' }, effort: 0 },
        { base_stat: stats.attack ?? prev[1]?.base_stat ?? 0, stat: { name: 'attack' }, effort: 0 },
        { base_stat: stats.defense ?? prev[2]?.base_stat ?? 0, stat: { name: 'defense' }, effort: 0 },
        { base_stat: stats['special-attack'] ?? prev[3]?.base_stat ?? 0, stat: { name: 'special-attack' }, effort: 0 },
        { base_stat: stats['special-defense'] ?? prev[4]?.base_stat ?? 0, stat: { name: 'special-defense' }, effort: 0 },
        { base_stat: stats.speed ?? prev[5]?.base_stat ?? 0, stat: { name: 'speed' }, effort: 0 },
      ];
    }

    if (abilities !== undefined) {
      raw.abilities = abilities.split(',').filter(Boolean).map((a, i) => ({
        ability: { name: a.trim() },
        is_hidden: i > 0,
        slot: i + 1,
      }));
    }

    if (sprite !== undefined || shinySprite !== undefined) {
      if (!raw.sprites) raw.sprites = { front_default: '', front_shiny: '', other: { 'official-artwork': { front_default: '', front_shiny: '' } } };
      if (!raw.sprites.other) raw.sprites.other = { 'official-artwork': { front_default: '', front_shiny: '' } };
      raw.sprites.front_default = sprite ?? (raw.sprites.front_default || '');
      raw.sprites.front_shiny = shinySprite ?? (raw.sprites.front_shiny || '');
      raw.sprites.other['official-artwork'] = {
        front_default: sprite ?? (raw.sprites.other['official-artwork']?.front_default || ''),
        front_shiny: shinySprite ?? (raw.sprites.other['official-artwork']?.front_shiny || ''),
      };
    }

    existing.rawData = raw;
    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getPokemonSpecies = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Pokemon.findOne({ pokemonId: req.params.id });
    if (!data) {
      res.status(404).json({ message: 'Pokemon not found' });
      return;
    }

    const raw = data.rawData as PokemonRawData;
    const speciesUrl = raw.species?.url;
    if (!speciesUrl) {
      res.status(404).json({ message: 'Species data not available' });
      return;
    }

    const speciesData = await fetchPokemonSpecies(speciesUrl);
    res.json(speciesData);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getPokemonEvolution = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Pokemon.findOne({ pokemonId: req.params.id });
    if (!data) {
      res.status(404).json({ message: 'Pokemon not found' });
      return;
    }

    const raw = data.rawData as PokemonRawData;
    const speciesUrl = raw.species?.url;
    if (!speciesUrl) {
      res.status(404).json({ message: 'Species data not available' });
      return;
    }

    const speciesData = await fetchPokemonSpecies(speciesUrl);
    const evolutionUrl = (speciesData as Record<string, unknown>).evolution_chain as { url: string } | undefined;
    if (!evolutionUrl?.url) {
      res.status(404).json({ message: 'Evolution chain not available' });
      return;
    }

    const evolutionData = await fetchEvolutionChain(evolutionUrl.url);
    res.json(evolutionData);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getRandomPokemon = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Pokemon.countDocuments();
    if (count === 0) {
      res.status(404).json({ message: 'No pokemon available' });
      return;
    }
    const random = await Pokemon.aggregate([{ $sample: { size: 1 } }]);
    res.json(random[0]);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteStoredData = async (req: Request, res: Response): Promise<void> => {
  try {
    await Pokemon.deleteMany({});
    res.json({ message: 'All data deleted' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deletePokemonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Pokemon.findOneAndDelete({ pokemonId: req.params.id });
    if (!data) {
      res.status(404).json({ message: 'Pokemon not found' });
      return;
    }
    res.json({ message: 'Pokemon deleted' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
