import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ParsedIngredient } from './parser';

const recipesDirectory = path.join(process.cwd(), 'data/recipes');

export interface Recipe {
  slug: string;
  title: string;
  tags: string[];
  ingredients: ParsedIngredient[];
  yield: number;
  source_url?: string;
  youtube_id?: string;
  image?: string;
  content: string; // Markdown body
}

export function getRecipes(): Recipe[] {
  if (!fs.existsSync(recipesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(recipesDirectory);
  const allRecipes = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(recipesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        tags: data.tags || [],
        ingredients: data.ingredients || [],
        yield: data.yield || 1,
        source_url: data.source_url,
        youtube_id: data.youtube_id,
        image: data.image,
        content: content,
      } as Recipe;
    });

  // Sort recipes by title
  return allRecipes.sort((a, b) => {
    if (a.title < b.title) {
      return -1;
    } else {
      return 1;
    }
  });
}

export function getRecipe(slug: string): Recipe | null {
  const fullPath = path.join(recipesDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug,
    tags: data.tags || [],
    ingredients: data.ingredients || [],
    yield: data.yield || 1,
    source_url: data.source_url,
    youtube_id: data.youtube_id,
    image: data.image,
    content: content,
  } as Recipe;
}

export function saveRecipe(recipe: Recipe): void {
  if (!fs.existsSync(recipesDirectory)) {
    fs.mkdirSync(recipesDirectory, { recursive: true });
  }

  const fullPath = path.join(recipesDirectory, `${recipe.slug}.md`);
  
  const data: Record<string, any> = {
    title: recipe.title,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    yield: recipe.yield,
    source_url: recipe.source_url,
    youtube_id: recipe.youtube_id,
    image: recipe.image,
  };

  // Remove undefined values to avoid YAMLException
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

  const fileContent = matter.stringify(recipe.content || '', data);
  fs.writeFileSync(fullPath, fileContent);
}

export function deleteRecipe(slug: string): void {
  const fullPath = path.join(recipesDirectory, `${slug}.md`);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}
