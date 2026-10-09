// ============================================================
// nuevasPublicaciones.mjs — la camada con GANCHO de Brickell Lab
// ============================================================
// La misma regla que la camada de Lúmina de esta noche (9/10/2026):
// gancho primero —la pregunta que nombra a la persona—, contenido
// después, y siempre cerrar con la solución a un mensaje de distancia.
// Los ganchos son literalmente los que dictó Gonzalo:
//   «¿Tuviste una idea para tu negocio y no sabés llevarla a cabo?»
//   «Tu negocio puede no necesitar una web…»
//   «No todos los comercios necesitan la misma web.»
//
// Estética: la de la web y el feed —papel blanco, Geist, el rótulo
// mono con la rayita de la marca, filetes grises, y la noche #0f0c1c
// con la aurora rosa→violeta para abrir y cerrar—. Formas nuevas
// adentro del sistema: la placa-manifiesto con el degradé en la
// palabra clave, y el cierre de noche con el WhatsApp en grande.
//
//   node marketing/nuevasPublicaciones.mjs            → todo
//   node marketing/nuevasPublicaciones.mjs la-idea    → una pieza
//   node marketing/nuevasPublicaciones.mjs reel       → sólo el reel
//
// Salida: marketing/salida/nuevas-publicaciones/<pieza>/
// ============================================================
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SALIDA = join(AQUI, 'salida', 'nuevas-publicaciones')
const img = (r) => pathToFileURL(join(AQUI, '..', 'public', 'v4', r)).href
const foto = (r) => pathToFileURL(join(AQUI, 'fotos', r)).href

const M = 88
const FORMATOS = {
  post: { ancho: 1080, alto: 1350, arriba: 76, abajo: 72 },
  historia: { ancho: 1080, alto: 1920, arriba: 250, abajo: 340 },
}

const BASE = (f) => `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
  :root {
    --papel:#FFFFFF; --tinta:#0B0B0F; --gris:#5E606B; --gris-2:#9A9CA6;
    --linea:#E6E6EA; --suave:#F5F5F7; --noche:#0f0c1c;
    --marca:linear-gradient(90deg,#FF2E8F,#B23CFF 55%,#7C4DFF);
    --marca-txt:linear-gradient(90deg,#FF4FA3,#BA55FF 55%,#8C6BFF);
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { width:${f.ancho}px; height:${f.alto}px; overflow:hidden; }
  body { font-family:'Geist',system-ui,sans-serif; color:var(--tinta); background:var(--papel); -webkit-font-smoothing:antialiased; }
  .placa { position:relative; width:${f.ancho}px; height:${f.alto}px; overflow:hidden; }
  .rotulo { display:grid; gap:18px; justify-items:start; font-family:'Geist Mono',monospace; font-weight:500;
            font-size:26px; letter-spacing:.14em; text-transform:uppercase; color:var(--gris); }
  .rotulo::after { content:''; width:56px; height:4px; border-radius:2px; background:var(--marca); }
  h1,h2 { font-weight:600; letter-spacing:-.035em; line-height:1.02; text-wrap:balance; }
  .color { background:var(--marca-txt); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .bajada { color:var(--gris); font-size:36px; line-height:1.42; text-wrap:balance; }
  .pie { position:absolute; left:${M}px; right:${M}px; bottom:${f.abajo}px; display:flex; align-items:center; gap:28px; }
  .pie img { height:40px; }
  .pie i { flex:1; height:2px; background:var(--linea); }
  .pie span { font-family:'Geist Mono',monospace; font-size:26px; letter-spacing:.1em; text-transform:uppercase; color:var(--gris); }
  .conteo { position:absolute; right:${M}px; top:${f.arriba}px; font-family:'Geist Mono',monospace; font-size:26px;
            letter-spacing:.14em; color:var(--gris-2); font-variant-numeric:tabular-nums; }
  .oscura { background:var(--noche); color:#fff; }
  .oscura .rotulo { color:rgba(255,255,255,.6); }
  .oscura .bajada { color:rgba(255,255,255,.72); }
  .oscura .pie i { background:rgba(255,255,255,.16); }
  .oscura .pie span { color:rgba(255,255,255,.6); }
  .sobre-foto .conteo { color:rgba(255,255,255,.8); }
  .sobre-foto .rotulo, .sobre-foto .bajada { color:rgba(255,255,255,.85); }
</style>`

