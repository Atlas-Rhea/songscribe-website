# Break the feature-section monotony and add delight (review item #5)

## Context
The homepage's seven feature sections all have the same shape: copy on one side, a still phone screenshot on the other, with the sides alternating. The page has almost no motion (no hero entrance, no moments), so it reads as a template.

The user asked to learn from tasteskill.dev and the taste skill, and chose the **Recompose** approach:
- real app screen recordings inside the phones
- four distinct section layouts
- two delight moments
- a hero entrance

Lessons from tasteskill.dev:
- **The visual does the job.** Each feature's picture is a working mini-interface on a loop. For us, that means the real screen recordings we already ship for the guide.
- **A pinned drum list.** The section holds still while scrolling rolls a cylinder of names. The active name is in the accent colour, with an "n of N" counter.
- **A pinned stepper.** Steps are listed beside one frame, and the frame changes for each step.

Taste-skill rules that bind (`~/.claude/skills/design-taste-frontend/references/motion.md`, `moments.md`):
- Motion lives in three places only:
  - a one-time hero entrance
  - at most **two** moments, each in its own section
  - the hover/press layer
- No scroll reveals.
- Anything that moves for longer than 5 s gets a pause control.
- Under reduced motion everything rests and nothing stays hidden.
- On phones, nothing is pinned.

User decisions so far:
- Recompose, not just animate.
- Copy may be rewritten freely within `facts.md` and the brand voice (memory: feedback-copy-freedom).

## Target page (desktop, top to bottom)
| # | Section | Layout | Visual | Motion |
|---|---|---|---|---|
| 0 | Hero | as today | phone, editor shot | **entrance on load**: h1, then subtitle and CTAs, then the phone settles (~1.1 s, once) |
| 1 | Editor `#features` | split, copy left | phone plays `qs-chord-drag.mp4` (4.8 s) | clip loops while in view, pause button |
| 2 | Offline (cream) | **statement**: very large centred headline, subtitle under it, no phone | none | none |
| 3 | Chords | **pair**: centred copy above two phones side by side, tops aligned | `03-chord-picker` + `10-fretboard-diagram` (new on the page) | hover only |
| 4 | **Setlist (new)** | **moment 1, setlist drum**: pinned for ~2 screens; the "Friday Night" set rolls on a cylinder as you scroll, active song in amber with its numbered badge, "2 of 5" counter | HTML list of the real demo set: Paper Lanterns, Slow Train Home, Kitchen Radio, Low Tide, Morning Sketch | scroll-driven, inside its own section only |
| 5 | Stage (dark) | split, **phone left** | phone plays `perf-autoscroll.mp4` | clip in view, pause button |
| 6 | Recording | split, copy left | phone plays `rec-marker-drop.mp4` | clip in view, pause button |
| 7 | Tools (cream) | **moment 2, pinned chapters** (taste kit), ~2 screens: steps Tuner, Metronome, Harmony at left, one phone at right that crossfades between their **stills** | guide shots `tun-03-tuner-in-tune`, `met-01-metronome`, `har-02-chord-tapped` | the crossfade itself, scroll-driven |
| 8 | Export | **paper**: the real exported lead sheet, cropped from `exp-03-pdf-musician` and shown as a flat sheet (no tilt), format row "PDF · ChordPro · ASCII · Plain text" under it, no phone | new crop webps | hover only |
| - | Details accordion, Pricing, Footer | unchanged | | |

This gives four distinct compositions (split, statement, pair, paper) plus two moments, instead of seven repeats. No two neighbouring sections share a shape.

**Phones (≤1023px wide, or under 640px tall, as the kit decides):**
- Nothing is pinned.
- The drum becomes a static numbered list with song 1 highlighted.
- The Tools steps stack, each with its own small phone still.
- The pair stacks into one phone plus a smaller second phone.

**Reduced motion:**
- No entrance and no autoplay. Posters show, with the play button available.
- The drum and the chapters render as static lists.

## Copy (my calls under copy freedom, checked against `facts.md` and the guide)
- **Setlist headline:** "Line up the whole night."
- **Setlist subtitle:** "Tap songs into a setlist, hold and drag to reorder, then press play. Setlists and Performance mode are free."
  - Facts: tap to add, hold and drag to reorder, the play button starts Performance mode, and both are free.
- **Tools steps** (a title plus two lines each, from guide pages 12-14):
  - Tuner: Chromatic, Guitar, Bass, Vocal and Violin modes.
  - Metronome: tempo and time signature saved per song.
  - Harmony: tap a chord in the key to hear it, then add it to your song.
- **Export format row:** taken from guide `16-export.md`: PDF, ChordPro, ASCII, plain text.
- Existing headlines elsewhere stay unless a layout needs a shorter line.

