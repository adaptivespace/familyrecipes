'use client';

import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppHeader({ title }: { title?: string }) {
  const router = useRouter();

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="home" component={Link} href="/">
          <HomeIcon color="primary" />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold' }}>
          {title || 'Family Recipes'}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
