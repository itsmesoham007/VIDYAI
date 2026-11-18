/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#FAF9F5',
          sidebar: '#F3F1EC',
          surface: '#FFFFFF',
          hover: '#EAE7DF',
          border: '#E5E3DC',
          'border-hover': '#D5D2C9',
          text: '#1F1E1D',
          'text-secondary': '#6B6862',
          'text-muted': '#949088',
          terracotta: '#C96442',
          'terracotta-hover': '#B55535',
          'terracotta-light': '#FBF1ED',
          amber: '#D97706',
          'user-bubble': '#ECE9E2',
          'asst-bubble': '#FAF9F5',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        junior: {
          pink: '#f472b6',
          yellow: '#fde047',
          purple: '#c084fc',
          sky: '#38bdf8',
          orange: '#fb923c'
        },
        academic: {
          navy: '#0f172a',
          slate: '#1e293b',
          accent: '#3b82f6',
          gold: '#eab308'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      }
    },
  },
  plugins: [],
};