## Rulings from the stress test (folded into the tasks below)
- **Sticky never pinned on this site.** `main.css:108` and `main.css:123` set `overflow-x: hidden` on `html` and `body`, which turns `body` into a scroll container. Changing both to `overflow-x: clip` makes `position: sticky` work. This was checked on the live guide.
  - Side effect: the guide sidenav (936px tall) starts sticking, so it gets a height cap.
- **Keep the guide's class names.** `.guide-clip` and `.guide-clip__toggle` are emitted by `scripts/build-guide.mjs:115`, asserted by `test-build-guide.mjs:42`, and present in 8 committed pages. The homepage reuses the same classes. Only their CSS moves to `site.css`.
- **One owner for clip wiring.** Guide pages load both `main.js` and `guide.js`. If both wired clips, one click would play and then pause. So `main.js` wires every clip, and `guide.js` keeps only the sidenav code.
- **The Tools chapters use stills, not clips.** The kit sizes only `> img` visuals, and three stacked clips would all count as "in view" and play at once. The crossfade is already the motion.
- **Do not import the kit's motion layer.** It needs the kit's `system.css` and `cards.css` tokens and would restyle every button and link. The hero entrance is written in `site.css` with the kit's hooks (`.hero[data-enter]`, `html.m-enter`, and the 700 ms `m-enter-done` safety class) so the checker recognises it. The site's existing hover layer stays; only the gaps get filled.
- **Stop the decor loops.** The floating notes and quills in `decor.css:465-481` loop forever, which breaks "nothing else moves" and the 5-second pause rule. They rest in their final frame. This is a visible change: the decor stops drifting.
- **The drum is not a dealt kit moment.** It is marked `data-scroll-moment`, not `data-moment`, because the checker FAILs unknown moment ids. It computes its scroll progress itself (a few lines of `getBoundingClientRect` math). Vite can't import `public/` files into bundled code, so it doesn't reuse the kit's `lib.js`.
- **The z-index ladder** is at `site.css:72-81`. The new section pushes Pricing to the 11th section, so rules for 11 and 12 are added and the comment at `decor.css:266-273` is updated.

## Implementation tasks (sequential, because they share `index.html` and `site.css`)
Run with superpowers:subagent-driven-development: one implementer per task, a task review after each, a controller browser check, and one final review.

0. **Design doc.** Save this design as `docs/superpowers/specs/2026-11-23-feature-sections-recompose-design.md`.
1. **Make sticky work.**
   - In `public/assets/css/main.css`, change `html` and `body` from `overflow-x: hidden` to `overflow-x: clip`.
   - Cap `.guide-sidenav` in `guide.css` at `max-height: calc(100svh - <its top> - 1rem)` with `overflow-y: auto`.
   - Check: no sideways scroll at 390px on the homepage, a guide page or /features/, and the guide sidenav sticks and scrolls inside itself.
2. **One clip player.**
   - Move `wireClip`, `wireAutoplay` and `setToggleState` from `src/guide.js` into `src/clips.js`, and call it from `src/main.js` for every `.guide-clip` on any page. `guide.js` keeps only the sidenav.
   - Move the clip CSS from `guide.css` into `site.css`: the video corner radius (~593), the toggle rules (608-659) and their dark rules (935-943).
   - Homepage markup copies the guide's emitted clip markup (see `build-guide.mjs:115`): `<video muted loop playsinline preload="none" poster="/assets/video/guide/<id>.jpg">` inside the `.phone-frame` with its bezel SVG.
   - `src/lightbox.js` already skips frames without `img.phone-frame__screen`; keep it that way.
   - Check: `node scripts/test-build-guide.mjs` passes, and a guide clip plays and pauses with one click.
3. **Hero entrance, and stop the decor loops.**
   - In the inline theme bootstrap in `index.html` (lines ~44-67), add `m-enter` to `<html>` and a 700 ms timer that adds `m-enter-done`. Add `data-enter` to the hero section.
   - In `site.css`, animate the hero's **children** only. `.hero.section { animation: none }` at `site.css:463` would override a rule on `.hero` itself. Order: h1, then subtitle and CTAs, then the phone, using **transform only** so the LCP image isn't delayed.
   - In dark mode, fade the `.hero-copy::before` scrim with the h1 so it doesn't show on its own.
   - All of this is wrapped in `prefers-reduced-motion: no-preference`.
   - Make the `decor.css:465-481` loops rest.
4. **Clips in Editor, Stage and Recording.** Use task 2's markup. Stage moves to phone-left.
5. **Offline statement and Chords pair.**
   - New modifier classes `.feature--statement` and `.feature--pair` in `site.css`, using decor.css tokens.
   - The pair adds `10-fretboard-diagram` (its sm/md/lg webps already exist).
   - Each section stays 1-2 screens tall at 1440x900.
