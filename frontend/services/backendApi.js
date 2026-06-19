const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getExternalData = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  if (params.ids) query.set('ids', params.ids);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.sort) query.set('sort', params.sort);

  const url = `${BASE_URL}/api/pokemon${query.toString() ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export const getPokemonById = async (id) => {
  const res = await fetch(`${BASE_URL}/api/pokemon/${id}`);
  if (!res.ok) throw new Error('Pokemon not found');
  return res.json();
};

export const syncExternalData = async () => {
  const res = await fetch(`${BASE_URL}/api/pokemon/sync`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to sync data');
  return res.json();
};

export const deleteExternalData = async () => {
  const res = await fetch(`${BASE_URL}/api/pokemon`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete data');
  return res.json();
};

export const createPokemon = async (data) => {
  const res = await fetch(`${BASE_URL}/api/pokemon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create pokemon');
  return res.json();
};

export const updatePokemon = async (externalId, data) => {
  const res = await fetch(`${BASE_URL}/api/pokemon/${externalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update pokemon');
  return res.json();
};

export const deletePokemon = async (externalId) => {
  const res = await fetch(`${BASE_URL}/api/pokemon/${externalId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete pokemon');
  return res.json();
};

export const getTeams = async () => {
  const res = await fetch(`${BASE_URL}/api/teams`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
};

export const createTeam = async (data) => {
  const res = await fetch(`${BASE_URL}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create team');
  return res.json();
};

export const getTeamById = async (id) => {
  const res = await fetch(`${BASE_URL}/api/teams/${id}`);
  if (!res.ok) throw new Error('Team not found');
  return res.json();
};

export const updateTeam = async (id, data) => {
  const res = await fetch(`${BASE_URL}/api/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update team');
  return res.json();
};

export const deleteTeam = async (id) => {
  const res = await fetch(`${BASE_URL}/api/teams/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete team');
  return res.json();
};

export const getPokemonSpecies = async (externalId) => {
  const res = await fetch(`${BASE_URL}/api/pokemon/${externalId}/species`);
  if (!res.ok) throw new Error('Species not found');
  return res.json();
};

export const getRandomPokemon = async () => {
  const res = await fetch(`${BASE_URL}/api/pokemon/random`);
  if (!res.ok) throw new Error('No pokemon available');
  return res.json();
};

export const getPokemonEvolution = async (externalId) => {
  const res = await fetch(`${BASE_URL}/api/pokemon/${externalId}/evolution`);
  if (!res.ok) throw new Error('Evolution chain not found');
  return res.json();
};
