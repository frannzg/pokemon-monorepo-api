import { Suspense } from 'react';
import PokemonList from '../components/PokemonList';
import PokemonOfTheDay from '../components/PokemonOfTheDay';

export default function Home() {
  return (
    <>
      <div className="container" style={{ paddingBottom: 0 }}>
        <Suspense fallback={null}>
          <PokemonOfTheDay />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <PokemonList />
      </Suspense>
    </>
  );
}
