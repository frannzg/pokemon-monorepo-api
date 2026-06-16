const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getExternalData = async () => {
  const res = await fetch(`${BASE_URL}/api/external-data`);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export const getPokemonById = async (id) => {
  const res = await fetch(`${BASE_URL}/api/external-data/${id}`);
  if (!res.ok) throw new Error('Pokemon not found');
  return res.json();
};

export const syncExternalData = async () => {
  const res = await fetch(`${BASE_URL}/api/external-data/sync`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to sync data');
  return res.json();
};

export const deleteExternalData = async () => {
  const res = await fetch(`${BASE_URL}/api/external-data`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete data');
  return res.json();
};
