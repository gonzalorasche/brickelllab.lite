import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// ⚠️ LA WEB OFICIAL DESDE EL 29/09/2026 ES LA QUE ANTES VIVÍA EN /v4, y ahora
// vive en la raíz. La anterior (con versión en inglés, /lumina, /lexa y los
// borradores v2, v3, nueva, lab, lafinal) quedó en docs/descartes/sitio-viejo y
// sus direcciones redirigen a la nueva desde public/.htaccess.
//
// Ya no hay versión en inglés: por eso no hay i18n ni hreflang.
export default defineConfig({
  site: 'https://labbrickell.com.ar',
  trailingSlash: 'ignore',

  devToolbar: {
    enabled: false,
  },

  integrations: [
    sitemap({
      // Las páginas legales no suman nada en un buscador: quedan indexables
      // pero no se invita a Google a rastrearlas.
      filter: (page) => !/\/(terminos|privacidad)\/?$/.test(new URL(page).pathname),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        const ruta = new URL(item.url).pathname
        if (ruta === '/') return { ...item, priority: 1.0, changefreq: 'weekly' }
        if (ruta === '/blog/') return { ...item, priority: 0.8, changefreq: 'weekly' }
        if (ruta.startsWith('/blog/')) return { ...item, priority: 0.7, changefreq: 'monthly' }
        return item
      },
    }),
  ],
});
