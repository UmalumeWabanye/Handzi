# Handzi — Corporate Identity Guide v1.0

> **Skilled hands, one tap away.**
> Handzi is a South African platform where handymen and tradespeople (repairs, building, paving, roofing, waterproofing, plumbing, electrical, painting and more) show off their work, and clients find, compare and hire them.

This guide is written for two readers: **people** (designers, developers, printers) and **AI coding assistants** (e.g. Claude in VS Code). Section 12 contains the rules an assistant must follow when building or editing the Handzi app.

---

## 1. Brand essence

| | |
|---|---|
| **Purpose** | Give skilled hands the visibility and respect they've earned, and give clients a trustworthy way to hire them. |
| **Promise** | See real work before you hire. |
| **Personality** | Warm · Practical · Proud · A little cheeky · Honest |
| **Feels like** | A well-used tape measure: reliable, handy, always in the toolbox. |
| **Not** | Corporate, cold, flashy, salesy, "tech-bro". |

**Why the tape measure?** Every trade uses one. It stands for precision, measuring up, and checking the work. The tape pulls out to reveal the name, the way Handzi reveals skilled people.

---

## 2. Logo

### 2.1 Files (`/logo`)

| File | Use |
|---|---|
| `handzi-logo-primary.svg` | Default. Light backgrounds (chalk, white). |
| `handzi-logo-on-dark.svg` | Charcoal or very dark backgrounds. |
| `handzi-logo-on-orange.svg` | Safety Orange backgrounds. |
| `handzi-logo-on-sunshine.svg` | Sunshine yellow backgrounds. |
| `handzi-logo-one-colour-black.svg` | Single-colour print, stamps, embroidery, vinyl, faxes, newspaper. |
| `handzi-logo-one-colour-white.svg` | Single-colour reversed on dark or photos. |
| `handzi-logo-stacked.svg` / `-stacked-dark.svg` | Square or tall spaces: profile pictures, splash screens, merch. |
| `handzi-mark.svg` | The tape case alone: loaders, watermarks, tiny spaces. |
| `handzi-app-icon.svg` (rounded) / `-square.svg` | App icon. Stores apply their own mask, so submit the **square** version. |
| `favicon.svg` | Browser tab. |
| `png/` | Ready-made PNGs: app icon 1024/512/192/180, favicon 32/16, logo 1200 px. |

All logo text is outlined (converted to shapes), so files render correctly without fonts installed.

### 2.2 Anatomy
1. **Tape case**: orange rounded square with a charcoal dial and tab. This is the **mark**.
2. **Tape band**: sunshine yellow with measuring ticks along the top.
3. **Wordmark**: "handzi", always lowercase, Bricolage Grotesque ExtraBold.
4. **Hook**: the charcoal end bar on the right.

### 2.3 Clear space
Keep empty space around the logo equal to the **height of the tape case's dial ring (≈ ½ the case height)** on all sides. No text, edges or images inside that zone.

### 2.4 Minimum size
- Horizontal logo: **120 px wide** on screen / **30 mm** in print.
- Stacked logo: **64 px wide** / 18 mm.
- Below these sizes, use the **mark** or **app icon** alone.

### 2.5 Don'ts
- ❌ Don't recolour outside the approved versions.
- ❌ Don't stretch, skew, rotate or add effects (shadows, glows, gradients, outlines).
- ❌ Don't retype the wordmark in another font, or capitalise it ("Handzi" in running text is fine; the **logo** is always lowercase).
- ❌ Don't separate the tape band from the case, or rearrange the parts.
- ❌ Don't place the primary logo on busy photos: use the one-colour white version over a dark overlay.
- ❌ Don't put the logo inside another shape (circle, badge) except the official app icon.

---

## 3. Colour

### 3.1 Palette

| Name | Hex | RGB | Role |
|---|---|---|---|
| **Safety Orange** | `#EA580C` | 234, 88, 12 | Brand hero colour: logo, illustrations, icons, large headings (24 px+), highlights on dark. |
| **Brick** | `#C2410C` | 194, 65, 12 | Primary buttons, links, active tabs. The *usable* orange for small text. |
| **Brick Dark** | `#9A3412` | 154, 52, 18 | Hover/pressed for Brick. |
| **Sunshine** | `#FFC94A` | 255, 201, 74 | Highlights, ratings stars, badges, secondary buttons, the tape. |
| **Sunshine Dark** | `#E0A520` | 224, 165, 32 | Hover/pressed for Sunshine. |
| **Charcoal** | `#1C1F24` | 28, 31, 36 | Main text, dark backgrounds, nav. |
| **Graphite** | `#33373E` | 51, 55, 62 | Dark-mode surfaces. |
| **Steel** | `#5B6068` | 91, 96, 104 | Secondary text on light. |
| **Mist** | `#A3A8B0` | 163, 168, 176 | Secondary text on dark only. |
| **Line** | `#E2DED6` | 226, 222, 214 | Borders and dividers. |
| **Chalk** | `#F7F5F0` | 247, 245, 240 | App background. |
| **White** | `#FFFFFF` | 255, 255, 255 | Cards, inputs. |
| Success | `#15803D` | | Verified, completed. |
| Danger | `#B91C1C` | | Errors, destructive. |
| Info | `#1D4ED8` | | Notices, in progress. |

