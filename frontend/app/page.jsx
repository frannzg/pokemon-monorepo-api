import { Suspense } from 'react';
import PokemonList from '../components/PokemonList';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className="loading-state">
          <div className="pokeball-loader" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <PokemonList />
    </Suspense>
  );
}
