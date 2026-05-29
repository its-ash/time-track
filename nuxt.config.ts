import tailwindcss from '@tailwindcss/vite'

const rawBaseURL = process.env.NUXT_APP_BASE_URL || (process.env.NODE_ENV === 'production' ? '/time-track/' : '/')
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',

  dir: {
    public: 'public'
  },

  modules: [
    '@vite-pwa/nuxt'
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  devtools: {
    enabled: false
  },

  experimental: {
    appManifest: false
  },

  css: ['~/assets/css/main.css'],

  app: {
    baseURL,
    head: {
      title: 'Keep Track',
      link: [
        { rel: 'icon', type: 'image/png', href: `${baseURL}favicon.png` },
        { rel: 'apple-touch-icon', href: `${baseURL}favicon.png` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap' }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'description', content: 'Track project work logs in 20-minute blocks and export to PDF.' },
        { name: 'theme-color', content: '#3B82F6' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: false,
      type: 'module',
      suppressWarnings: true
    },
    manifest: {
      name: 'Keep Track',
      short_name: 'KeepTrack',
      description: 'Offline-first project time tracker',
      theme_color: '#3B82F6',
      background_color: '#FFFFFF',
      display: 'standalone',
      start_url: baseURL,
      scope: baseURL,
      icons: [
        {
          src: `${baseURL}favicon.png`,
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: `${baseURL}favicon.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
      navigateFallback: baseURL
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15'
})
