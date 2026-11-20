[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/f18574141141-coder/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/f18574141141-coder/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

Turn any photo into multi-panel GTA-style cover art and export it as a PNG — fully offline, in your browser, no uploads.

## What it does

- **4 layouts**: Vice Grid (hero + 3 panels), Sunset Strip (3 vertical panels), Neon Trio (3 horizontal bands), Solo (full-bleed).
- **Any photo**: add up to 4 photos from your machine (file picker or drag & drop). Click a library thumbnail to put it in the selected panel, or use one photo across all panels with a different crop in each.
- **Crop & position per panel**: click a panel to select it, drag on the canvas to pan its photo, zoom 100–300%, reset fit.
- **Caption**: title (auto-wraps to 2 lines) + subtitle, top or bottom, in bold condensed Anton lettering (SIL OFL, shipped under `app/fonts/`) with a dark outline and warm gradient fill.
- **4 colour grades**: Vice Sunset, Neon Nights, Palm Dusk, Mono Noir — translucent washes plus a scrim so the caption stays readable.
- **Decorations**: an original setting-sun disc, palm silhouettes and a lit skyline, all drawn with canvas paths. No Rockstar logos, artwork, characters or fonts.
- **Export sizes**: 1080×1080, 1080×1350, 1920×1080 — one click saves `vice-cover-<W>x<H>.png`.

Photos are read only on your machine (FileReader / object URLs) and never uploaded. The app is plain static files under `app/` with no build step and no network requests.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
