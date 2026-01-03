# Development Tasks for Family Recipes App

## Phase 1: Project Setup & Infrastructure
- [x] **Initialize Next.js Project**
  - Create a new Next.js app using App Router (`npx create-next-app@latest`).
  - Configure TypeScript.
  - Setup absolute imports (alias `@/*` to `./src/*`).
- [x] **Install Dependencies**
  - UI: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.
  - Data/Utils: `gray-matter` (for YAML frontmatter), `fuse.js` (search), `uuid` (for unique IDs if needed).
  - Parsing: `cheerio` (for HTML scraping), `iso8601-duration` (for parsing recipe time).
- [x] **Theme Configuration**
  - Set up a Material UI Theme Registry for Next.js App Router (requires a specific client-side cache provider wrapper).
  - Define a custom Material 3 theme (colors, typography) in `src/styles/theme.ts`.
- [x] **File System Setup**
  - Create directory `data/recipes` in the project root.
  - Create directory `public/images/uploads`.
  - Add `data/recipes/*.md` to `.gitignore` (optional, depends if user wants to commit recipes, but usually data is separate. *Clarify if recipes should be git-tracked*).

## Phase 2: Core Libraries (The "Brain")
- [x] **Markdown Service (`src/lib/recipes.ts`)**
  - `getRecipes()`: Function to read all `.md` files in `data/recipes`, parse frontmatter, and return a list.
  - `getRecipe(slug)`: Function to read a specific file.
  - `saveRecipe(slug, data)`: Function to write frontmatter + content back to the file system.
- [x] **"Cooklang-Lite" Parser (`src/lib/parser.ts`)**
  - Create a regex/parser to identify ingredients in text: `@ingredient{qty%unit}`.
  - Implement `parseIngredient(tag)`: Returns `{ name, quantity, unit }`.
  - Implement `scaleRecipe(text, multiplier)`: Returns text with quantities multiplied by the factor.
- [x] **Importer Engine (`src/lib/importer.ts`)**
  - `fetchRecipeFromUrl(url)`: Main entry point.
  - **Strategy 1 (YouTube):**
    - Detect standard YouTube URLs.
    - Fetch oEmbed or metadata (title, description, thumbnail).
    - Parse description for potential ingredients.
  - **Strategy 2 (Web Scraper):**
    - Fetch HTML.
    - Parse `application/ld+json` blocks looking for `@type: "Recipe"`.
    - Map JSON-LD fields to our Frontmatter structure.
    - **Crucial:** Convert HTML instructions to Markdown and attempt to regex-match ingredients to create `@tag{qty%unit}` format.

## Phase 3: API Routes (Backend)
- [x] **Recipe Management APIs**
  - `GET /api/recipes`: Returns list for search.
  - `GET /api/recipes/[slug]`: Returns full detail.
  - `POST /api/recipes`: Saves a new recipe (receives JSON, writes MD file).
  - `PATCH /api/recipes/[slug]`: Updates specific fields (used for Notes and Image updates).
- [x] **Import API**
  - `POST /api/import`: Accepts `{ url }`, runs the Importer Engine, returns the parsed draft (does NOT save yet, lets user review first).
- [x] **Image Upload API**
  - `POST /api/upload`: Accepts a file (multipart/form-data), saves it to `public/images/uploads`, returns the public URL.

## Phase 4: Frontend - Discovery & Navigation
- [x] **App Layout**
  - Create a responsive Navbar/AppBar.
  - Add "Add Recipe" FAB (Floating Action Button).
- [x] **Search Logic (`src/hooks/useSearch.ts`)**
  - Fetch all recipe metadata on load.
  - Initialize `Fuse.js` instance.
  - Expose `search(query)` function.
- [x] **Home Page (`src/app/page.tsx`)**
  - Search Input (sticky top).
  - Filter Chips (horizontal scroll).
  - `RecipeList` component displaying grid/list of `RecipeCard`s.
- [x] **Recipe Card Component**
  - Display Title, Image, Duration, and Chips.

## Phase 5: Frontend - Recipe View & Interaction
- [x] **Recipe Detail Page (`src/app/recipe/[slug]/page.tsx`)**
  - **Header:**
    - Logic to display `video` (YouTube embed), `image` (Next/Image), or `placeholder` (Camera Icon).
    - "Take Photo" button implementation:
      - Input `type="file" accept="image/*" capture="environment"`.
      - On change -> upload to API -> update local state & trigger recipe update.
  - **Controls:**
    - Servings Stepper (Integer state `servings`, default to `yield`).
    - Share Button: Use `navigator.share()` if available, fallback to `navigator.clipboard.writeText()`.
  - **Tabs:**
    - **Ingredients:** Render list calculated by `base_qty * (servings / base_yield)`.
    - **Directions:** Render markdown. Use the `scaleRecipe` util to display correct numbers in text.
    - **Notes:** Textarea field. Auto-save (debounce) or "Save" button to write to frontmatter.
- [x] **Cooking Mode**
  - "Start Cooking" toggle.
  - `useEffect` hook to call `navigator.wakeLock.request('screen')`.
  - Handle visibility change (re-request lock if user tabs out and back).

## Phase 6: Frontend - Import Flow
- [x] **Import Page (`src/app/import/page.tsx`)**
  - Simple input field for URL.
  - Loading state (spinner) while API fetches.
- [x] **Review/Edit Screen**
  - Once data returns from API, show a form with pre-filled fields.
  - Allow user to fix Title, adjust parsed Ingredients, or edit the Markdown body before saving.
  - "Save" button -> `POST /api/recipes` -> Redirect to new recipe.

## Phase 7: Polish & PWA
- [x] **PWA Manifest**
  - Create `public/manifest.json`.
  - Add icons (192x192, 512x512).
- [x] **Testing**
  - Verify scaling math on edge cases (fractions, no units).
  - Verify YouTube imports work for generic video descriptions.

## Phase 8: Enhancements
- [x] **Recipe Editing (Detail View)**
    - Add "Edit" button to Recipe Detail page.
    - Create a form (similar to Import Review) to edit Title, Yield, Ingredients, and Instructions.
    - Wire up `PATCH` or `PUT` to update the markdown file.
- [x] **Global Navigation**
    - Ensure a "Home" / "Family Recipes" logo link is present in the Header/AppBar on all pages.
    - Verify `RecipeDetailView` and `ImportPage` have clear paths back to `/`.
- [x] **Metric Conversion System**
    - Create `src/lib/converter.ts` or update `importer.ts`.
    - Detect Imperial units (oz, lb, cup, pint, quart, gallon, inch).
    - Convert to Metric (g, ml, cm).
    - Rule: Keep `tsp`, `tbsp` as is.
    - Apply this transformation during the Import process (before saving).
