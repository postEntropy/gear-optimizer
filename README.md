# Gear Optimizer - Material 3 Edition ✨

A modernized, high-performance fork of the original **Gear Optimizer** for NGU Idle. Redesigned with **Material 3 Expressive** aesthetics and powered by a lightning-fast React engine.

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![MUI](https://img.shields.io/badge/MUI-%23007FFF.svg?style=flat&logo=mui&logoColor=white)](https://mui.com/)

🔗 **[Live Demo (GitHub Pages)](https://postEntropy.github.io/gear-optimizer)**

---

## 🎨 Material 3 Revamp
We've completely overhauled the UI to align with Google's **Material 3 Expressive** design system.
- **Dynamic Color Engine**: Choose your vibe with themes like **Forest (Default)**, Lime, Slate, Purple, and more.
- **Dark & Light Modes**: Fully supported with smooth transitions and optimized contrast.
- **Expressive Aesthetics**:
  - Rounded corners and elevated surfaces.
  - "Ghost Pill" navigation with sliding animations.
  - Custom "Starburst" loading indicators.

## ⚡ Performance Boost
Optimization isn't just about gear—it's about the app too.
- **Vite Powered**: Instant startup and hot reloading.
- **React Router v6**: Modern, declarative routing.
- **Debounced Saves**: No more input lag. State saving is handled asynchronously to keep the UI buttery smooth.
- **Code Splitting**: Heavy components load only when you need them (`React.lazy` & `Suspense`).
- **Memoized Computing**: Complex calculations are isolated to prevent unnecessary re-renders.

## 🚀 Key Features
### 🛒 Gear Optimization
- Calculate the mathematically perfect loadout for your current stats.
- Supports all factors: Power, Toughness, NGU Speed, Gold Drops, etc.

### 📈 Progression Tools
- **NGUs & Hacks**:
  - **Sorting by Efficiency**: See exactly which upgrade gives the best ROI.
  - **Percentage Change**: Visual indicators for marginal gains.
  - **Reachable Levels**: Predicts where you'll land after a rebirth.
- **Augments & Wishes**: integrated calculators for optimal spending.

### 🛠 UX Improvements
- **Advanced Modifiers**: Integrated seamlessly into the main dashboard (no more popups!).
- **Page Transitions**: Smooth fade and slide animations between tabs.
- **Context Preservation**: Refreshing the page keeps you exactly where you were.

---

## 💻 Running Locally

1.  **Clone the repo**
    ```bash
    git clone https://github.com/postEntropy/gear-optimizer.git
    cd gear-optimizer
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn
    ```

3.  **Start the Dev Server**
    ```bash
    npm start
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

---

## Credits
Based on the original [Gear Optimizer](https://github.com/gmiclotte/gear-optimizer) by **gmiclotte**.
Refactored and stylized by **postEntropy**.
