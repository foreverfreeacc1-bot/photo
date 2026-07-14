import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables (design tokens) defined in globals.css.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument)', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
}

export default config
