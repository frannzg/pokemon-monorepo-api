import axios from 'axios';
import { PokemonRawData } from '../types/index.js';

const BATCH_SIZE = 50;

interface PokemonListItem {
  name: string;
  url: string;
}

interface PokeApiListResponse {
  count: number;
  results: PokemonListItem[];
}

interface TransformedPokemon {
  pokemonId: string;
  name: string;
  types: string;
  rawData: PokemonRawData;
}

const fetchPokemonDetails = async (url: string): Promise<PokemonRawData> => {
  const { data } = await axios.get<PokemonRawData>(url);
  return data;
};

export const fetchExternalData = async (): Promise<TransformedPokemon[]> => {
  const apiUrl = process.env.EXTERNAL_API_URL;
  if (!apiUrl) {
    throw new Error('EXTERNAL_API_URL is not defined');
  }
  const { data } = await axios.get<PokeApiListResponse>(apiUrl);
  const pokemonList = data.results || [];
  const results: TransformedPokemon[] = [];

  for (let i = 0; i < pokemonList.length; i += BATCH_SIZE) {
    const batch = pokemonList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (pokemon) => {
        const details = await fetchPokemonDetails(pokemon.url);
        return {
          pokemonId: String(details.id),
          name: details.name,
          types: details.types.map((t) => t.type.name).join(', '),
          rawData: details,
        };
      })
    );
    results.push(...batchResults);
  }

  return results;
};

export const fetchPokemonSpecies = async (speciesUrl: string): Promise<Record<string, unknown>> => {
  const { data } = await axios.get<Record<string, unknown>>(speciesUrl);
  return data;
};

export const fetchEvolutionChain = async (evolutionUrl: string): Promise<Record<string, unknown>> => {
  const { data } = await axios.get<Record<string, unknown>>(evolutionUrl);
  return data;
};
