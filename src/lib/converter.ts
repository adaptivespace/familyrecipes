
// Map of imperial unit names to their canonical key
const UNIT_MAP: Record<string, string> = {
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',
  'cup': 'cup', 'cups': 'cup',
  'pt': 'pt', 'pint': 'pt', 'pints': 'pt',
  'qt': 'qt', 'quart': 'qt', 'quarts': 'qt',
  'gal': 'gal', 'gallon': 'gal', 'gallons': 'gal',
  'in': 'in', 'inch': 'in', 'inches': 'in',
  'ft': 'ft', 'foot': 'ft', 'feet': 'ft',
  'fahrenheit': 'f', 'f': 'f'
};

// Conversion factors to Metric
// solids: oz->g, lb->g
// liquids: cup->ml, pt->ml, qt->ml, gal->l
// length: in->cm
// temp: f->c
const CONVERSIONS: Record<string, (val: number) => { val: number, unit: string }> = {
  'oz': (val) => ({ val: Math.round(val * 28.3495), unit: 'g' }),
  'lb': (val) => ({ val: Math.round(val * 453.592), unit: 'g' }),
  'cup': (val) => ({ val: Math.round(val * 236.588), unit: 'ml' }), // Standard US cup
  'pt': (val) => ({ val: Math.round(val * 473.176), unit: 'ml' }),
  'qt': (val) => ({ val: Math.round(val * 946.353), unit: 'ml' }),
  'gal': (val) => ({ val: parseFloat((val * 3.78541).toFixed(2)), unit: 'l' }),
  'in': (val) => ({ val: parseFloat((val * 2.54).toFixed(1)), unit: 'cm' }),
  'f': (val) => ({ val: Math.round((val - 32) * 5/9), unit: 'c' }),
};

export function convertToMetric(text: string): string {
  // Regex to find number + unit
  // Looks for: (number) (space)? (unit)
  // We need to be careful not to match things that aren't units.
  // Boundary \b is useful.
  
  // Pattern: (\d+(\.\d+)?) \s* (unit) \b
  // But we also need to handle fractions like "1/2 cup" -> 0.5 cup
  
  return text.replace(/(\d+(?:\s*\/\s*\d+)?|(?:\d*\.\d+))\s*([a-zA-Z]+)\b/gi, (match, numberStr, unitStr) => {
    const unitKey = unitStr.toLowerCase();
    const canonicalUnit = UNIT_MAP[unitKey];

    if (!canonicalUnit || !CONVERSIONS[canonicalUnit]) {
      return match; // Not a target unit
    }

    // Parse number (handle fractions)
    let qty = 0;
    if (numberStr.includes('/')) {
      const [num, den] = numberStr.split('/').map((n: string) => parseFloat(n.trim()));
      qty = den ? num / den : 0;
    } else {
      qty = parseFloat(numberStr);
    }

    if (isNaN(qty)) return match;

    const { val, unit } = CONVERSIONS[canonicalUnit](qty);
    return `${val} ${unit}`; // Reconstruct string: "200 g" (we use space usually)
  });
}

/**
 * Specifically converts the parsed ingredient object if needed.
 */
export function convertIngredient(ing: { quantity: number, unit: string, name: string }) {
    const canonicalUnit = UNIT_MAP[ing.unit.toLowerCase()];
    if (canonicalUnit && CONVERSIONS[canonicalUnit]) {
        const { val, unit } = CONVERSIONS[canonicalUnit](ing.quantity);
        return { ...ing, quantity: val, unit: unit };
    }
    return ing;
}
