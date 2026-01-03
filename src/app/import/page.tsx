'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, TextField, Button, Typography, Box, Paper, CircularProgress, 
  Alert, Stepper, Step, StepLabel 
} from '@mui/material';
import { ImportResult } from '@/lib/importer';

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
  const [yieldNum, setYieldNum] = useState(2);
  const [instructions, setInstructions] = useState('');

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
      
      const payload = {
        title,
        tags: tagList,
        yield: yieldNum,
        ingredients: importedData.ingredients, // We assume parser did its best, or we could add an editor for this too
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Import Recipe</Typography>
      
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
               onChange={e => setYieldNum(parseInt(e.target.value))} 
             />
             <TextField 
               label="Tags (comma separated)" 
               value={tags} 
               onChange={e => setTags(e.target.value)} 
               helperText="e.g. Asian, Dessert, Quick"
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
  );
}
