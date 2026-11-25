# Handzi brand kit v1.0

## How to use it with Claude in VS Code

1. Copy this whole `handzi-brand` folder into the **root of your app project**.
2. Open `CLAUDE-snippet.md`, copy everything below the first two comment lines, and paste it into a file called `CLAUDE.md` at the root of your project. Create the file if it doesn't exist.
3. In VS Code, ask Claude something like:
   > "Apply the Handzi brand kit to the app: set up the tokens, fonts, app icon and favicon, then restyle the existing screens following handzi-brand/BRAND.md."

## What's inside

| Path | What it is |
|---|---|
| `BRAND.md` | The full CI guide: logo rules, colours, type, components, voice, accessibility, plus rules for AI assistants. |
| `CLAUDE-snippet.md` | Short instructions to paste into your project's `CLAUDE.md`. |
| `tokens/tokens.json` | Design tokens, the source of truth. Works with any stack. |
| `tokens/tokens.css` | CSS variables with light and dark themes (web apps). |
| `tokens/tailwind.preset.js` | Tailwind preset (only if you use Tailwind). |
| `logo/*.svg` | All logo versions, the mark, app icon and favicon, with text outlined. |
| `logo/png/` | PNG app icons (1024, 512, 192, 180), favicons (32, 16) and logo PNGs. |
| `fonts/` | Bricolage Grotesque and Inter variable fonts with their open licences. |
