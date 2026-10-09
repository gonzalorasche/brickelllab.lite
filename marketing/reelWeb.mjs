// ============================================================
// reelWeb.mjs — "Una web igual a otras mil": la web de Brickell en un iPhone
// ============================================================
//
// QUÉ SALE DE ACÁ. Un reel corto, 1080 × 1920 a 60 cuadros, mudo:
//
//   0,0 – 4,6   TU MARCA / EN UNA WEB / IGUAL A / OTRAS MIL.
//   4,9 – 7,9   Hecha desde cero, / para que se parezca a vos.
//   el teléfono  la web DE VERDAD (dist/ servido en local) recorrida despacio:
//               el titular, "De la idea al código.", identidad y los proyectos.
//   el cierre   TU MARCA, / COMO NINGUNA. — y la firma: logo, "Diseñamos para
//               vos." y labbrickell.com.ar.
//
//   node marketing/reelWeb.mjs filmar   → filma la web (necesita `npm run build` hecho)
//   node marketing/reelWeb.mjs          → arma el reel con lo filmado
//   node marketing/reelWeb.mjs --mirar  → cuadros sueltos
//
// ⚠️ USA EL MOTOR DE LOS REELS DE LÚMINA (C:\Dev\lumina\marketing: el filmador
// de reelMartina.mjs y el armado de reelArmado.mjs), con la marca de Brickell:
// la noche #0f0c1c, el magenta de la casa, Geist y el logo blanco. Es la misma
// gramática que quedó aprobada en Lúmina —el teléfono de 16 Pro Max a
// proporción y sin isla, adentro de la franja que sobrevive al zoom de
// Instagram, los textos con tiempo para leerse— y no tiene sentido mantener dos
// copias del mismo motor.
//
// ⚠️ LAS COOKIES SE RECHAZAN antes de cargar (bl_cookies = 'no'): el cartel no
// aparece en cámara y la toma no prende Google Analytics.
//
// ⚠️ AUDIO: igual que los reels de Lúmina. 00,0–02,0 bajo · 02,0–04,6 el tema
// del gancho · 04,6–fin el del reel.
// ============================================================
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIST = join(AQUI, '..', 'dist')
const CLIPS = join(AQUI, 'salida', 'reel-web', 'clips')
const LUMINA = 'file:///C:/Dev/lumina/marketing/'
const LOGO = pathToFileURL(join(AQUI, '..', 'public', 'v4', 'logo-brickell-blanco.png')).href

if (process.argv[2] === 'filmar') {
  const { default: puppeteer } = await import(LUMINA + 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')
  const { CHROME } = await import(LUMINA + 'panelEnVivo.mjs')
  const { RELOJ_TOTAL, AYUDAS } = await import(LUMINA + 'reelAppReloj.mjs')
  const { Filmador, esperar, dar } = await import(LUMINA + 'reelMartina.mjs')

  // El dist, servido tal cual (las rutas de Astro son absolutas: /_astro/…).
  const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' }
  const srv = createServer((q, r) => {
    let f = join(DIST, decodeURIComponent(q.url.split('?')[0]))
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
    if (!existsSync(f)) { r.writeHead(404); return r.end() }
    r.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f))
  }).listen(4391)

  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  try {
    const page = await nav.newPage()
    /* 440 × 868: la pantalla del 16 Pro Max SIN sus dos zonas seguras. La web no
       las reserva (no es una app), así que el armado le pone la barra de estado
       arriba y el indicador abajo, como Safari. */
    await page.setViewport({ width: 440, height: 868, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.evaluateOnNewDocument(`try { localStorage.setItem('bl_cookies', 'no') } catch (e) {}`)
    await page.evaluateOnNewDocument(RELOJ_TOTAL)
    await page.goto('http://localhost:4391/', { waitUntil: 'domcontentloaded', timeout: 90000 })
    await esperar(page, `document.readyState === 'complete' && document.querySelector('#inicio')`, 90000)
    await page.evaluate(AYUDAS)
    await dar(page, 3500)
    const y = (sel, aire = 0) => page.evaluate((s, a) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY - a) : 0 }, sel, aire)
    const f = new Filmador(page, 'web', CLIPS)
    f.zonas = { arriba: 54, abajo: 34 }
    f.marca('inicio')
    await f.quieto(2.6)
    f.marca('hacemos')
    /* 70 de aire: el header de la web es fijo y tapaba el rótulo "QUÉ HACEMOS". */
    await f.deslizar(await y('#hacemos', 70), 1.5)
    await f.esconder(0.3)
    await f.quieto(1.8)
    f.marca('identidad')
    const yIdentidad = await page.evaluate(() => { const h = [...document.querySelectorAll('h3')].find((e) => /Identidad/.test(e.textContent)); return h ? Math.round(h.getBoundingClientRect().top + scrollY - 160) : 0 })
    await f.deslizar(yIdentidad, 1.4)
    await f.esconder(0.3)
    await f.quieto(1.8)
    f.marca('proyectos')
    await f.deslizar(await y('#proyectos', 40), 1.6)
    await f.esconder(0.3)
    await f.quieto(2.4)
    f.cerrar()
  } finally { await nav.close(); srv.close() }
  process.exit(0)
}

const { armar } = await import(LUMINA + 'reelArmado.mjs')
await armar({
  nombre: 'brickell-web',
  clips: CLIPS,
  salida: join(AQUI, 'salida', 'reel-web'),
  gancho: ['TU MARCA', 'EN UNA WEB', 'IGUAL A', '<b>OTRAS MIL.</b>'],
  promesa: ['Hecha desde cero,', 'para que se parezca a vos.'],
  actos: [
    { clip: 'web', tramos: [[0.2, 13.9]] },
  ],
  cierre: ['TU MARCA,', 'COMO <b>NINGUNA.</b>'],
  marca: {
    fuentes: '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">',
    frase: 'Diseñamos para vos.',
    sitio: 'labbrickell.com.ar',
    /* La noche de la web (#0f0c1c) y su aurora magenta; Geist, que es la letra
       del sitio. El logo es el PNG blanco de la casa, usado como máscara. */
    css: `
      html, body, .pieza { background:#0f0c1c; }
      .luz.a { background:#e100ff; } .luz.b { background:#7C4DFF; } .luz.c { background:#EC1E79; }
      .capaFono { background:
        radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 46%, rgba(0,0,0,.55) 100%),
        radial-gradient(ellipse 70% 40% at 82% 6%, rgba(225,0,255,.26) 0%, transparent 62%),
        radial-gradient(ellipse 60% 34% at 10% 86%, rgba(124,77,255,.24) 0%, transparent 60%),
        #0f0c1c; }
      .linea span { font-family:'Geist',sans-serif; font-weight:800; letter-spacing:-.035em; }
      .linea b { color:#FF5FA8; }
      .suave span { font-family:'Geist',sans-serif; font-weight:500; }
      .remate b { text-shadow:0 0 60px rgba(236,30,121,calc(.7 * var(--brillo))), 0 0 18px rgba(255,95,168,calc(.5 * var(--brillo))); }
      .marca { width:520px; height:93px; -webkit-mask:url('${LOGO}') center/contain no-repeat; mask:url('${LOGO}') center/contain no-repeat; }
      .filete { background:linear-gradient(90deg,#7C4DFF,#e100ff,#EC1E79); }
      .frase { font-family:'Geist',sans-serif; }
      .sitio { font-family:'Geist Mono',monospace; }`,
  },
})
