import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Recipe } from '@/lib/recipes';

export function useSearch(initialRecipes: Recipe[]) {
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  const fuse = useMemo(() => {
    return new Fuse(initialRecipes, {
      keys: ['title', 'tags', 'ingredients.name'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [initialRecipes]);

  const results = useMemo(() => {
    let filtered = initialRecipes;

    // Apply strict tag filter if active
    if (tagFilter) {
      filtered = filtered.filter(r => r.tags?.includes(tagFilter));
    }

    // Apply fuzzy search if query exists
    if (query) {
      const searchResults = fuse.search(query).map(r => r.item);
      // Intersect search results with tag filter
      if (tagFilter) {
        return searchResults.filter(r => r.tags?.includes(tagFilter));
      }
      return searchResults;
    }

    return filtered;
  }, [query, tagFilter, initialRecipes, fuse]);

  return {
    query,
    setQuery,
    tagFilter,
    setTagFilter,
    results,
  };
}
