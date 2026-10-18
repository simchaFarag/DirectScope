/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1F4E79',        // text
        muted: '#6B7280',
        bg: '#F7F9FC',         // background
        primary: { DEFAULT: '#3DA5F4', 50: '#F2F7FE', 100: '#E1ECFD', 200: '#C1D9FB', 300: '#9EC7F9', 700: '#1B75BB' },
        accent: { DEFAULT: '#FFC72C', dark: '#F0A70A', soft: '#FFF4CC' },
        danger: { DEFAULT: '#EB5757', soft: '#FEF6F6' },
        warn: { DEFAULT: '#F2994A', soft: '#FFF8F0' },
        success: { DEFAULT: '#2FBF71', dark: '#146D3D', soft: '#BFFFDC' },
        line: '#E0E2E7',
        disabled: '#E0E2E7',
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
        // "Tel Aviv" is the Figma heading font (commercial). Falls back to Rubik until the font file is added.
        display: ['"Tel Aviv"', 'Rubik', 'sans-serif'],
      },
      fontSize: {
        xl1: ['60px', '56px'],
        h1: ['28px', '32px'],
        h2: ['20px', '26px'],
        h3: ['18px', '24px'],
        lg: ['16px', '24px'],
        body: ['14px', '24px'],
        caption: ['12px', '16px'],
        btn: ['14px', '16px'],
      },
      boxShadow: {
        blue: '0 0 10px rgba(62,165,244,0.10)',
        bar: '0 0 20px rgba(19,64,99,0.20)',
        sm4: '0 4px 4px rgba(7,35,57,0.10)',
        yellow: '0 0 8px rgba(255,199,46,0.10)',
      },
      maxWidth: { phone: '430px' },
    },
  },
  plugins: [],
};