6. **Tools pinned chapters (moment 2), mounted before the drum so sticky is proven on known-good code.**
   - Copy the kit files unchanged: `moments.js`, `lib.js` and `pinned-chapters/` into `public/assets/moments/`. That path is required, because `consistency.mjs:899` checks it.
   - Mount it exactly as `moments.md` and `_demo/in-page-service.html` describe: the `mo-js` head line, the modulepreload links, and a static `<link>` to `moment.css` so the layout doesn't jump.
   - `.mo-pc__grid` is a direct child of the section, and the section does **not** carry `.feature` (`site.css:687` breaks the resting rows).
   - Page CSS goes in `site.css` under `[data-moment="pinned-chapters"]`, never in the kit files:
     - Map the kit tokens to decor.css tokens for both themes: `--s-*`, `--line`, `--muted`, `--accent`, `--gutter`, `--r-md`, `--font-text`, `--t-lead`, and `--ink`. The site's `--ink` is a fixed dark brown, so step text would vanish in dark mode without this.
     - Size `.phone-frame` step visuals the way the kit sizes `> img`.
     - Cap the phone width at rest so the stacked version stays within 2 screens at 820x1180.
     - Leave room for the phone shadows.
   - Check that Recording's 80px wash bleed (`index.html:319`) doesn't sit over the pinned stage.
7. **Setlist drum (moment 1).**
   - New section with `data-scroll-moment="setlist-drum"`, plus `src/setlist-drum.js` (started from `main.js` only if the section exists) and CSS in `site.css`.
   - A ~200svh section with a `position: sticky` stage. Scroll progress inside the section picks the active index.
   - Items sit on a CSS 3D cylinder (`rotateX` per item and `perspective`), like the iOS picker. Numbered amber badges match the app's look in the `set-01-setlist-builder` shot.
   - Native scroll only, with no scroll-jacking. The list is a real `<ol>` that reads correctly at rest. Static on phones and under reduced motion.
   - Add z-index rules for sections 11 and 12 at `site.css:72-81` and update the comment at `decor.css:266-273`.
8. **Export paper.**
   - New `scripts/crop-export-sheet.mjs`, using `sharp` (already a devDependency).
     - Source: `../songscribe-offline-muse/docs/website-guide/media/shots/exp-03-pdf-musician.png` (1206x2622). Honour `GUIDE_SRC` the way `build-guide.mjs` does.
     - Crop the sheet (y ≈ 400 to the end of Verse 2, before the cut-off Bridge).
     - Write sm/md/lg webps to `public/assets/images/shots/`.
     - It is a separate script, because `process-screenshots.mjs` can't crop and masks every shot, and the guide manifest is regenerated.
   - Build `.feature--paper`. The sheet displays at about 600 CSS px at most.
9. **Hover layer and copy.**
   - Phone frames that open the lightbox lift 2px on hover. Check that buttons step and press, and that text-link underlines draw.
   - Apply the copy above, then run copy-lint.

## Files
- `index.html`: hero bootstrap, sections 1-8, the new Setlist section, moment head lines.
- `public/assets/css/site.css`: compositions, entrance, drum, clip CSS, kit token map, z-index rules.
- `public/assets/css/main.css`: `overflow-x: clip`.
- `public/assets/css/guide.css`: clip rules move out; sidenav cap.
- `public/assets/css/decor.css`: decor loops rest; z-index comment.
- `src/clips.js` (new), `src/main.js`, `src/guide.js` (sidenav only), `src/setlist-drum.js` (new).
- `public/assets/moments/` (copied kit files, unchanged).
- `scripts/crop-export-sheet.mjs` (new), plus the export webps.

## Verification
- `npm run build` exits 0.
- `node scripts/test-build-guide.mjs` passes.
- In the browser pane, on a guide page: clips play and pause with one click, and the sidenav sticks and scrolls within its cap.
- In the browser pane at 1440x900, 1024x768, 820x1180 and 390x844, in light and dark:
  - Every section is 1-2 screens tall.
  - Both moments pin and release cleanly.
  - Clips play only while in view, and their pause buttons work.
  - There is no sideways scroll.
  - The cookie card doesn't cover a primary action.
- With reduced motion forced: nothing moves, nothing is hidden, posters are visible, and the drum and chapters show as lists.
- Run the skill checkers against the build (`dist/index.html --root dist`, `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, kind `software`): `copy-lint.mjs`, `consistency.mjs`, `check.mjs`, `perf.mjs`. Every FAIL is fixed or explained.
- LCP: the hero image is still the LCP element, and video bytes load only near the viewport (`preload="none"` plus a poster).
- Nothing is committed without being asked. Deploy only when the user says so.