let F = FORMATOS.post
const pie = (oscura = false) => `<div class="pie"><img src="${img(oscura ? 'logo-brickell-blanco.png' : 'logo-brickell.png')}" alt=""><i></i><span>labbrickell.com.ar</span></div>`
const conteo = (k, n) => (n > 1 && F === FORMATOS.post ? `<span class="conteo">${k} / ${n}</span>` : '')
const pagina = (cuerpo, clase = '') => `<!doctype html><html lang="es"><head><meta charset="utf-8">${BASE(F)}</head><body><div class="placa ${clase}">${cuerpo}</div></body></html>`
const centro = (gap, html) => `<div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba}px;bottom:${F.abajo + 110}px;display:flex;flex-direction:column;justify-content:center;gap:${gap}px">${html}</div>`

const WHATSAPP = '+54 9 11 2460 9038'

/** El gancho sobre foto — la tapa que frena el pulgar. */
const ganchoFoto = ({ archivo, pos = 'center', rotulo, titulo, bajada, k, total }) => pagina(`
  <img src="${archivo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos}">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,15,.45) 0%,rgba(11,11,15,.05) 30%,rgba(11,11,15,0) 44%,rgba(11,11,15,.84) 76%,rgba(11,11,15,.93) 100%)"></div>
  ${conteo(k, total)}
  <div style="position:absolute;left:${M}px;right:${M}px;bottom:${F.abajo + 130}px;display:grid;gap:30px">
    <p class="rotulo">${rotulo}</p>
    <h1 style="font-size:${F.alto > 1500 ? 116 : 104}px;color:#fff">${titulo}</h1>
    ${bajada ? `<p class="bajada" style="max-width:25ch">${bajada}</p>` : ''}
  </div>
  ${pie(true)}`, 'oscura sobre-foto')

/** La placa de texto del sistema. */
const texto = ({ rotulo, titulo, bajada, abajo = '', k, total, tam = 96 }) => pagina(`
  ${conteo(k, total)}
  ${centro(44, `
    <p class="rotulo">${rotulo}</p>
    <h2 style="font-size:${tam}px">${titulo}</h2>
    ${bajada ? `<p class="bajada" style="max-width:28ch">${bajada}</p>` : ''}
    ${abajo}`)}
  ${pie()}`)

const lista = (items) => `<div style="display:grid;border-top:2px solid var(--linea);margin-top:12px">${items.map(([t, d]) => `
  <div style="display:grid;gap:8px;padding:26px 0;border-bottom:2px solid var(--linea)">
    <span style="font-size:44px;font-weight:600;letter-spacing:-.03em">${t}</span>
    <span style="font-size:34px;line-height:1.4;color:var(--gris)">${d}</span>
  </div>`).join('')}</div>`

/** EL MANIFIESTO — la forma nueva: la frase enorme con la palabra en degradé. */
const manifiesto = ({ titulo, bajada, k, total, tam = 120 }) => pagina(`
  ${conteo(k, total)}
  ${centro(48, `
    <h1 style="font-size:${tam}px">${titulo}</h1>
    ${bajada ? `<p class="bajada" style="max-width:26ch;font-size:40px">${bajada}</p>` : ''}`)}
  ${pie()}`)

