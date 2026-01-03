export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
}

// Regex to match @name{qty%unit} or @name{qty}
// Examples: @flour{200%g} -> name:flour, qty:200, unit:g
//           @eggs{2}       -> name:eggs, qty:2, unit:''
const INGREDIENT_REGEX = /@([^{]+)\{([\d\.]+)?%?([^}]*)\}/g;

/**
 * Scales the ingredients within the text for display.
 * Input: "Mix @flour{200%g} with..." and multiplier 2
 * Output: "Mix 400g flour with..."
 */
export function scaleRecipeText(text: string, multiplier: number = 1): string {
  return text.replace(INGREDIENT_REGEX, (match, name, qty, unit) => {
    const currentQty = parseFloat(qty);
    if (isNaN(currentQty)) return name; // Fallback to just name if no qty

    const newQty = (currentQty * multiplier);
    // Format: remove unnecessary decimals (e.g. 2.00 -> 2, 2.50 -> 2.5)
    const formattedQty = parseFloat(newQty.toFixed(2)); 
    
    const qtyUnit = unit ? `${formattedQty}${unit}` : `${formattedQty}`;
    return `${qtyUnit} ${name}`;
  });
}

/**
 * Extract all ingredients from text to build/verify the frontmatter list.
 */
export function extractIngredients(text: string): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  let match;
  // Reset lastIndex because regex is global
  const regex = new RegExp(INGREDIENT_REGEX);
  
  while ((match = regex.exec(text)) !== null) {
    const [_, name, qty, unit] = match;
    ingredients.push({
      name: name.trim(),
      quantity: parseFloat(qty) || 0,
      unit: unit ? unit.trim() : '',
    });
  }
  return ingredients;
}

/**
 * Parses a single ingredient line string into a ParsedIngredient object.
 * Logic extracted from importer.ts for reuse.
 * Example: "200g flour" -> { quantity: 200, unit: 'g', name: 'flour' }
 */
export function parseIngredientLine(line: string): ParsedIngredient {
    // Simple parser: "200g flour" -> qty: 200, unit: g, name: flour
    // Very basic regex to look for (Number/Fraction)(Chars)(Space)(Rest)
    const match = line.match(/^([\d\.\/\s]+)?([a-zA-Z]+)?\s+(.*)/);
    if (match) {
        return {
            quantity: parseFloat(match[1]) || 0,
            unit: match[2] || '',
            name: match[3] || line, 
        };
    }
    return { name: line, quantity: 0, unit: '' };
}
