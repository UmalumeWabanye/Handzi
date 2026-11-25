// Handzi brand preset (handzi-brand/tokens/tailwind.preset.js): hz-* colours, font-display, text-h1…, radius, shadows.
module.exports = {
  presets: [require('../../handzi-brand/tokens/tailwind.preset.js')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Motion uses the brand easing (tokens.motion.easing) and durations (120 / 200 / 320ms).
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-in': { from: { transform: 'translateX(-16px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0.2,0.8,0.2,1) both',
        'fade-in': 'fade-in 200ms cubic-bezier(0.2,0.8,0.2,1) both',
        'slide-in': 'slide-in 320ms cubic-bezier(0.2,0.8,0.2,1) both',
      },
    },
  },
  plugins: [],
};