/** EL CIERRE DE NOCHE — la aurora de la casa y el WhatsApp en grande. */
const cierreNoche = ({ titulo, bajada, k, total }) => pagina(`
  <div style="position:absolute;inset:-10%;background:
    radial-gradient(70% 55% at 18% 32%, rgba(178,60,255,.30), transparent 68%),
    radial-gradient(60% 50% at 78% 22%, rgba(255,46,143,.24), transparent 66%),
    radial-gradient(55% 45% at 62% 78%, rgba(124,77,255,.18), transparent 70%)"></div>
  ${conteo(k, total)}
  ${centro(42, `
    <h1 style="font-size:112px;color:#fff">${titulo}</h1>
    ${bajada ? `<p class="bajada" style="max-width:26ch">${bajada}</p>` : ''}
    <div style="display:grid;gap:14px;margin-top:10px">
      <span style="font-family:'Geist Mono',monospace;font-size:27px;letter-spacing:.26em;text-transform:uppercase" class="color">Escribinos por WhatsApp</span>
      <span style="font-size:68px;font-weight:600;letter-spacing:-.03em;white-space:nowrap;color:#fff">${WHATSAPP.replace(/ /g, '\u00a0')}</span>
    </div>`)}
  ${pie(true)}`, 'oscura')

// ════════════════════════════════════════════════════════════
// LAS PIEZAS
// ════════════════════════════════════════════════════════════

/* A · «¿Tuviste una idea?» — la estrella */
const LA_IDEA = () => {
  const T = 5
  return [
    ganchoFoto({ k: 1, total: T, archivo: foto('necesidad/libreta-idea-2.jpg'), pos: 'center 40%',
      rotulo: 'Para tu negocio',
      titulo: '¿Tuviste una idea y no sabés llevarla a cabo?',
      bajada: 'Esa que anotaste hace meses y volvés a pensar cada vez que cerrás.' }),
    texto({ k: 2, total: T, rotulo: 'Te suena', titulo: 'La idea es buena. El freno es técnico.', tam: 92,
      bajada: 'Un sistema de turnos. Un catálogo que se actualice solo. Dejar de pasar pedidos a mano. No es un capricho: es tu día a día pidiendo una herramienta.' }),
    texto({ k: 3, total: T, rotulo: 'La buena noticia', titulo: 'No tenés por qué saber programar.', tam: 92,
      bajada: 'Tu oficio es tu negocio. El nuestro es convertir ideas en plataformas digitales que lo impulsen: webs, sistemas, herramientas a medida.' }),
    texto({ k: 4, total: T, rotulo: 'Cómo arranca', titulo: 'Nos la contás como te salga.', tam: 96,
      bajada: 'Sin papeles ni tecnicismos. Te decimos cómo la haríamos, en cuánto tiempo y cuánto sale — y después decidís vos.' }),
    cierreNoche({ k: 5, total: T, titulo: 'Contanos tu idea. Hacela real.',
      bajada: 'La primera charla no cuesta nada, y te vas con un plan.' }),
  ]
}

/* B · «Tu negocio puede no necesitar una web» — la placa-manifiesto ESTRELLA */
const NO_NECESITAS_WEB = () => [
  manifiesto({
    titulo: 'Tu negocio puede no necesitar una web. Pero sí <span class="color">una plataforma</span> que te saque de encima esa tarea que odiás.',
    bajada: 'Turnos, pedidos, stock, cobros: eso repetitivo que hacés a mano todos los días se puede automatizar. Contanos tu idea y hacela real.',
    tam: 96 }),
]

