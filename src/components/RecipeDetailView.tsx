'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/lib/recipes';
import { scaleRecipeText } from '@/lib/parser';
import { 
  Box, Typography, IconButton, Button, Tab, Tabs, Container, 
  Paper, TextField, Chip, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Checkbox, FormControlLabel 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: recipe.title,
    yield: recipe.yield || 2,
    tags: (recipe.tags || []).join(', '),
    content: recipe.content
  });
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

  const handleDelete = async () => {
    try {
      await fetch(`/api/recipes/${recipe.slug}`, {
        method: 'DELETE',
      });
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to delete recipe');
    }
  };

  const handleSaveRecipe = async () => {
    setUploading(true); // Reuse loading state
    try {
      const tagList = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await fetch(`/api/recipes/${recipe.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          yield: Number(editForm.yield) || 2,
          tags: tagList,
          content: editForm.content
        }),
      });
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    }
    setUploading(false);
  };

  return (
    <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Image/Video */}
      <Box sx={{ position: 'relative', height: 250, bgcolor: 'grey.300', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => router.back()} 
            sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton 
            onClick={() => router.push('/')} 
            sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
          >
            <HomeIcon />
          </IconButton>
        </Box>
        
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
            <IconButton onClick={() => setIsEditing(!isEditing)} color={isEditing ? 'primary' : 'default'}>
              {isEditing ? <CancelIcon /> : <EditIcon />}
            </IconButton>
            <IconButton onClick={() => setDeleteDialogOpen(true)} color="error">
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={() => setCookingMode(!cookingMode)} color={cookingMode ? 'warning' : 'default'}>
               {cookingMode ? <WbSunnyIcon /> : <WbSunnyOutlinedIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {isEditing ? (
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              label="Yield"
              type="number"
              fullWidth
              value={editForm.yield}
              onChange={(e) => setEditForm({ ...editForm, yield: Number(e.target.value) })}
            />
            <TextField
              label="Tags"
              fullWidth
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            />
            <TextField
              label="Instructions (Markdown)"
              multiline
              rows={10}
              fullWidth
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            />
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSaveRecipe}
              disabled={uploading}
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        ) : (
          <>
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
                '& li': { mb: 1, listStyle: 'none', pl: 0 },
                '& ul, & ol': { pl: 0 }
              }}>
                <ReactMarkdown
                  components={{
                    li: ({ children }) => (
                      <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <Checkbox sx={{ mt: -1, mr: 1 }} />
                        <Box sx={{ pt: 0.5 }}>{children}</Box>
                      </Box>
                    ),
                  }}
                >
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
          </>
        )}

      </Container>
      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Recipe?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
