import * as cheerio from 'cheerio';
import { ParsedIngredient } from './parser';
import { convertToMetric, convertIngredient } from './converter';

export interface ImportResult {
  title: string;
  description?: string;
  ingredients: ParsedIngredient[];
  instructions: string; // Markdown
  yield: number;
  image?: string;
  youtube_id?: string;
}

export async function importFromUrl(url: string): Promise<ImportResult> {
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

  if (isYoutube) {
    return importFromYoutube(url);
  } else {
    return importFromWeb(url);
  }
}

async function importFromYoutube(url: string): Promise<ImportResult> {
  // Extract Video ID
  let videoId = '';
  const urlObj = new URL(url);
  if (urlObj.hostname.includes('youtube.com')) {
    videoId = urlObj.searchParams.get('v') || '';
  } else if (urlObj.hostname.includes('youtu.be')) {
    videoId = urlObj.pathname.slice(1);
  }

  // Fetch Page to get metadata (Title, Description)
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Unknown Video';
  const description = $('meta[property="og:description"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content');

  // Convert Description (Instructions) to Metric
  const metricDescription = convertToMetric(description);
  
  return {
    title,
    description: metricDescription,
    ingredients: [], 
    instructions: metricDescription, 
    yield: 2, // Default
    image,
    youtube_id: videoId,
  };
}

async function importFromWeb(url: string): Promise<ImportResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FamilyRecipesBot/1.0)'
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  // Look for JSON-LD
  let recipeData: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeData) return;
    try {
      const json = JSON.parse($(el).html() || '{}');
      if (Array.isArray(json)) {
        recipeData = json.find(item => item['@type'] === 'Recipe');
      } else if (json['@type'] === 'Recipe') {
        recipeData = json;
      } else if (json['@graph']) {
        recipeData = json['@graph'].find((item: any) => item['@type'] === 'Recipe');
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  if (!recipeData) {
    // Fallback: Return basic metadata to allow manual entry
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Untitled Recipe';
    const image = $('meta[property="og:image"]').attr('content');
    
    return {
      title,
      ingredients: [],
      instructions: '',
      yield: 2,
      image,
    };
  }

  // Extract fields
  const title = recipeData.name || $('title').text();
  const yieldStr = recipeData.recipeYield || '2';
  // Parse yield: "4 servings" -> 4
  const yieldMatch = yieldStr.toString().match(/\d+/);
  const yieldNum = yieldMatch ? parseInt(yieldMatch[0]) : 2;

  const image = Array.isArray(recipeData.image) ? recipeData.image[0] : (recipeData.image?.url || recipeData.image);

  // Ingredients
  const rawIngredients: string[] = Array.isArray(recipeData.recipeIngredient) 
    ? recipeData.recipeIngredient 
    : [];
  
  const ingredients: ParsedIngredient[] = rawIngredients.map(str => {
    // Simple parser: "200g flour" -> qty: 200, unit: g, name: flour
    // Very basic regex
    const match = str.match(/^([\d\.\/\s]+)?([a-zA-Z]+)?\s+(.*)/);
    if (match) {
        const parsed = {
            quantity: parseFloat(match[1]) || 0,
            unit: match[2] || '',
            name: match[3] || str, // fallback
        };
        // Convert to Metric
        return convertIngredient(parsed);
    }
    return { name: str, quantity: 0, unit: '' };
  });

  // Instructions
  let instructions = '';
  if (Array.isArray(recipeData.recipeInstructions)) {
    instructions = recipeData.recipeInstructions.map((step: any) => {
      if (typeof step === 'string') return step;
      if (step.text) return step.text;
      return '';
    }).join('\n\n');
  } else if (typeof recipeData.recipeInstructions === 'string') {
    instructions = recipeData.recipeInstructions;
  }

  // Convert Instructions Text to Metric
  instructions = convertToMetric(instructions);
  
  return {
    title,
    ingredients,
    instructions,
    yield: yieldNum,
    image: typeof image === 'string' ? image : undefined,
  };
}
