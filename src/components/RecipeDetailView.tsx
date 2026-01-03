'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/lib/recipes';
import { scaleRecipeText } from '@/lib/parser';
import { 
  Box, Typography, IconButton, Button, Tab, Tabs, Container, 
  Paper, TextField, Chip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import WbSunnyIcon from '@mui/icons-material/WbSunny'; 
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

export default function RecipeDetailView({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [servings, setServings] = useState(recipe.yield || 2);
  const [tab, setTab] = useState(0);
  const [cookingMode, setCookingMode] = useState(false);
  const [notes, setNotes] = useState(recipe.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const multiplier = servings / (recipe.yield || 1);

  // Wake Lock
  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      if (cookingMode && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error(err);
        }
      }
    };
    requestLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [cookingMode]);

  // Save Notes
  const saveNotes = async () => {
    setSavingNotes(true);
    await fetch(`/api/recipes/${recipe.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
  };

  // Upload Image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        // Update recipe
        await fetch(`/api/recipes/${recipe.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: data.url }),
        });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Image/Video */}
      <Box sx={{ position: 'relative', height: 250, bgcolor: 'grey.300', overflow: 'hidden' }}>
        <IconButton 
          onClick={() => router.back()} 
          sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        {recipe.youtube_id ? (
           <iframe
             width="100%"
             height="100%"
             src={`https://www.youtube.com/embed/${recipe.youtube_id}`}
             title="YouTube video player"
             frameBorder="0"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowFullScreen
           />
        ) : recipe.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
             <CameraAltIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
             <Button variant="contained" component="label" disabled={uploading}>
               {uploading ? 'Uploading...' : 'Take Photo'}
               <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageUpload} />
             </Button>
          </Box>
        )}
        
        {recipe.image && (
          <IconButton 
            component="label" 
            sx={{ position: 'absolute', bottom: 16, right: 16, bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}
          >
            <CameraAltIcon />
            <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageUpload} />
          </IconButton>
        )}
      </Box>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {recipe.title}
          </Typography>
          <Box>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={() => setCookingMode(!cookingMode)} color={cookingMode ? 'warning' : 'default'}>
               {cookingMode ? <WbSunnyIcon /> : <WbSunnyOutlinedIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
           {recipe.tags?.map(tag => <Chip key={tag} label={tag} size="small" />)}
        </Box>

        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} elevation={0} variant="outlined">
          <Typography variant="subtitle1">Servings</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setServings(Math.max(1, servings - 1))} size="small" sx={{ bgcolor: 'action.hover' }}>
              <RemoveIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">{servings}</Typography>
            <IconButton onClick={() => setServings(servings + 1)} size="small" sx={{ bgcolor: 'action.hover' }}>
              <AddIcon />
            </IconButton>
          </Box>
        </Paper>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Ingredients" />
          <Tab label="Instructions" />
          <Tab label="Notes" />
        </Tabs>

        {tab === 0 && (
          <Box>
            {recipe.ingredients.map((ing, i) => {
               const scaledQty = ing.quantity * multiplier;
               const qtyDisplay = scaledQty ? parseFloat(scaledQty.toFixed(2)) : '';
               return (
                 <Box key={i} sx={{ py: 1.5, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                   <Typography variant="body1">{ing.name}</Typography>
                   <Typography variant="body1" fontWeight="bold" color="primary">
                     {qtyDisplay} {ing.unit}
                   </Typography>
                 </Box>
               );
            })}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ 
            '& p': { mb: 2, lineHeight: 1.7, fontSize: cookingMode ? '1.2rem' : '1rem' },
            '& li': { mb: 1 }
          }}>
            <ReactMarkdown>
              {scaleRecipeText(recipe.content, multiplier)}
            </ReactMarkdown>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              placeholder="Add your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </Box>
        )}

      </Container>
    </Box>
  );
}
