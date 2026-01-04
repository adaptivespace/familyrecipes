import { getRecipes } from '@/lib/recipes';
import RecipeBrowser from '@/components/RecipeBrowser';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const recipes = getRecipes();
  const admin = await isAdmin();
  
  // Strip content to minimize payload
  const initialRecipes = recipes.map(({ content, ...rest }) => ({ 
    ...rest, 
    content: '' 
  }));
  
  return <RecipeBrowser initialRecipes={initialRecipes} isAdmin={admin} />;
}
