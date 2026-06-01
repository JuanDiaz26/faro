import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      // 25% de padding → el logo ocupa el 50% central (safe zone garantizada).
      // Fondo navy para que el recorte circular/squircle se vea limpio.
      padding: 0.25,
      resizeOptions: { background: '#0B1733' },
    },
    apple: {
      sizes: [180],
      padding: 0.1,
      resizeOptions: { background: '#0B1733' },
    },
  },
  images: ['public/faro-icon.png'],
})
