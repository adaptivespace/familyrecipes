import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Recipe } from '@/lib/recipes';

export function useSearch(initialRecipes: Recipe[]) {
  const [query, setQuery] = useState('');
  
  const fuse = useMemo(() => {
    return new Fuse(initialRecipes, {
      keys: ['title', 'tags', 'ingredients.name'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [initialRecipes]);

  const results = useMemo(() => {
    if (!query) return initialRecipes;
    return fuse.search(query).map(r => r.item);
  }, [query, initialRecipes, fuse]);

  return {
    query,
    setQuery,
    results,
  };
}
