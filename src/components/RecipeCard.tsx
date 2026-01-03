import Link from 'next/link';
import { Card, CardContent, CardMedia, Typography, Chip, Box, CardActionArea } from '@mui/material';
import { Recipe } from '@/lib/recipes';
import Image from 'next/image';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  let imageUrl = recipe.image;
  
  if (!imageUrl && recipe.youtube_id) {
    imageUrl = `https://img.youtube.com/vi/${recipe.youtube_id}/mqdefault.jpg`;
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
      <CardActionArea component={Link} href={`/recipes/${recipe.slug}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        {imageUrl ? (
          <CardMedia
            component="img"
            height="180"
            image={imageUrl}
            alt={recipe.title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
           <Box sx={{ height: 180, width: '100%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Typography variant="h3" color="primary.contrastText">
               {recipe.title.charAt(0).toUpperCase()}
             </Typography>
           </Box>
        )}
        <CardContent sx={{ width: '100%' }}>
          <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
            {recipe.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {recipe.tags?.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
