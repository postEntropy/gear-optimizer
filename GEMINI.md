# Gemini CLI - Contextual Instructions

This file provides foundational context for Gemini CLI when interacting with the **Gear Optimizer** project.

## Project Overview
**Gear Optimizer** is a high-performance React-based web application designed to optimize equipment loadouts for the game *NGU Idle*. It is a modernized fork of the original optimizer, featuring a sleek Material UI (MUI) interface, real-time "Live Sync" via a game mod, and advanced projections for NGU and Hack growth.

### Core Technologies
- **Frontend**: React 18, Vite, Material UI (MUI) v5, Recharts.
- **State Management**: Redux Toolkit, Redux-Saga.
- **Performance**: Heavy mathematical computations (optimization algorithms) are offloaded to **Web Workers** (`src/sagas/optimize.worker.js`).
- **Integration**: 
  - **C# (BepInEx)**: A mod (`build_mod/`) that enables real-time data syncing from the game to the web app.
  - **Python/Bash**: Scripts in `data/` for decoding game saves and gathering item data.

## Project Structure
- `src/`: Main application source.
  - `actions/` & `reducers/`: Redux logic (using `@reduxjs/toolkit`).
  - `sagas/`: Orchestrates Web Workers and async side effects.
  - `components/` & `containers/`: UI architecture.
  - `utils/`: Core scoring logic (`scoring.js`) and game-specific formatting.
  - `assets/`: Item databases (`Items.js`) and images.
- `data/`: Utility scripts for processing game data and saves.
- `build_mod/`: Source code for the `NGULiveSync` C# mod.
- `public/`: Static assets, including the pre-compiled `NGULiveSync.dll`.

## Building and Running

### Development
```bash
npm install
npm start        # Starts the Vite development server
```

### Production & Testing
```bash
npm run build    # Generates a production build in /dist (or /build)
npm run preview  # Previews the production build locally
npm test         # Runs Vitest tests
```

### Deployment
```bash
npm run deploy   # Deploys the application to GitHub Pages
```

## Development Conventions

### State & Logic
- **Slices**: Use Redux Toolkit's `createSlice` for state mutations (found in `src/reducers/optimizerSlice.js`).
- **Immutability**: While RTK uses Immer, ensure complex state transitions (like adding/removing slots) are handled safely.
- **Workers**: Do not perform heavy loops or optimization logic on the main thread; use the Saga/Worker pattern established in `src/sagas/`.

### UI & Styling
- **MUI**: Adhere to the Material UI v5 components and system.
- **Theming**: Use the custom theme definitions in `src/theme.js` and `src/themeColors.js`.
- **Responsive Design**: The application uses a glassmorphism aesthetic; maintain consistency with existing `App.css` styles.

### Domain Logic
- **Scoring**: Gear scores are calculated in `src/utils/scoring.js`. Any changes to stat weights or hardcaps must be verified against game mechanics.
- **Formatting**: Use `src/utils/formatting.js` for game-style number abbreviations (K, M, B, T, etc.).

## Integration Notes
- **Live Sync**: The web app listens for data via a socket or local server provided by the C# mod. Changes to the data structure in `optimizerSlice` may require corresponding updates in `NGULiveSync.cs`.
- **Data Gathering**: If the game adds new items, use the scripts in `data/` to regenerate `src/assets/Items.js`.
