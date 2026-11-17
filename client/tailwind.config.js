/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palet pastel hangat Duitku
        krem: '#FFFBF5',
        mint: '#7ED6B5',
        mints: '#E4F7EF',
        coral: '#FF9B85',
        corals: '#FFEDE8',
        lavender: '#B8A9F0',
        lavenders: '#EFEBFB',
        kuning: '#FFD97D',
        kunings: '#FFF4D9',
        ink: '#4A4038',
        inkl: '#7A6F65',
        // Versi lebih gelap untuk teks di atas latar pastel (biar kontrasnya sehat)
        coralink: '#C9523D',
        mintink: '#0E7A57',
        lavenderink: '#5847C4',
        amberink: '#95660A',
      },
      fontFamily: {
        sans: ['Poppins', 'Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lembut: '0 8px 30px rgba(74, 64, 56, 0.06)',
        naik: '0 14px 40px rgba(74, 64, 56, 0.12)',
        tombol: '0 8px 20px rgba(126, 214, 181, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        muncul: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pudar: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        muncul: 'muncul 0.22s ease-out',
        pudar: 'pudar 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
