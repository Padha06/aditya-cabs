# claims - surface: share (mobile conversion loop)

- Mode: REDESIGN-Preserve. Medium: mobile web (390x844) + desktop (1360x900).
- DESIGN_VARIANCE: 6 / MOTION_INTENSITY: 4 / VISUAL_DENSITY: 5
- System: locked brand tokens (Sora + Plus Jakarta Sans + Mukta for Devanagari, one amber accent, --r-card 20px / --r-ctl 12px / pills, light theme). No new family.
- Framings: mobile 390x844 (share top, share board), desktop 1360x900 (share top).
- Run-to-prove: anti-slop-gate.mjs + contrast-gate.mjs on index.html, share.html, profile.html, styles.css, app.js; render via playwright-cli at both framings; console clean.

## Render
- Framings: mobile 390x844 (share top), desktop 1360x900 (share top).
- Tool: playwright-cli (node @playwright/cli entry, system Chrome session).
- Shots: render/mobile-390.png, render/desktop-1360.png.
- Checks: hero/title fits viewport, no horizontal overflow, primary CTA (Post my trip) one line, content not clipped.
- Console: clean (0 errors, 0 warnings).
