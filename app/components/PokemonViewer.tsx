'use client';

import { useState, useEffect, useCallback } from 'react';

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

const MAX_POKEMON_ID = 1025;
const MIN_POKEMON_ID = 1;

export default function PokemonViewer() {
  const [pokemonId, setPokemonId] = useState<number>(1);
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPokemon = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!response.ok) {
        throw new Error('No se pudo encontrar el Pokémon solicitado.');
      }
      const data: PokemonData = await response.json();
      setPokemon(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al cargar el Pokémon.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPokemon(pokemonId);
  }, [pokemonId, fetchPokemon]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setPokemonId((prev) => (prev > MIN_POKEMON_ID ? prev - 1 : prev));
      } else if (event.key === 'ArrowRight') {
        setPokemonId((prev) => (prev < MAX_POKEMON_ID ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrevious = () => setPokemonId((prev) => Math.max(prev - 1, MIN_POKEMON_ID));
  const handleNext = () => setPokemonId((prev) => Math.min(prev + 1, MAX_POKEMON_ID));
  const handleRandom = () => {
    const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + MIN_POKEMON_ID;
    setPokemonId(randomId);
  };

  const artworkUrl =
    pokemon?.sprites?.other?.['official-artwork']?.front_default ||
    pokemon?.sprites?.front_default;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden p-6 my-8 transition-all">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Pokédex Viewer
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Usa las flechas del teclado ← →</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl shadow-xs">
          #{pokemonId.toString().padStart(3, '0')}
        </span>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium animate-pulse">
            Buscando Pokémon...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-6 rounded-2xl text-center my-6">
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={() => fetchPokemon(pokemonId)}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : pokemon ? (
        <div className="flex flex-col items-center animate-fadeIn">
          {/* Artwork Frame */}
          <div className="relative w-52 h-52 bg-gradient-to-b from-indigo-50/80 to-purple-50/80 dark:from-zinc-800/80 dark:to-zinc-800/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-zinc-100 dark:border-zinc-800">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={pokemon.name}
                className="w-44 h-44 object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="text-zinc-400 text-sm font-medium">Imagen no disponible</div>
            )}
          </div>

          {/* Name & Types */}
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white capitalize tracking-tight mb-3">
            {pokemon.name}
          </h3>

          <div className="flex gap-2 mb-6">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/50"
              >
                {t.type.name}
              </span>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl mb-6 border border-zinc-100 dark:border-zinc-800 text-center">
            <div>
              <span className="block text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Altura
              </span>
              <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {pokemon.height / 10} m
              </span>
            </div>
            <div>
              <span className="block text-zinc-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Peso
              </span>
              <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {pokemon.weight / 10} kg
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handlePrevious}
          disabled={pokemonId <= MIN_POKEMON_ID || loading}
          className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm active:scale-95"
        >
          ← Anterior
        </button>

        <button
          onClick={handleRandom}
          disabled={loading}
          title="Pokémon aleatorio"
          className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold rounded-2xl transition-all text-sm active:scale-95"
        >
          🎲
        </button>

        <button
          onClick={handleNext}
          disabled={pokemonId >= MAX_POKEMON_ID || loading}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-2xl transition-all disabled:opacity-40 text-sm shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
