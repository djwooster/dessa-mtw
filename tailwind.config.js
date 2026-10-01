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
        // Org design system palette (Storybook "DESSA UI / Tokens / Colors"),
        // kept separate from every other color group on purpose. Teal 25-900
        // is identical to primary, so it isn't duplicated here (white is #ffffff). Semantic
        // aliases: Need = red 400, Strength = green 400, Typical = primary
        // 400, Success = green 600.
        org: {
          primary: {
            25: '#f9fdff', 50: '#ebf5fb', 100: '#c1e2f3', 200: '#98cee9',
            300: '#6dbadd', 400: '#3da6ce', 500: '#0092bd', 600: '#007da8',
            700: '#006990', 800: '#005476', 900: '#00405a', hover: '#228eb5',
          },
          green: {
            100: '#cdffc7', 200: '#9bea93', 300: '#70d468', 400: '#4ab947',
            500: '#27a02a', 600: '#108d1d', 700: '#027518', 800: '#005813', 900: '#003c0a',
          },
          red: {
            100: '#ffccc2', 200: '#ffaa9c', 300: '#ff897b', 400: '#ff695d',
            500: '#f53d36', 600: '#de1b1e', 700: '#ba1823', 800: '#990a19', 900: '#760a12',
          },
          gray: {
            25: '#eff4f5', 50: '#e2e9eb', 100: '#cad6d9', 200: '#bbc6c9',
            300: '#9fabae', 400: '#818e92', 500: '#6f7a7d', 600: '#555e61',
            700: '#414a4d', 800: '#303739', 900: '#1b2021',
          },
          aperture: '#30afdc',
          black: '#000000',
          yellow: {
            100: '#fffcea', 200: '#fff8d4', 300: '#fff5c2', 400: '#fff2ad',
            500: '#ffea7a', 600: '#ffe352', 700: '#f8d000', 800: '#d4b200',
            900: '#b79a00',
          },
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
