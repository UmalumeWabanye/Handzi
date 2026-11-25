// Handzi Tailwind preset v1.0 — use only if the app uses Tailwind.
// tailwind.config.js:  module.exports = { presets: [require('./handzi-brand/tokens/tailwind.preset.js')], content: [...] }
module.exports = {
  theme: {
    extend: {
      colors: {
        hz: {
          orange: '#EA580C',
          brick: { DEFAULT: '#C2410C', dark: '#9A3412' },
          sunshine: { DEFAULT: '#FFC94A', dark: '#E0A520' },
          charcoal: '#1C1F24',
          graphite: '#33373E',
          steel: '#5B6068',
          mist: '#A3A8B0',
          line: '#E2DED6',
          chalk: '#F7F5F0',
          success: '#15803D',
          danger: '#B91C1C',
          info: '#1D4ED8',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '44px', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['32px', { lineHeight: '36px', letterSpacing: '-0.03em', fontWeight: '800' }],
        h2: ['24px', { lineHeight: '30px', letterSpacing: '-0.02em', fontWeight: '800' }],
        h3: ['20px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px', xl: '24px' },
      boxShadow: {
        card: '0 1px 2px rgba(28,31,36,.06), 0 2px 8px rgba(28,31,36,.06)',
        raised: '0 4px 16px rgba(28,31,36,.12)',
        sheet: '0 -8px 32px rgba(28,31,36,.16)',
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
      transitionTimingFunction: { hz: 'cubic-bezier(.2,.8,.2,1)' },
    },
  },
};
