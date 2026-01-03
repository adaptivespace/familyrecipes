import { NextResponse } from 'next/server';
import { getRecipes, saveRecipe, Recipe } from '@/lib/recipes';

export async function GET() {
  const recipes = getRecipes();
  // Return summary (strip content to save bandwidth on list view)
  const summary = recipes.map(({ content, ...rest }) => rest);
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title } = body;
  
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Generate slug
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug) slug = 'untitled-' + Date.now();
  
  // Create full recipe object
  const recipe: Recipe = {
    slug,
    ...body,
  };
  
  try {
    saveRecipe(recipe);
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Failed to save recipe:', error);
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
  }
}
