import { NextResponse } from 'next/server';
import { getRecipe, saveRecipe } from '@/lib/recipes';

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json(recipe);
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  
  const body = await request.json();
  const updatedRecipe = { ...recipe, ...body };
  
  // Ensure slug remains consistent
  updatedRecipe.slug = slug;
  
  saveRecipe(updatedRecipe);
  return NextResponse.json(updatedRecipe);
}
