import * as cheerio from 'cheerio';
import { ParsedIngredient } from './parser';

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
  // Note: YouTube often blocks simple fetch, might need User-Agent or fallbacks.
  // oEmbed is safer for Title/Thumbnail, but doesn't give Description.
  // We'll try fetch first.
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

  // Attempt to parse ingredients from description
  // Simple heuristic: look for lines starting with "-", "*", or numbers
  const ingredients: ParsedIngredient[] = [];
  const lines = description.split('\n');
  const instructionsParts: string[] = [];
  
  let captureIngredients = false;
  // This is a naive parser for YT descriptions
  // Usually creators put "Ingredients:" then list.
  
  // For now, return raw description as instructions or try to split?
  // Let's just put the description in instructions and let user edit.
  // And maybe empty ingredients list?
  
  return {
    title,
    description,
    ingredients: [], // Hard to parse reliably without ML or strict format
    instructions: description, // Put description as instructions body
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
    throw new Error('No Schema.org Recipe found on this page.');
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
      return {
        quantity: parseFloat(match[1]) || 0,
        unit: match[2] || '',
        name: match[3] || str, // fallback
      };
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

  // Simple HTML to Markdown for instructions (if they contain tags)
  // If instructions came from JSON-LD they are usually text, but sometimes HTML.
  // We'll assume text for now or simple strip.
  
  return {
    title,
    ingredients,
    instructions,
    yield: yieldNum,
    image: typeof image === 'string' ? image : undefined,
  };
}
