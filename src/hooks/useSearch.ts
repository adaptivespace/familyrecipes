import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Recipe } from '@/lib/recipes';

export function useSearch(initialRecipes: Recipe[]) {
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  
  const fuse = useMemo(() => {
    return new Fuse(initialRecipes, {
      keys: ['title', 'tags', 'ingredients.name'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [initialRecipes]);

  const results = useMemo(() => {
    let filtered = initialRecipes;

    // Apply strict tag filter if active (AND operator)
    if (tagFilter.length > 0) {
      filtered = filtered.filter(r => 
        tagFilter.every(tag => r.tags?.includes(tag))
      );
    }

    // Apply fuzzy search if query exists
    if (query) {
      const searchResults = fuse.search(query).map(r => r.item);
      // Intersect search results with tag filter
      if (tagFilter.length > 0) {
        return searchResults.filter(r => 
          tagFilter.every(tag => r.tags?.includes(tag))
        );
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
