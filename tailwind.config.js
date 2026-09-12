/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        body: ['1rem', { lineHeight: '1.625' }],
      },
      colors: {
        dessa: {
          navy:      '#1B2B4B',
          teal:      '#2A7F8F',
          tealLight: '#E8F4F6',
          green:     '#5DB87A',
          greenDark: '#26884b',
          magenta:   '#B5179E',
          salmon:    '#F08080',
          blue:      '#A8C8E8',
          bg:        '#F0F2F5',
          card:      '#FFFFFF',
          border:    '#E2E6EA',
          muted:     '#6B7A8D',
        },
        mtw: {
          amber:      '#F5A623',
          amberLight: '#FEF3DC',
          teal:       '#2D7D78',
          tealLight:  '#E0F0EF',
          coral:      '#E8653A',
          green:      '#5B9E4D',
          greenLight: '#EAF4E7',
          purple:     '#7B5EA7',
          blue:       '#3B7DD8',
          bg:         '#F0F2F5',
          card:       '#FFFFFF',
        },
        brand: {
          text:    '#1B2B4B',
          subtext: '#6B7A8D',
          bg:      '#F0F2F5',
          border:  '#E2E6EA',
          focus:   '#2A7F8F',
        },
        // UI-state semantics (validation, toasts, alerts) — deliberately
        // separate from the dessa-green/blue/salmon data-viz palette above,
        // which means strength/typical/need on charts, not error/warning/
        // success. Keeping them apart means a chart can show "need" in
        // salmon without it ever being mistaken for a form error.
        state: {
          error:        '#D64545',
          errorLight:   '#FBEAEA',
          warning:      '#C77D1F',
          warningLight: '#FBF0DE',
          success:      '#2F9E5B',
          successLight: '#E6F6EC',
          info:         '#3366CC',
          infoLight:    '#EAF0FC',
        },
        'interactive-blue': '#0061FF',
        // /user-feedback only — black/white (Tailwind's built-in black,
        // white, gray-*) plus this one accent, so the research protocol
        // reads as its own document rather than another part of the app.
        research: {
          accent:     '#4D7FAA',
          accentTint: '#E3ECF3',
        },
      },
    },
  },
  plugins: [],
}
