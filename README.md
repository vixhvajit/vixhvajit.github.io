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
| `assets/projects/` | Project photos (see below) |

Libraries load from pinned CDN versions: GSAP 3.13.0, Lenis 1.1.13, three.js 0.170.0.

## Adding project photos

Drop a JPG with the matching name into `assets/projects/`. It appears in its card automatically, and no code change is needed. Until the file exists, the card shows text only.

| File | Card |
|---|---|
| `iroc-docking.jpg` | Autonomous docking and GPS-denied drone (featured panel and project card) |
| `ster-vis.jpg` | Ster-Vis (featured panel and project card) |
| `amr.jpg` | Stereo-Vision AMR (featured panel and project card) |
| `fixed-wing.jpg` | Fixed-wing aircraft |
| `hybrid-vtol.jpg` | Hybrid VTOL |
| `quanta-link.jpg` | Quanta-Link |
| `fhss.jpg` | Anti-jam FHSS link on an FPGA |
| `coax.jpg` | Coaxial monocopter |
| `nidar-2027.jpg` | NIDAR 2027 indoor SLAM drone |
| `sih.jpg` | SIH 2026 search-and-rescue drone |

Aim for landscape images about 1600 px wide and under 300 kB each.

`assets/field/` holds the photos used across the page: `me-hero.webp` in the hero (a studio portrait cut off its grey backdrop, with transparency, so it blends into the page), the IndiaSkills, RPC and Aerothon competition cards, the Pilot section, and About. They were cropped from Instagram story screenshots (app UI, captions and stickers removed) and given a light, slightly cool grade so they match the page. They are low resolution (576 px wide, from the phone screenshots), so replacing them with the original photos will look sharper. Keep the file names, and update the `width`/`height` attributes in `index.html` if the aspect ratio changes.

## Preview locally

ES modules do not load from `file://`, so serve the folder:

```
python -m http.server 8080
```

Then open http://localhost:8080.

## Projects section

Each card in the Projects section has `data-status="done"` (Completed tab) or `data-status="current"` (Current tab). The status badge text is free-form, such as "Released v2.1.0" or "In design". The tab counts update automatically, so moving a project from current to completed is a two-attribute edit: `data-status` and the badge class (`status--done` or `status--current`).

## Accessibility and fallbacks

- With `prefers-reduced-motion`, there is no pinning, scrubbing or smooth scroll, and the drone stays still in the hero.
- If the CDN scripts fail, the page falls back to a plain vertical layout with all content visible.
- If WebGL is unavailable, the drone canvas is hidden.

## Deploy (GitHub Pages)

1. Create a repo named `vixhvajit.github.io` and push this folder to `main`.
2. Under Settings, then Pages, set the source to "Deploy from a branch", `main`, `/ (root)`.
3. The site is served at https://vixhvajit.github.io.