### 3.2 Proportion
Roughly **60% Chalk/White · 25% Charcoal · 10% Orange/Brick · 5% Sunshine**. Orange is a spice, not the meal: use it where you want the eye to go.

### 3.3 Approved text/background pairs (WCAG AA)

| Text on background | Contrast | OK for |
|---|---|---|
| Charcoal on Chalk | 15.2 : 1 | All text |
| Charcoal on Sunshine | 10.8 : 1 | All text |
| Steel on Chalk | 5.8 : 1 | All text |
| White on Brick | 5.2 : 1 | All text, primary buttons |
| Brick on Chalk | 4.8 : 1 | Links, small text |
| Charcoal on Orange | 4.6 : 1 | All text |
| White on Charcoal | 16.5 : 1 | All text |
| Mist on Charcoal | 6.9 : 1 | All text |
| ⚠️ White on Orange | 3.6 : 1 | **Large text (24 px+) and icons only** |
| ⚠️ Orange on Chalk | 3.3 : 1 | **Large text and icons only** |

---

## 4. Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display & headings | **Bricolage Grotesque** | ExtraBold 800 | Letter-spacing −0.03em. Headlines, prices, ratings, big numbers. |
| Body & UI | **Inter** | 400 / 500 / 600 / 700 | Everything else. |

Both are free (SIL Open Font License) and included in `/fonts`, and also on Google Fonts.

### Type scale (mobile first)

| Token | Size / line height | Font |
|---|---|---|
| display | 40 / 44 | Bricolage 800 |
| h1 | 32 / 36 | Bricolage 800 |
| h2 | 24 / 30 | Bricolage 800 |
| h3 | 20 / 26 | Inter 600 |
| body | 16 / 24 | Inter 400 |
| small | 14 / 20 | Inter 400 |
| caption | 12 / 16 | Inter 500 |

Rules: sentence case for headings and buttons ("Book a handyman", not "Book A Handyman"). Never use Bricolage for paragraphs. Never go below 12 px.

---

## 5. Layout, spacing and shape

