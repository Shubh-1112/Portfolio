# Portfolio – Copilot Instructions

## Project Overview
Static personal portfolio for **Shubham Dey (AI Engineer)**. Entry point is `load.html` (loading screen), main content is `index.html`. No build step — open with Live Server or `python3 -m http.server 8000`.

## Architecture
- `load.html` → slice-wipe transition → `index.html`
- `styles.css` — all design tokens, responsive breakpoints, glassmorphic dark theme
- `main.js` — GSAP animations, Lenis smooth scroll, horizontal scroll reel (Work section), mobile nav
- `Assets/projects/` — project screenshots/images referenced in the Work section

## Key Conventions
- **No framework, no build tool** — plain HTML/CSS/JS only
- Animations use **GSAP** (loaded via CDN); smooth scroll uses **Lenis**
- The Work section (`#projects`) uses a custom horizontal scroll mapped to vertical scroll; adding a project requires:
  1. Adding a `.project-item` card with `data-index="N"` inside `.projects-grid`
  2. Updating the `.counter-total` span to match the new count
- Project images go in `Assets/projects/` and are referenced as background-images on `.project-image-inner`
- About section title is `.about-title` inside `.about-text-wrapper`

## Sections in index.html
| Section | ID / Class |
|---------|-----------|
| Hero | `#hero` |
| About | `#about` |
| Work / Projects | `#projects` |
| Skills | `#skills` |
| Hobbies | `#hobbies` |
| Contact | `#contact` |

## Do Not
- Introduce npm, bundlers, or frameworks
- Add inline `<style>` blocks — all styles belong in `styles.css`
- Hardcode pixel values for responsive elements — use CSS custom properties or `clamp()`
