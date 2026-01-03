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
    
    const unitStr = unit ? `${unit} ` : ''; // Add space if unit exists? 
    // Usually "200g" (no space) or "2 cups" (space)? 
    // Let's assume the user puts space in unit if they want it? 
    // Or we format: number + unit + space + name.
    // "400g flour" vs "2 eggs".
    
    // Let's try to be smart: if unit is long (>2 chars), maybe space? 
    // "200g" vs "2 cups".
    // For now, let's just output `qty` + `unit` + ` ` + `name`.
    // Wait, if unit is empty, we don't want extra space.
    
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
