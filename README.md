# DSA Mastery Tracker (Web)

Static web app to learn & track DSA deeply (C++ focus).  
**Features**: 30-week roadmap, 500+ problems (LeetCode + GFG), STL reference, concepts, localStorage progress.

## Run locally
Open `index.html` in a static server (or deploy to GitHub Pages). Fetching `data/*.json` requires HTTP, not file:// in some browsers.

## Deploy to GitHub Pages
1. Upload all files to your repo (root).
2. Go to **Settings → Pages**, set Source to `main` branch, `/ (root)`.
3. Open: https://tanujay-s.github.io/dsa-tracker/

## Data format
- `data/roadmap.json` – 30 weeks
- `data/problems.json` – 500+ problems (Topic, Problem, Platform, Difficulty, Link)
- `data/concepts.json` – concept blurbs
- `data/stl.json` – practical STL
