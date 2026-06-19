import { Request } from 'express';

export interface IPokemon {
  _id?: string;
  pokemonId: string;
  name: string;
  types: string;
  rawData: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  prevPokemon?: { pokemonId: string; name: string } | null;
  nextPokemon?: { pokemonId: string; name: string } | null;
}

export interface PokemonQueryParams {
  search?: string;
  type?: string;
  ids?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface PaginatedResponse {
  data: IPokemon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITeam {
  _id?: string;
  name: string;
  pokemonIds: string[];
  pokemonData?: IPokemon[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePokemonBody {
  name: string;
  types: string[];
  stats?: {
    hp?: number;
    attack?: number;
    defense?: number;
    'special-attack'?: number;
    'special-defense'?: number;
    speed?: number;
  };
  height?: number;
  weight?: number;
  baseExperience?: number;
  abilities?: string;
  sprite?: string;
  shinySprite?: string;
}

export interface CreateTeamBody {
  name: string;
  pokemonIds: string[];
}

export interface ErrorResponse {
  message: string;
}

export interface SyncResult {
  message: string;
  count: number;
}

export interface PokemonRawData {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: { type: { name: string } }[];
  stats: {
    base_stat: number;
    stat: { name: string };
    effort: number;
  }[];
  abilities: {
    ability: { name: string };
    is_hidden: boolean;
    slot: number;
  }[];
  sprites: {
    front_default: string;
    front_shiny: string;
    other: {
      'official-artwork': {
        front_default: string;
        front_shiny: string;
      };
    };
  };
  species?: { url: string };
  cries?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TypedRequest<P = Record<string, string>, B = unknown, Q = Record<string, string | undefined>>
  extends Request<P, unknown, B, Q> {}