- **4 px grid.** Spacing steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Screen side padding: **16 px** on phones, 24 px on tablets, max content width **1200 px** on web.
- **Radius:** 6 (chips, small), 10 (buttons, inputs), 16 (cards), 24 (sheets, app icon feel), pill (tags, avatars' status).
- **Shadows** are soft and rare: cards use `shadow.card`; floating buttons and menus use `shadow.raised`.
- **Touch targets ≥ 48 × 48 px.**

---

## 6. UI components

**Buttons** (height 48, radius 10, Inter 600 16 px, sentence case)
- *Primary*: Brick background, white text, hover Brick Dark. One per screen ideally ("Request quote", "Hire now").
- *Secondary*: Sunshine background, Charcoal text.
- *Outline*: transparent, 1.5 px Charcoal border, Charcoal text.
- *Ghost/text*: Brick text, no background.
- *Destructive*: Danger background, white text.
- Disabled: 40% opacity, no hover.

**Inputs**: white, 1 px Line border, radius 10, height 48, 16 px text (prevents iOS zoom). Focus: 3 px Safety Orange ring. Labels always visible above the field (no placeholder-only labels). Errors in Danger with an icon and a clear sentence.

**Cards**: white, radius 16, `shadow.card` or 1 px Line border, 16 px padding.

**Handyman profile card (signature component)**
- Avatar 88 px circle; name in Bricolage 800; trade(s) as chips.
- Star rating in Sunshine with the number in Charcoal ("4.8 · 37 jobs").
- **Verified** badge: Success green check + "ID verified" / "Qualified".
- Portfolio strip: before/after photos, radius 10.
- Area served + "From R___/hour" (or "Quote on request").
- Primary action: "Request quote".

**Badges & chips**: pill radius, caption or small text. Trade chips on Chalk with Charcoal text; "Top rated" on Sunshine; "Verified" on Success with white text.

**Tape ticks motif**: the measuring-tick pattern (2 px Charcoal ticks every 12–16 px) can be used sparingly as a divider, progress bar or loading bar. Never as a full background.

**Navigation**: bottom tab bar on mobile (Charcoal background, Mist icons, active tab in Sunshine), max 5 tabs: Home · Search · Jobs · Messages · Profile.

**Icons**: one outline icon set (recommended: Lucide or Phosphor "regular"), 1.75–2 px stroke, rounded caps. 20 px in UI, 24 px in nav. No emoji as UI icons.

**Empty states**: the Handzi mark + one friendly line + one action, e.g. *"No jobs yet. Your next one is just a tap away."* → "Find a handyman".

**Loading**: the tape case mark with the tape ticks sliding (≤ 1 s loop), or skeleton cards in Line colour.

---

## 7. Imagery

- **Real work, real people.** Hands at work, finished jobs, before/after shots, South African homes and streets.
- Natural light, honest, not over-polished. No generic stock smiles, hard-hat clichés or watermarks.
- Show diversity of South Africans, genders and ages in the trades.
- Overlays on photos: Charcoal at 50–70% opacity, white text on top.

---

## 8. Voice and tone

Talk like a reliable local fundi who's proud of the work: **clear, warm, direct, a bit of humour, never slangy to the point of confusion.**

| Do | Don't |
|---|---|
| "Find a handyman you can trust." | "Leverage our solutions to source vetted service providers." |
| "Show off your best work." | "Upload portfolio assets." |
| "Your quote is on its way." | "Request successfully submitted." |
| "Sorry, something broke on our side. Try again?" | "Error 500." |
| "Sharp! Job booked for Saturday, 9am." | "BOOKING CONFIRMED!!!" |

- Address users as **you**; Handzi is **we**.
- Use South African English spelling (colour, organise, centre) and **R** for Rand (R450, R1 200).
- Local flavour (sharp, lekker, fundi) lightly, max one per screen, never in errors, payments or legal text.
- Name the trades plainly: plumber, electrician, tiler, roofer, painter, paver, waterproofing, builder, general handyman.

**Tagline:** *Skilled hands, one tap away.*
**Alternates:** *See the work before you hire.* · *Every trade, one tap.*

---

## 9. Accessibility

- Meet **WCAG 2.2 AA**: use only the approved pairs in 3.3.
- Never rely on colour alone (pair status colours with icons or text).
- Touch targets ≥ 48 px; visible focus ring (3 px Safety Orange).
- Support dynamic type / browser zoom to 200% without breaking.
- Respect "reduce motion".
- Every image has meaningful alt text ("Tiled bathroom floor by Sipho M.").

---

## 10. Dark mode

Background Charcoal, cards Graphite, text White, secondary text Mist. Primary buttons switch to **Safety Orange with Charcoal text**. Links become Sunshine. Use `handzi-logo-on-dark.svg`.

---

## 11. Applications (quick reference)

| Where | Use |
|---|---|
| App store icon | `png/app-icon-1024.png` (square; the store rounds it). |
| Android adaptive icon | Foreground: `handzi-mark.svg` at 66% of canvas; background: Sunshine `#FFC94A`. |
| Web favicon | `favicon.svg` + `png/favicon-32.png`. |
| Splash screen | Chalk background, `handzi-logo-stacked.svg` centred, 40% of screen width. |
| Social profile | `handzi-logo-stacked.svg` on Chalk, or app icon. |
| Vans, T-shirts, caps | Horizontal or one-colour versions; Charcoal or Orange garments. |
| Business cards, invoices | Primary logo top-left; Inter for all text. |

---

## 12. Rules for AI coding assistants (Claude in VS Code etc.)

When creating or editing any Handzi UI, you **must**:

1. **Use the tokens, never raw values.** Import `tokens/tokens.css` (web) or map `tokens/tokens.json` into the app's theme (React Native `StyleSheet`/theme object, Flutter `ThemeData`, Tailwind via `tokens/tailwind.preset.js`). Do not hard-code hex colours, font sizes or spacing in components.
2. **Use the logo files as-is.** Import SVGs from `handzi-brand/logo/`. Never recreate the logo in code, retype the wordmark, or recolour it. Pick the version by background (section 2.1).
3. **Colour rules:**
   - Primary buttons = Brick `#C2410C` with white text. Never white text on Safety Orange `#EA580C` below 24 px.
   - Safety Orange is for graphics, icons, the logo and large headings.
   - Sunshine is for highlights, stars, badges, secondary buttons (Charcoal text).
   - Only use text/background pairs from section 3.3.
4. **Type:** headings h1/h2/display in Bricolage Grotesque 800 with −0.03em tracking; everything else Inter. Sentence case. Min 12 px; inputs 16 px.
5. **Spacing and shape:** 4 px grid; screen padding 16 px; radius 10 for buttons/inputs, 16 for cards; touch targets ≥ 48 px.
6. **Copy:** write UI text in the Handzi voice (section 8), SA English, Rand as "R1 200". No lorem ipsum. Use clear placeholders like `[Handyman name]` if real data is missing.
7. **Accessibility:** semantic elements, labels on every input, `aria-label` on icon-only buttons, alt text on images, visible focus ring, respect reduced motion.
8. **Icons:** one outline set (Lucide or Phosphor). No emoji in UI.
9. **Don't invent new brand colours, fonts, gradients or shadows.** If something is missing, choose the closest token and leave a `// TODO(brand):` comment explaining the gap.
10. **Dark mode** uses the semantic variables (`--hz-bg`, `--hz-surface`, `--hz-text`, `--hz-primary`…) so it switches automatically. Build with semantic tokens, not palette tokens, wherever possible.
11. When unsure, prefer **simple, warm and practical** over flashy.

---

*Handzi CI Guide v1.0 · November 2026 · Fonts: Bricolage Grotesque and Inter, SIL Open Font License 1.1.*
