'use client';

import { useSearch } from '@/hooks/useSearch';
import RecipeCard from '@/components/RecipeCard';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { Recipe } from '@/lib/recipes';

export default function RecipeBrowser({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const { query, setQuery, tagFilter, setTagFilter, results } = useSearch(initialRecipes);
  
  const allTags = Array.from(new Set(initialRecipes.flatMap(r => r.tags || []))).sort();

  return (
    <Container maxWidth="md" sx={{ pb: 10, pt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Family Recipes
      </Typography>
      
      <TextField
        fullWidth
        placeholder="Search recipes, ingredients, tags..."
        value={query}
        onChange={(e) => {
            setQuery(e.target.value);
            // Clear tag filter if user starts typing a new query
            if (e.target.value && tagFilter) setTagFilter('');
        }}
        variant="outlined"
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'background.paper' } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 2, '::-webkit-scrollbar': { display: 'none' } }}>
        <Chip 
          label="All" 
          onClick={() => {
              setQuery('');
              setTagFilter('');
          }}
          variant={!query && !tagFilter ? 'filled' : 'outlined'}
          color={!query && !tagFilter ? 'primary' : 'default'}
        />
        {allTags.map(tag => (
          <Chip 
            key={tag} 
            label={tag} 
            onClick={() => {
                setTagFilter(tag);
                setQuery(''); // Clear search text when selecting a tag
            }} 
            variant={tagFilter === tag ? 'filled' : 'outlined'}
            color={tagFilter === tag ? 'primary' : 'default'}
          />
        ))}
      </Box>

      <Grid container spacing={2}>
        {results.map((recipe) => (
          <Grid size={{ xs: 12, sm: 6 }} key={recipe.slug}>
            <RecipeCard recipe={recipe} />
          </Grid>
        ))}
      </Grid>
      
      {results.length === 0 && (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No recipes found.
          </Typography>
        </Box>
      )}

      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        component={Link}
        href="/import"
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