/* C · «No todos los comercios necesitan la misma web» */
const NO_LA_MISMA_WEB = () => {
  const T = 5
  return [
    ganchoFoto({ k: 1, total: T, archivo: foto('necesidad/duena-cafe-1.jpg'), pos: 'center 30%',
      rotulo: 'Diseño con intención',
      titulo: 'No todos los comercios necesitan la misma web.',
      bajada: 'Porque no todos los negocios venden igual.' }),
    texto({ k: 2, total: T, rotulo: 'Cada uno, lo suyo', titulo: 'Lo que el tuyo necesita depende de cómo vendés.', tam: 84,
      abajo: lista([
        ['La cafetería', 'Que la encuentren cerca y lleguen.'],
        ['El gimnasio', 'Que reserven la clase sin llamar.'],
        ['La tienda', 'Que el catálogo venda, también de noche.'],
      ]) }),
    texto({ k: 3, total: T, rotulo: 'Nuestra forma', titulo: 'Primero miramos cómo trabajás. Después diseñamos.', tam: 84,
      bajada: 'No vendemos plantillas: armamos la web o la herramienta que a tu negocio le falta. Chica o grande, pero tuya.' }),
    ganchoFoto({ k: 4, total: T, archivo: foto('necesidad/persiana-noche-2.jpg'), pos: 'center',
      rotulo: 'Mientras tanto',
      titulo: 'Y trabaja cuando vos cerrás.',
      bajada: 'Las respuestas, los turnos y los pedidos no tienen horario de local.' }),
    cierreNoche({ k: 5, total: T, titulo: '¿Qué necesita el tuyo?',
      bajada: 'Contanos de tu negocio: te decimos qué haríamos, en cuánto tiempo y cuánto sale.' }),
  ]
}

const PIEZAS = {
  'la-idea': LA_IDEA,
  'no-necesitas-web': NO_NECESITAS_WEB,
  'no-la-misma-web': NO_LA_MISMA_WEB,
}

