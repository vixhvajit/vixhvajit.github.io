# portfolio — personal landing page

Implementation only. Status and the domain decision live in the vault note
`Projects/Portfolio Website.md`. Repo:
https://github.com/vixhvajit/vixhvajit.github.io

A static site with no build step, served by GitHub Pages from `main` at
https://vixhvajit.github.io. `README.md` maps the files, the photo slots,
the project-card status attributes and the fallbacks.

## Working here

- Preview with `python -m http.server 8080`, then open http://localhost:8080.
  ES modules do not load from `file://`.
- **Pushing to `main` publishes the live site.** Check the page locally
  before every push.
- Libraries load from pinned CDN versions (GSAP 3.13.0, Lenis 1.1.13,
  three.js 0.170.0). Bump them deliberately, never by accident.
- Keep the reduced-motion, no-WebGL and CDN-failure fallbacks working.

## Content rules

- The public contact email is svishvajit@gmail.com. Never use the Claude
  account email. GitHub handle: `vixhvajit`.
- Leave school-level (Class X/XII) results off. College and CGPA only.
- The look is showcase-grade with scroll-driven motion (pinned sections, a
  3D drone) on a light theme. Keep new sections in that style.
- The user is a DGCA-certified remote pilot (small class). The Pilot section
  covers that.
