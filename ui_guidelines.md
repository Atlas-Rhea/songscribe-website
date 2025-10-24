# SongScribe UI Guidelines

*Last updated: 2025-05-22*

## 1  Purpose & Scope

These guidelines codify the visual and interaction language of **SongScribe** so that every screen, component, and animation feels effortless, intuitive, and—yes—Steve‑Jobs‑worthy. Follow them for all product surfaces: desktop, mobile, marketing site, and in‑app pop‑ups.

---

## 2  Design Philosophy

| Principle         | Meaning                                                  | Practical Test                                              |
| ----------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **Simplicity**    | Strip away the non‑essential.                            | "Could we ship the same value if this control disappeared?" |
| **Clarity**       | Every element must communicate purpose without a manual. | 5‑second newbie glance passes.                              |
| **Delight**       | Subtle, purposeful moments of joy—never gimmicks.        | Micro‑interaction sparks a smile but never slows flow.      |
| **Craftsmanship** | Pixel accuracy, crisp type, smooth animations.           | Zoom to 400 %—no misalignments.                             |
| **Focus**         | One primary action per view.                             | Can you identify the CTA in 2 seconds?                      |

> **🍏 The Steve Jobs Test**: *Would Steve nod in approval of this screen?* If not, refine.

---

## 3  Brand Personality

* **Warm & Encouraging** – invites creative flow.
* **Professional‑grade** – feels studio‑quality, not a toy.
* **Offline‑first Confidence** – communicates reliability even without internet.

Visually, aim for the calm polish of **Bear Notes**, the elegance of **Things 3**, and a splash of studio gear authenticity.

---

## 4  Design Tokens

| Token                      | Light HEX | Dark HEX  | Tailwind var            |
| -------------------------- | --------- | --------- | ----------------------- |
| `--color-primary`          | `#FF7A2F` | `#FF8C45` | `orange-500`            |
| `--color-accent`           | `#1E9E99` | `#20B2AC` | `teal-500`              |
| `--color-bg`               | `#FDFCF9` | `#121212` | `zinc-50` / `zinc-900`  |
| `--color-surface`          | `#FFFFFF` | `#1E1E1E` | `white` / `zinc-800`    |
| `--color-text-main`        | `#343434` | `#E5E5E5` | `zinc-800` / `zinc-200` |
| `--color-text-muted`       | `#6B6B6B` | `#A3A3A3` | `zinc-500` / `zinc-400` |
| `--color-chip-chord-bg`    | `#FFF4DF` | `#403015` | custom                  |
| `--color-chip-metadata-bg` | `#F8F9FB` | `#272727` | custom                  |

All Tailwind classes compile from these CSS custom properties via the design‑tokens plugin.

---

## 5  Typography

| Usage          | Font Family (Fallback)   | Size (rem) | Weight |
| -------------- | ------------------------ | ---------- | ------ |
| Display / H1   | `Poppins`, ui‑sans‑serif | 2.25       | 600    |
| Section H2‑H3  | `Poppins`                | 1.5 / 1.25 | 500    |
| Body           | `Assistant`, system      | 1.0        | 400    |
| Caption / Meta | `Oxygen Mono`            | 0.875      | 400    |

Line‑height: 1.5 for body, 1.2 for headings.

---

## 6  Layout & Spacing

* **8‑pt grid** across all breakpoints.
* Page padding: `p-6` mobile, `p-10` desktop.
* Internal padding tiers: `xs 4 px`, `sm 8 px`, `md 12 px`, `lg 16 px`, `xl 24 px`.
* Rounded corners: `rounded-2xl` (16 px) for cards/dialogs; `rounded-lg` (8 px) for buttons/inputs.

---

## 7  Responsive Breakpoints

| Label | Min Width | Target Device      |
| ----- | --------- | ------------------ |
| `sm`  | 640 px    | Mobile (landscape) |
| `md`  | 768 px    | Small tablets      |
| `lg`  | 1024 px   | Laptops            |
| `xl`  | 1280 px   | Desktops           |
| `2xl` | 1536 px   | Large monitors     |

*Rule of thumb*: primary recording controls must remain visible at all widths; secondary panes collapse into drawers below `md`.

---

## 8  Component Guidelines

### 8.1 Action Button

* Sizes: `sm 32×32 px`, `md 40×40 px`, `lg 48×48 px`.
* **Primary** = solid `--color-primary` background, white text.
* **Secondary** = outline `--color-primary`, text `--color-primary`.
* Icon‑only: 24 px Lucide icon, tooltip on hover.

### 8.2 Metadata Chips

* Height 24 px, `rounded-full`, shadow `shadow-sm`.
* Background `--color-chip-metadata-bg`, border `--color-text-muted` at 10 %.
* Hover: elevate + darken border 20 %.
* Click opens modal; Esc closes.

### 8.3 Chord Chips *(NEW)*

> **Keep this look—see reference screenshots.**

| Attribute     | Spec                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Size          | 24 × 24 px square (`1.5rem`) so chords align tightly above lyrics.                                     |
| Font          | `Poppins` 600, 0.9 rem, letter‑spacing 0.5 px.                                                         |
| BG Color      | `--color-chip-chord-bg` (light pastel yellow) — stands out but feels gentle.                           |
| Text Color    | `--color-text-main`.                                                                                   |
| Border        | None. Subtle `shadow-xs` for depth.                                                                    |
| Alignment     | Center text both axes (grid).                                                                          |
| Interaction   | **Chord Mode ON** → chips visible. **Chord Mode OFF** → chips hidden & lyrics recalc to full width.    |
| Accessibility | Minimum 24 px touch target; tooltip reveals full chord with extensions (e.g., `Cmaj7`) on hover/focus. |

### 8.4 Timeline Slider (Versioning)

* Track height 6 px, semi‑transparent `--color-primary`.
* Handle 12 px circle, white fill, 1 px border `--color-primary`.
* Snap to saved versions; tooltip timestamp.

### 8.5 Dialogs & Popovers

* Width `w-80` mobile, `w-96` desktop.
* Title bar sticky; primary action right‑aligned.
* Esc closes; Cmd+Enter confirms.

*(Add further components as created; reference @figma links.)*

---

## 9  Interaction & Motion

* **Duration**: 200 ms (std), 120 ms (micro).
* **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`.
* Avoid bounce; prefer subtle translate/opacity combos.

Sample class:

```css
.transition-base { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
```

---

## 10  Accessibility

* Text contrast ≥ 4.5:1.
* Keyboard navigable; focus ring `outline-2 outline-accent`.
* Aria‑labels for icon buttons.
* Honor `prefers-reduced-motion`.

---

## 11  Dark Mode

* Auto via `prefers-color-scheme`; toggle in settings.
* Swap `--color-bg`, `--color-surface`, etc.; boost brand orange saturation +10 %.

---

## 12  Inspirational References

* **Bear Notes** – sliding sidebar, hashtag tagging.
* **Things 3** – magic circle add‑task button.
* **iA Writer** – mono‑column focus.
* **Craft Docs** – minimal chrome, context toolbars.
* **Logic Pro** – pro‑grade timeline metaphors.

---

## 13  Contribution Workflow

1. Designers update Figma; attach link in PR.
2. Developers implement in Storybook; pass lint + visual diff.
3. Submit PR with `✅ Steve Jobs Test passed` note.
4. After merge, append change note to `PROJECT_BIBLE.md` → *Recent Changes*.

---

## 14  Future Work

* Theming API for user‑selectable palettes.
* Animation tokens for advanced editor transitions.
* Expanded iconography set for metadata & chord chips.

---

*Questions → post in `#design‑guild` Slack channel.*
