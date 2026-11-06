'use client';

import { useState, useEffect } from 'react';

interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

interface PokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
  types: PokemonType[];
  stats: PokemonStat[];
}

export default function PokemonViewer() {
  const [pokemonId, setPokemonId] = useState<number>(1);
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPokemon = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) {
          throw new Error('No se pudo encontrar el Pokémon.');
        }
        const data: PokemonData = await response.json();
        if (isMounted) {
          setPokemon(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Ocurrió un error al cargar el Pokémon.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPokemon();

    return () => {
      isMounted = false;
    };
  }, [pokemonId]);

  const handlePrevious = () => {
    setPokemonId((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleNext = () => {
    setPokemonId((prev) => (prev < 1025 ? prev + 1 : 1));
  };

  const handleRandom = () => {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    setPokemonId(randomId);
  };

  const artwork = pokemon?.sprites?.other?.['official-artwork']?.front_default || pokemon?.sprites?.front_default;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-6 my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 capitalize">
          Pokedex Explorer
        </h2>
        <span className="text-sm font-semibold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full">
          #{pokemonId}
        </span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cargando Pokémon...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-xl text-center my-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && pokemon && (
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            {artwork ? (
              <img
                src={artwork}
                alt={pokemon.name}
                className="w-40 h-40 object-contain drop-shadow-md hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="text-zinc-400 text-sm">Sin imagen</div>
            )}
          </div>

          <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white capitalize mb-2">
            {pokemon.name}
          </h3>

          <div className="flex gap-2 mb-4">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full"
              >
                {t.type.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl mb-6 text-center text-sm">
            <div>
              <span className="block text-zinc-400 text-xs">Altura</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">{pokemon.height / 10} m</span>
            </div>
            <div>
              <span className="block text-zinc-400 text-xs">Peso</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">{pokemon.weight / 10} kg</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handlePrevious}
          disabled={pokemonId <= 1 || loading}
          className="flex-1 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ← Anterior
        </button>

        <button
          onClick={handleRandom}
          disabled={loading}
          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-medium rounded-xl transition-colors text-sm"
        >
          🎲 Aleatorio
        </button>

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm shadow-md shadow-indigo-500/20"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
