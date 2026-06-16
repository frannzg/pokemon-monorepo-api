import axios from 'axios';

const BATCH_SIZE = 50;

const fetchPokemonDetails = async (url) => {
  const { data } = await axios.get(url);
  return data;
};

export const fetchExternalData = async () => {
  const { data } = await axios.get(process.env.EXTERNAL_API_URL);
  const pokemonList = data.results || [];
  const results = [];

  for (let i = 0; i < pokemonList.length; i += BATCH_SIZE) {
    const batch = pokemonList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (pokemon) => {
        const details = await fetchPokemonDetails(pokemon.url);
        return {
          externalId: String(details.id),
          title: details.name,
          description: details.types.map((t) => t.type.name).join(', '),
          rawData: details,
        };
      })
    );
    results.push(...batchResults);
  }

  return results;
};