// ════════════════════════════════════════════════════════════
// EL REEL — la gramática de los reels de la casa: noche → papel → noche
// ════════════════════════════════════════════════════════════
const R = { ancho: 1080, alto: 1920 }
const paginaReel = (css, cuerpo, clase = '') => {
  const Fv = F; F = R
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">${BASE(R)}<style>
    .banda { position:absolute; left:84px; right:160px; top:280px; bottom:460px;
             display:flex; flex-direction:column; justify-content:center; gap:44px; }
    ${css}</style></head><body><div class="placa ${clase}">${cuerpo}</div></body></html>`
  F = Fv
  return html
}

const reelNoche = (logo, titulo, extra = '') => paginaReel(`
  h1 { font-size:124px; color:#fff; }
`, `
  <div style="position:absolute;inset:-10%;background:
    radial-gradient(70% 55% at 18% 32%, rgba(178,60,255,.30), transparent 68%),
    radial-gradient(60% 50% at 78% 22%, rgba(255,46,143,.24), transparent 66%),
    radial-gradient(55% 45% at 62% 78%, rgba(124,77,255,.18), transparent 70%)"></div>
  <div class="banda">
    ${logo ? `<img src="${img('logo-brickell-blanco.png')}" alt="" style="height:88px;width:auto;align-self:flex-start">` : ''}
    <h1>${titulo}</h1>
    ${extra}
  </div>`, 'oscura')

const reelPapel = (titulo, bajada = '', tam = 124) => paginaReel(`
  h1 { font-size:${tam}px; }
  .bajada { font-size:44px; }
`, `
  <div class="banda">
    <p class="rotulo">Brickell Lab</p>
    <h1>${titulo}</h1>
    ${bajada ? `<p class="bajada" style="max-width:20ch">${bajada}</p>` : ''}
  </div>`)

const CUADROS_REEL = [
  { html: reelNoche(true, '¿Tuviste una idea para tu&nbsp;negocio?'), dura: 3.0 },
  { html: reelPapel('¿…y no sabés llevarla a&nbsp;cabo?'), dura: 2.6 },
  { html: reelPapel('Nosotros&nbsp;sí.', '', 160), dura: 2.2 },
  { html: reelPapel('Webs. Sistemas. <span class="color">Plataformas a&nbsp;medida.</span>', 'Herramientas que impulsan tu negocio.'), dura: 3.2 },
  { html: reelNoche(true, 'Contanos tu idea. <span class="color">Hacela&nbsp;real.</span>', `
      <div style="display:grid;gap:14px">
        <span style="font-family:'Geist Mono',monospace;font-size:30px;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.65)">Escribinos por WhatsApp</span>
        <span style="font-size:72px;font-weight:600;letter-spacing:-.03em;white-space:nowrap;color:#fff">+54&nbsp;9&nbsp;11&nbsp;2460&nbsp;9038</span>
        <span style="font-family:'Geist Mono',monospace;font-size:28px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)">labbrickell.com.ar</span>
      </div>`), dura: 4.4 },
]
const FUNDE = 0.6

// ── Captura y armado ─────────────────────────────────────────
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync)
const tmp = mkdtempSync(join(tmpdir(), 'bl-nuevas-'))

async function capturar(html, png, ancho, alto) {
  const htmlPath = join(tmp, `${Math.random().toString(36).slice(2)}.html`)
  writeFileSync(htmlPath, html, 'utf8')
  await new Promise((res, rej) => {
    const p = spawn(CHROME, ['--headless=new', `--screenshot=${png}`, `--window-size=${ancho},${alto}`,
      '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=10000',
      pathToFileURL(htmlPath).href])
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`chrome ${c}`))))
  })
}

const pedido = process.argv[2]

if (!pedido || PIEZAS[pedido]) {
  const cuales = pedido ? { [pedido]: PIEZAS[pedido] } : PIEZAS
  for (const [nombre, armar] of Object.entries(cuales)) {
    const carpeta = join(SALIDA, nombre)
    mkdirSync(carpeta, { recursive: true })
    for (const [medida, f] of Object.entries(FORMATOS)) {
      F = f
      const placas = armar()
      for (let i = 0; i < placas.length; i++) {
        const base = placas.length > 1 ? `${String(i + 1).padStart(2, '0')}-${medida}` : medida
        await capturar(placas[i], join(carpeta, `${base}.png`), f.ancho, f.alto)
      }
      console.log(`✓ ${nombre} (${medida}, ${placas.length})`)
    }
  }
}

if (!pedido || pedido === 'reel') {
  const carpeta = join(SALIDA, 'reel-la-idea')
  mkdirSync(carpeta, { recursive: true })
  for (let i = 0; i < CUADROS_REEL.length; i++) {
    await capturar(CUADROS_REEL[i].html, join(carpeta, `cuadro-${i + 1}.png`), R.ancho, R.alto)
    console.log(`✓ reel cuadro ${i + 1}`)
  }
  const entradas = [], filtros = []
  CUADROS_REEL.forEach((c, i) => {
    entradas.push('-loop', '1', '-t', String(c.dura), '-i', join(carpeta, `cuadro-${i + 1}.png`))
    filtros.push(`[${i}:v]scale=${R.ancho * 2}:${R.alto * 2},zoompan=z='min(1+0.0023*on,1.07)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${Math.round(c.dura * 30)}:s=${R.ancho}x${R.alto}:fps=30,setsar=1[v${i}]`)
  })
  let cadena = 'v0', t = 0
  for (let i = 1; i < CUADROS_REEL.length; i++) {
    t += CUADROS_REEL[i - 1].dura - FUNDE
    const salida = i === CUADROS_REEL.length - 1 ? 'vf' : `x${i}`
    filtros.push(`[${cadena}][v${i}]xfade=transition=fade:duration=${FUNDE}:offset=${t.toFixed(2)}[${salida}]`)
    cadena = salida
  }
  const total = CUADROS_REEL.reduce((s, c) => s + c.dura, 0) - FUNDE * (CUADROS_REEL.length - 1)
  const mp4 = join(carpeta, 'reel-la-idea.mp4')
  await new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', ...entradas,
      '-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-filter_complex', filtros.join(';'),
      '-map', '[vf]', '-map', `${CUADROS_REEL.length}:a`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-crf', '18', '-preset', 'medium',
      '-c:a', 'aac', '-shortest', mp4], { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => { err += d })
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(err.slice(-600)))))
  })
  console.log(`✓ reel (${total.toFixed(1)}s): ${mp4}`)
}
console.log('\nListo:', SALIDA)
