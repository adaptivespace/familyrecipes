import { getRecipes } from '@/lib/recipes';
import RecipeBrowser from '@/components/RecipeBrowser';

export const dynamic = 'force-dynamic';

export default function Page() {
  const recipes = getRecipes();
  // Strip content to minimize payload
  const initialRecipes = recipes.map(({ content, ...rest }) => ({ 
    ...rest, 
    content: '' 
  }));
  
  return <RecipeBrowser initialRecipes={initialRecipes} />;
}
