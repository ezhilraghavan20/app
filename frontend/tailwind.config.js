/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:  '#040B18',
        navy:  { DEFAULT:'#060F22', light:'#0B1A35', card:'rgba(8,18,42,0.7)' },
        gold:  { DEFAULT:'#D4AF37', bright:'#F0CC55', dim:'#8B7318', muted:'rgba(212,175,55,0.15)' },
        glass: { border:'rgba(212,175,55,0.18)', bright:'rgba(212,175,55,0.35)' },
        risk:  { critical:'#EF4444', high:'#F97316', medium:'#EAB308', low:'#22C55E', info:'#3B82F6' },
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)',
        gold:   '0 0 30px rgba(212,175,55,0.25)',
        'gold-lg': '0 0 60px rgba(212,175,55,0.2)',
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      keyframes: {
        float: { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
        pulse_gold: { '0%,100%': { boxShadow:'0 0 0 0 rgba(212,175,55,0.3)' }, '50%': { boxShadow:'0 0 0 12px rgba(212,175,55,0)' } },
        shimmer: { '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulse_gold: 'pulse_gold 3s ease infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        mesh: `radial-gradient(at 20% 20%, rgba(212,175,55,0.06) 0px, transparent 50%),
               radial-gradient(at 80% 80%, rgba(59,130,246,0.05) 0px, transparent 50%),
               radial-gradient(at 50% 50%, rgba(8,18,42,0.95) 0px, transparent 60%)`,
      },
    },
  },
  plugins: [],
}
