import { NextResponse } from 'next/server';
import { getRecipe, saveRecipe, deleteRecipe } from '@/lib/recipes';
import { extractIngredients } from '@/lib/parser';
import { convertIngredient } from '@/lib/converter';

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
  
  // If content (instructions) is being updated, re-extract ingredients
  if (body.content && body.content !== recipe.content) {
    const extracted = extractIngredients(body.content);
    // Convert extracted ingredients to metric
    body.ingredients = extracted.map(convertIngredient);
  }

  const updatedRecipe = { ...recipe, ...body };
  
  // Ensure slug remains consistent
  updatedRecipe.slug = slug;
  
  saveRecipe(updatedRecipe);
  return NextResponse.json(updatedRecipe);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  try {
    deleteRecipe(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
