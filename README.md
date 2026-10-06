# Portfolio

Personal landing page for Vishvajit S. Static HTML, CSS and JS with no build step.

Vault note: `Obsidian Vault/Projects/Portfolio Website.md`

## Files

| Path | What it is |
|---|---|
| `index.html` | All page content |
| `css/styles.css` | Colours, type and layout. Colours are tokens at the top of the file (`--accent` changes the highlight colour everywhere) |
| `js/main.js` | Smooth scroll and scroll animations (GSAP ScrollTrigger, Lenis). `POSES` sets where the 3D drone sits in each section |
| `js/drone.js` | The 3D quadcopter (three.js), built from primitives in code |
| `resume.pdf` | Copy of `Projects/General/resume/resume.pdf`. Re-copy it whenever the resume changes |
| `assets/projects/` | Project photos (see below) |

Libraries load from pinned CDN versions: GSAP 3.13.0, Lenis 1.1.13, three.js 0.170.0.

## Adding project photos

Drop a JPG with the matching name into `assets/projects/`. It appears in its card automatically, and no code change is needed. Until the file exists, the card shows text only.

| File | Card |
|---|---|
| `iroc-docking.jpg` | Autonomous docking and GPS-denied flight |
| `ster-vis.jpg` | Ster-Vis |
| `amr.jpg` | Stereo-Vision AMR |
| `fixed-wing.jpg` | Fixed-wing aircraft |
| `hybrid-vtol.jpg` | Hybrid VTOL |
| `rover.jpg` | PVC rocker-bogie rover |
| `adsb.jpg` | ADS-B receiver on ESP32 |

Aim for landscape images about 1600 px wide and under 300 kB each.

## Preview locally

ES modules do not load from `file://`, so serve the folder:

```
python -m http.server 8080
```

Then open http://localhost:8080.

## Accessibility and fallbacks

- With `prefers-reduced-motion`, there is no pinning, scrubbing or smooth scroll, and the drone stays still in the hero.
- If the CDN scripts fail, the page falls back to a plain vertical layout with all content visible.
- If WebGL is unavailable, the drone canvas is hidden.

## Deploy (GitHub Pages)

1. Create a repo named `vixhvajit.github.io` and push this folder to `main`.
2. Under Settings, then Pages, set the source to "Deploy from a branch", `main`, `/ (root)`.
3. The site is served at https://vixhvajit.github.io.
