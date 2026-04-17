# Watercolor wash generator

Local-only build-time CLI. Reads `manifest.json`, calls Hedra, writes assets to
`public/assets/decor/`.

## Prereqs

1. System binaries: `cwebp`, `ffmpeg` on PATH (install via `brew install webp ffmpeg`).
2. Python + rembg: `pip install -r requirements.txt` (one-time ~176MB model download on first run).
3. Copy `.env.local.example` to `.env.local` and fill in `HEDRA_API_KEY=…`.

## Common commands

```bash
npm --prefix scripts/washes install        # once
npm run washes -- --estimate               # print prompts + cost, no API calls
npm run washes -- --only hero              # regenerate one section
npm run washes                             # full regen with dry-run confirmation
```

See `docs/superpowers/specs/2026-04-17-hedra-watercolor-pipeline-design.md` for the full design.
