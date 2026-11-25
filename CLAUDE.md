# Handzi (repo: handyconnect)

npm-workspaces monorepo: `apps/api` (Express + MongoDB + Socket.io), `apps/mobile` (Expo SDK 58, Expo Router),
`apps/admin` (React + Vite + Tailwind), `packages/shared` (enums/constants shared by all three). See README.md.
Internal package names and folders still say `handyconnect`; the product name everywhere users see it is **Handzi**.

## Brand: Handzi

This app is **Handzi**, a South African marketplace where handymen and tradespeople show their work and clients hire them. Tagline: "Skilled hands, one tap away."

All UI must follow the brand kit in `handzi-brand/`:
- **Read `handzi-brand/BRAND.md` before any UI, styling, copy or asset work**, especially section 12 ("Rules for AI coding assistants").
- Design tokens: `handzi-brand/tokens/tokens.json` (source of truth), `tokens.css` (web), `tailwind.preset.js` (Tailwind).
- Logos and icons: `handzi-brand/logo/` (SVG) and `handzi-brand/logo/png/`. Use the files as-is; never redraw or recolour the logo.
- Fonts: Bricolage Grotesque 800 for headings, Inter for everything else (`handzi-brand/fonts/` or Google Fonts).

Key rules (summary):
- No hard-coded colours, font sizes or spacing in components: use tokens.
- Primary buttons: Brick #C2410C with white text. Safety Orange #EA580C is for the logo, graphics and large text only.
- 4px spacing grid, 16px screen padding, radius 10 (buttons/inputs) and 16 (cards), touch targets ≥ 48px.
- UI copy in warm, clear South African English; prices like "R1 200"; sentence case.
- WCAG AA contrast, labels on inputs, alt text, visible focus ring.
- If the brand kit doesn't cover something, use the closest token and add `// TODO(brand):`.

## Where the tokens live in each app
- Mobile: `apps/mobile/src/ui/theme.ts` reads `handzi-brand/tokens/tokens.json`; components use `@/ui` only.
- Admin: `apps/admin/tailwind.config.cjs` uses `handzi-brand/tokens/tailwind.preset.js` (`hz-*` colours, `font-display`, `text-h1`…).

## Known brand gaps (tracked as TODO(brand) in code)
- Mobile icons are Ionicons outline; BRAND.md asks for Lucide or Phosphor. Category icons are stored as Ionicons names in the DB.
- Dark mode is defined by the kit but the mobile app is light-only for now.

## Working rules
- After API changes run `npm test` (Jest + in-memory MongoDB). After mobile changes run `npx tsc --noEmit` in `apps/mobile`.
- Reanimated: never call regular JS functions inside `useAnimatedStyle`; build configs outside the worklet.
