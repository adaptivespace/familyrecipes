# Plan for Family Recipes Mobile Webapp

## 1. Purpose
To create a "Family Recipes" application that serves as a central, interactive digital cookbook. It bridges the gap between discovering recipes online and cooking them in a real kitchen environment. Key goals are ease of import, discoverability, and practical utility during cooking (scaling and screen management).

## 2. Architectural Principles & Technology Stack

### A. Core Architecture: Progressive Web App (PWA)
We will build a **Progressive Web App** using **Next.js (React)**.
- **Why?** Next.js handles both the frontend UI and the backend API routes needed for fetching URLs and saving files to the server. It supports PWA features (manifest, service workers) allowing installation on mobile devices.
- **Styling:** **Material UI (MUI)** with Material 3 design tokens. This ensures a modern, mobile-first aesthetic with minimal custom CSS.

### B. Data Storage: "Flat-File" Database
- **Format:** Markdown (`.md`) files.
- **Location:** Stored in a `data/recipes` directory on the server/filesystem.
- **Structure:**
  - **Frontmatter (YAML):** Stores structured metadata: `title`, `tags` (themes), `ingredients` (list with name, quantity, unit), `yield` (servings), `source_url`, `youtube_id`, `notes` (personal additions/tips).
  - **Body:** The instructions in Markdown format.
- **Why?** Portable, human-readable, version-controllable (git), and meets the user's request for markdown storage.

### C. The "Better Idea" for Flexible Ingredients
Instead of complex templating logic inside the instruction text, we will use a **Reference & Highlight** system.
1.  **Structured Ingredients:** Ingredients are stored in the Frontmatter as a structured list (Name, Quantity, Unit). This allows exact math for the shopping list/ingredient view.
2.  **Instruction Highlighting:** In the instructions text, we will simply write the instructions naturally.
    - *Option A (Simple):* The UI will simply display the instructions. The user refers to the scaled ingredient list on the side/top.
    - *Option B (Smart):* We use a lightweight syntax like `{{qty}}` or adopt the **Cooklang** recipe syntax (e.g., `Add @milk{1%cup}`) which is designed specifically for this.
    - **Recommendation:** We will use a **simplified Cooklang-style syntax** for the markdown body.
      - Example: "Mix @flour{200%g} and @sugar{100%g}."
      - The parser will extract these tags to build the ingredient list automatically (input side).
      - The UI will render them as interactive, scalable numbers (output side).

## 3. Key Features & Engineering Choices

### Input Side: The "Smart Clipper" & YouTube Importer
- **Mechanism:** An API route `/api/import` that accepts a URL.
- **Logic for Webpages:**
  1.  Fetch the HTML.
  2.  Parse for **Schema.org/Recipe** JSON-LD (standard on almost all major recipe sites like NYT Cooking, AllRecipes, BBC Food).
  3.  If found, extract name, yield, ingredients, and instructions.
  4.  Convert HTML instructions to Markdown.
  5.  **Auto-Template:** Attempt to match ingredient quantities in instructions and wrap them in our scaling syntax automatically.
  6.  Save as `slug-name.md`.
- **Logic for YouTube:**
  1.  Detect YouTube URL.
  2.  Fetch video metadata (Title, Description, Thumbnail).
  3.  **Description Parsing:** Attempt to extract ingredients and instructions from the video description (where they are commonly placed).
  4.  **Fallback:** If no clear recipe structure is found in the description, save the video ID and Title, and create a placeholder body "Watch video for instructions".
  5.  Save `youtube_id` in frontmatter.

### Output Side: Discovery & View
- **Search:** A "Search" page with a unified bar.
  - **Technology:** `Fuse.js` for fuzzy searching across titles, tags, and ingredient lists client-side (fast and responsive).
  - **Filters:** Chips for common tags (Asian, Dessert, Quick).
- **Recipe View (Material 3):**
  - **Header:** Hero image (if available), **Embedded YouTube Player** (if `youtube_id` exists), or a **"Take Photo" placeholder**.
    - **Photo Capture:** If no image exists (or to replace one), users can tap a button to take a picture using the device camera (utilizing HTML5 `capture="environment"`). The image is uploaded to the server (`/public/images`) and the markdown frontmatter is updated.
    - **Share:** A generic "Share" button utilizing the **Web Share API** (`navigator.share`) to invoke the native mobile share sheet (text, email, copy link) with the recipe's public URL.
  - **Controls:** A "Servings" stepper (-/+) that defaults to the recipe's original yield.
  - **Ingredients Tab:** calculated based on the current serving multiplier.
  - **Instructions Tab:** Text where quantities are dynamically scaled based on the multiplier.
  - **Notes Tab/Section:** A collaborative-style text area to view and edit personal notes (stored in the recipe's Frontmatter `notes` field). This allows capturing adjustments, family reviews, or tips for next time.

### Cooking Mode
- **Screen Wake Lock API:** We will use the native browser `navigator.wakeLock` API.
- **UI:** A floating action button (FAB) or toggle in the recipe view to "Start Cooking Mode", which requests the wake lock and perhaps increases font size/contrast.

## 4. Development Phases

1.  **Setup:** Initialize Next.js, Material UI, and file storage utilities.
2.  **Core Logic:** Implement the Markdown parser/writer and the "Scaler" logic.
3.  **UI Construction:** Build the Layout, Recipe Card, and Recipe Detail View.
4.  **Importer:** Build the scraper/converter engine.
5.  **Refinement:** Add Search, Cooking Mode, and PWA manifest.

## 5. File Structure
```
/
├── data/recipes/       # Markdown storage
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # UI Components (RecipeCard, Scaler, SearchBar)
│   ├── lib/            # Utilities (markdown parser, recipes import logic)
│   └── styles/         # Theme configuration
├── public/             # Static assets
└── package.json
```
