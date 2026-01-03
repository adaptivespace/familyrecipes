import { getRecipe } from '@/lib/recipes';
import RecipeDetailView from '@/components/RecipeDetailView';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  
  if (!recipe) {
    notFound();
  }
  
  return <RecipeDetailView recipe={recipe} />;
}
