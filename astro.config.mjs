import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://labbrickell.com.ar',

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  devToolbar: {
    enabled: false,
  },

  integrations: [
    sitemap({
      // Las paginas en construccion no entran. Es la otra mitad del noindex:
      // aquel le pide a Google que no la indexe, esto evita ademas invitarlo.
      filter: (page) => !/\/nueva\/?$/.test(new URL(page).pathname),
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-AR',
          en: 'en-US',
        },
      },
    }),
  ],
});