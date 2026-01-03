'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, TextField, Button, Typography, Box, Paper, CircularProgress, 
  Alert, Stepper, Step, StepLabel 
} from '@mui/material';
import { ImportResult } from '@/lib/importer';
import AppHeader from '@/components/AppHeader';
import { parseIngredientLine, ParsedIngredient } from '@/lib/parser';
import { convertIngredient } from '@/lib/converter';

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [importedData, setImportedData] = useState<ImportResult | null>(null);
  
  // Edit State
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [yieldNum, setYieldNum] = useState<number | string>(2);
  const [instructions, setInstructions] = useState('');
  const [rawIngredients, setRawIngredients] = useState('');

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setImportedData(data);
      setTitle(data.title);
      setYieldNum(data.yield || 2);
      setInstructions(data.instructions);
      
      // Convert parsed ingredients to string for editing
      const ingText = data.ingredients.map(ing => {
         const unit = ing.unit ? `${ing.unit} ` : '';
         return `${ing.quantity} ${unit}${ing.name}`.trim();
      }).join('\n');
      setRawIngredients(ingText);
      
      setStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to import');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!importedData) return;
    setLoading(true);
    try {
      // Parse tags
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      
      // Parse manual ingredients
      let finalIngredients = importedData.ingredients;
      if (rawIngredients.trim()) {
        finalIngredients = rawIngredients.split('\n').map(line => {
           if (!line.trim()) return null;
           const parsed = parseIngredientLine(line.trim());
           return convertIngredient(parsed);
        }).filter(Boolean) as ParsedIngredient[];
      }
      
      const payload = {
        title,
        tags: tagList,
        yield: Number(yieldNum) || 2,
        ingredients: finalIngredients,
        content: instructions,
        source_url: url,
        youtube_id: importedData.youtube_id,
        image: importedData.image,
      };

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/recipes/${data.slug}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader title="Import Recipe" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step><StepLabel>Paste URL</StepLabel></Step>
          <Step><StepLabel>Review & Save</StepLabel></Step>
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 0 && (
        <Paper sx={{ p: 4 }}>
          <TextField 
            fullWidth 
            label="Recipe URL (Web or YouTube)" 
            value={url} 
            onChange={e => setUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button 
            variant="contained" 
            onClick={handleImport} 
            disabled={loading || !url}
            fullWidth
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </Paper>
      )}

      {step === 1 && importedData && (
        <Paper sx={{ p: 4 }}>
          {importedData.ingredients.length === 0 && !importedData.instructions && (
             <Alert severity="warning" sx={{ mb: 2 }}>
               No automatic recipe data found. Please fill in the details manually.
             </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             <TextField 
               label="Title" 
               value={title} 
               onChange={e => setTitle(e.target.value)} 
               fullWidth 
             />
             <TextField 
               label="Yield (Servings)" 
               type="number" 
               value={yieldNum} 
               onChange={e => {
                 const val = parseInt(e.target.value);
                 setYieldNum(isNaN(val) ? '' : val);
               }} 
             />
              <TextField 
                label="Tags (comma separated)" 
                value={tags} 
                onChange={e => setTags(e.target.value)} 
                helperText="e.g. Asian, Dessert, Quick"
              />
              <TextField 
                label="Ingredients (one per line)" 
                multiline
                rows={6}
                value={rawIngredients} 
                onChange={e => setRawIngredients(e.target.value)} 
                helperText="Format: Quantity Unit Name (e.g. 200 g Flour)"
              />
              <TextField 
                label="Instructions (Markdown)" 
                multiline 

               rows={10} 
               value={instructions} 
               onChange={e => setInstructions(e.target.value)} 
             />
             
             <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
               <Button onClick={() => setStep(0)}>Back</Button>
               <Button 
                 variant="contained" 
                 onClick={handleSave} 
                 disabled={loading}
                 fullWidth
               >
                 {loading ? 'Saving...' : 'Save Recipe'}
               </Button>
             </Box>
          </Box>
        </Paper>
      )}
      </Container>
    </>
  );
}

