module.exports = {
  purge: {
    enabled: false,
    content: [
      './src/**/*.html',
      './src/**/*.svelte',
      './src/**/*.ts'
    ]
  },
  theme: {
    fontFamily: {
      'title': ['Aclonica', 'sans-serif'],
      'subtitle': ['Exo 2', 'sans-serif'],
      'sans': ['"Quicksand"', 'sans-serif']
    },
    extend: {
      colors: {
        light: "#F5FAFF",
        dark: "#03174B",
        primary: '#0C266A',
        secondary: '#247ACA',
        action: '#2AD78B',
        'smoke-darkest': 'rgba(0, 0, 0, 0.9)',
        'smoke-darker': 'rgba(0, 0, 0, 0.75)',
        'smoke-dark': 'rgba(0, 0, 0, 0.6)',
        'smoke': 'rgba(0, 0, 0, 0.5)',
        'smoke-light': 'rgba(0, 0, 0, 0.4)',
        'smoke-lighter': 'rgba(0, 0, 0, 0.25)',
        'smoke-lightest': 'rgba(0, 0, 0, 0.1)',
      },
    }
  },
  variants: {},
}