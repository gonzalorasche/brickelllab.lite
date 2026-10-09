// ============================================================
// generar.mjs — publicaciones de Instagram de Brickell Lab
// ============================================================
//
// CÓMO FUNCIONA (igual que el de Lúmina): cada placa es una página HTML con la
// estética de la web —Geist + Geist Mono, blanco y tinta, el rótulo mono con la
// rayita de la marca, filetes grises— y Chrome headless la captura a
// 1080 × 1350. El texto vive acá, en datos: cambiar una frase y volver a
// generar es un comando.
//
//   node marketing/generar.mjs              → todas, post (1080×1350) e historia (1080×1920)
//   node marketing/generar.mjs estudio      → sólo las que empiezan así
//
// Salida: marketing/salida/<serie>/ (posts) y <serie>-historia/ (historias)
//
// ⚠️ LAS IMÁGENES SALEN DE LA WEB (public/v4). No se copian: si cambia una
// captura en la web, la placa la toma sola la próxima vez.
//
// ⚠️ EL ARCHIVO MIDE 1080 PERO SE VE A ~390 EN EL TELÉFONO (× 0,36). Pisos:
// cuerpo 34 px (≈ 12 pt), rótulos 26 px (≈ 9 pt). Nada más chico.
// ============================================================

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const WEB = join(AQUI, '..', 'public', 'v4')
const SALIDA = join(AQUI, 'salida')
const img = (ruta) => pathToFileURL(join(WEB, ruta)).href
/** Las fotos de las piezas educativas (marketing/fotos, no van al repo). */
const foto = (ruta) => pathToFileURL(join(AQUI, 'fotos', ruta)).href
/** Material de identidad que pasó Gonzalo (docs/identidad). */
const doc = (ruta) => pathToFileURL(join(AQUI, '..', 'docs', ruta)).href

const ANCHO = 1080
const M = 88 // margen lateral
/**
 * LOS DOS FORMATOS. ⚠️ La historia tiene zonas que tapa Instagram y no son
 * simétricas: arriba la foto de perfil (250 px), abajo la barra de responder
 * (340 px). Todo lo escrito vive entre las dos.
 */
const FORMATOS = {
  post: { alto: 1350, arriba: 76, abajo: 72 },
  historia: { alto: 1920, arriba: 250, abajo: 340 },
}
let F = FORMATOS.post

// ── El sistema de la web, en px de placa ─────────────────────
const BASE = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
  :root {
    --papel: #FFFFFF; --tinta: #0B0B0F; --gris: #5E606B; --gris-2: #9A9CA6;
    --linea: #E6E6EA; --suave: #F5F5F7; --noche: #0f0c1c;
    --marca: linear-gradient(90deg, #FF2E8F, #B23CFF 55%, #7C4DFF);
    --marca-txt: linear-gradient(90deg, #FF4FA3, #BA55FF 55%, #8C6BFF);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${ANCHO}px; overflow: hidden; }
  body { font-family: 'Geist', system-ui, sans-serif; color: var(--tinta); background: var(--papel); -webkit-font-smoothing: antialiased; }
  .placa { position: relative; width: ${ANCHO}px; overflow: hidden; }
  .rotulo { display: grid; gap: 18px; justify-items: start; font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 26px; letter-spacing: .14em; text-transform: uppercase; color: var(--gris); }
  .rotulo::after { content: ''; width: 56px; height: 4px; border-radius: 2px; background: var(--marca); }
  .meta { font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 26px; letter-spacing: .14em; text-transform: uppercase; color: var(--gris-2); }
  h1, h2 { font-weight: 600; letter-spacing: -.035em; line-height: 1.02; text-wrap: balance; }
  .color { background: var(--marca-txt); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .bajada { color: var(--gris); font-size: 36px; line-height: 1.42; text-wrap: balance; }
  /* El pie de todas las placas: logo, filete y el sitio. */
  .pie { position: absolute; left: ${M}px; right: ${M}px; display: flex; align-items: center; gap: 28px; }
  .pie img { height: 40px; }
  .pie i { flex: 1; height: 2px; background: var(--linea); }
  .pie span { font-family: 'Geist Mono', monospace; font-size: 26px; letter-spacing: .1em; text-transform: uppercase; color: var(--gris); }
  .conteo { position: absolute; right: ${M}px; font-family: 'Geist Mono', monospace; font-size: 26px; letter-spacing: .14em; color: var(--gris-2); font-variant-numeric: tabular-nums; }
  .oscura { background: var(--noche); color: #fff; }
  .oscura .rotulo { color: rgba(255,255,255,.6); }
  .oscura .bajada { color: rgba(255,255,255,.72); }
  .oscura .pie i { background: rgba(255,255,255,.16); }
  .oscura .pie span { color: rgba(255,255,255,.6); }
  .sobre-foto .conteo { color: rgba(255,255,255,.8); }
  .sobre-foto .rotulo, .sobre-foto .bajada { color: rgba(255,255,255,.85); }
</style>`

const pie = (oscura = false) => `<div class="pie" style="bottom:${F.abajo}px"><img src="${img(oscura ? 'logo-brickell-blanco.png' : 'logo-brickell.png')}" alt=""><i></i><span>labbrickell.com.ar</span></div>`
const conteo = (k, n) => (n > 1 ? `<span class="conteo" style="top:${F.arriba}px">${k} / ${n}</span>` : '')
const pagina = (cuerpo, clase = '') => `<!doctype html><html lang="es"><head><meta charset="utf-8">${BASE}<style>html,body,.placa{height:${F.alto}px}</style></head><body><div class="placa ${clase}">${cuerpo}</div></body></html>`
/** Caja centrada en la zona útil (entre `arriba` y el pie). */
const centro = (gap, html) => `<div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba}px;bottom:${F.abajo + 110}px;display:flex;flex-direction:column;justify-content:center;gap:${gap}px">${html}</div>`

// ── El iPad y el iPhone de "Qué hacemos", en px de placa ─────
// Las mismas proporciones que la web: iPad 11" apaisado atrás, iPhone 15
// adelante con su centro en el borde derecho del iPad.
function aparatos({ esc, tel, ancla = 'left top', alto = 520 }) {
  const h = alto / 100 // 1 "cqh"
  return `
  <div style="position:relative;width:${155 * h}px;height:${114 * h}px;margin:0 auto">
    <div style="position:absolute;left:0;top:${12 * h}px;width:${136.6 * h}px;padding:${2.56 * h}px;border-radius:${6.4 * h}px;background:#16161b;box-shadow:0 0 0 ${0.53 * h}px #3a3a44,0 ${6.4 * h}px ${12.8 * h}px -${4.27 * h}px rgba(11,11,15,.35)">
      <div style="position:relative;aspect-ratio:2360/1640;overflow:hidden;border-radius:${3.84 * h}px;background:#fff">
        <img src="${esc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${ancla}">
      </div>
    </div>
    <div style="position:absolute;left:${(136.6 - 18.65) * h}px;top:${35.6 * h}px;width:${37.3 * h}px;padding:${1.2 * h}px;border-radius:${6.19 * h}px;background:#0b0b0f;box-shadow:0 0 0 ${0.53 * h}px #4a4a55,0 ${6.4 * h}px ${10.7 * h}px -${3.2 * h}px rgba(11,11,15,.45)">
      <div style="position:relative;aspect-ratio:1179/2556;overflow:hidden;border-radius:${5.04 * h}px;background:#fff">
        <img src="${tel}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top">
      </div>
      <i style="position:absolute;top:${2.24 * h}px;left:50%;width:${10 * h}px;height:${3 * h}px;border-radius:99px;background:#000;transform:translateX(-50%)"></i>
    </div>
  </div>`
}

// ============================================================
// LAS SERIES
// ============================================================
const SERVICIOS = [
  { n: 'Desarrollo web', t: 'Sitios y landings desde cero, sin plantillas: rápidos, a medida y fáciles de encontrar.', esc: 'hacemos/vesna-escritorio.webp', tel: 'hacemos/vesna-telefono.webp', ancla: 'right top' },
  { n: 'Productos digitales', t: 'Plataformas con usuarios y datos reales: paneles, sistemas internos y MVPs.', esc: 'hacemos/lumina-dashboard-escritorio.webp', tel: 'hacemos/lumina-dashboard-telefono.webp', ancla: 'left top' },
  { n: 'Identidad y diseño', t: 'Un sistema visual que vive igual en una web, un packaging o una pantalla.', esc: 'hacemos/bloombud-escritorio.webp', tel: 'hacemos/bloombud-telefono.webp', ancla: 'center' },
]
const WA = `<svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.18-1.5A9.93 9.93 0 1 0 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.07.9.92-3-.2-.31a8.22 8.22 0 1 1 6.84 3.74Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.96-.14.17-.29.19-.53.06a6.74 6.74 0 0 1-3.37-2.94c-.25-.44.25-.41.72-1.36.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.78 2.78 0 0 0-.87 2.07 4.83 4.83 0 0 0 1.01 2.56 11.05 11.05 0 0 0 4.23 3.74c1.57.68 2.19.74 2.98.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>`

/**
 * LAS SERIES, ARMADAS PARA EL FORMATO ACTUAL (`F`). De cada una sale el post
 * (1080×1350) y la historia (1080×1920). En la historia, "Qué hacemos" no
 * lleva contador ni "Deslizá": son historias que se pasan solas.
 */
function armarSeries() {
  const H = F === FORMATOS.historia
  const S = {}

  // ── 1. Presentación: la frase del hero ──
  S['estudio-presentacion'] = [
    pagina(`${centro(H ? 72 : 56, `
      <p class="rotulo">Estudio de diseño y desarrollo web</p>
      <h1 style="font-size:${H ? 150 : 132}px">Diseñamos lo que tu marca <span class="color">todavía no tiene.</span></h1>
      <p class="bajada" style="max-width:24ch">Sitios, plataformas y productos digitales, de la idea al código.</p>`)}
      ${pie()}`),
  ]

  // ── 2. Qué hacemos ──
  const tapa = pagina(`
    ${H ? '' : conteo(1, SERVICIOS.length + 1)}
    ${centro(56, `
      <p class="rotulo">Qué hacemos</p>
      <h1 style="font-size:150px">De la idea al código.</h1>
      <div style="display:grid;border-top:2px solid var(--linea)">
        ${SERVICIOS.map((s) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:30px 0;border-bottom:2px solid var(--linea)"><span style="font-size:48px;font-weight:600;letter-spacing:-.03em">${s.n}</span>${H ? '' : '<span class="meta">Deslizá →</span>'}</div>`).join('')}
      </div>`)}
    ${pie()}`)
  const servicio = (s, k) => pagina(`
    ${H ? '' : conteo(k + 2, SERVICIOS.length + 1)}
    <div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba}px;display:grid;gap:30px">
      <p class="rotulo">Qué hacemos</p>
      <h2 style="font-size:${H ? 104 : 92}px;margin-top:10px">${s.n}</h2>
      <p class="bajada" style="max-width:26ch">${s.t}</p>
    </div>
    <div style="position:absolute;left:0;right:0;top:${H ? 860 : 600}px">${aparatos({ esc: img(s.esc), tel: img(s.tel), ancla: s.ancla, alto: H ? 560 : 500 })}</div>
    ${pie()}`)
  S['estudio-que-hacemos'] = [tapa, ...SERVICIOS.map(servicio)]

  // ── 3. El estudio: la oficina ──
  const foto = H ? 1000 : 700
  S['estudio-el-estudio'] = [
    pagina(`
      <div style="position:absolute;left:0;right:0;top:0;height:${foto}px;overflow:hidden">
        <img src="${img('estudio-oficina.webp')}" style="width:100%;height:100%;object-fit:cover;object-position:center ${H ? 50 : 58}%">
      </div>
      <div style="position:absolute;left:${M}px;right:${M}px;top:${foto + 72}px;display:grid;gap:30px">
        <p class="rotulo">El estudio</p>
        <h2 style="font-size:84px">Un nombre que es una forma de trabajar.</h2>
        <p class="bajada" style="font-size:34px;max-width:32ch">Nació en Buenos Aires, inspirado por una ciudad que nunca termina de construirse: Brickell, Miami.</p>
      </div>
      ${pie()}`),
  ]

  // ── 4. Lúmina: en la noche con aurora ──
  S['estudio-lumina'] = [
    pagina(`
      <div style="position:absolute;inset:-10%;background:
        radial-gradient(70% 55% at 18% 32%, rgba(122,59,240,.32), transparent 68%),
        radial-gradient(60% 50% at 78% 22%, rgba(196,79,224,.26), transparent 66%),
        radial-gradient(55% 45% at 62% 78%, rgba(255,122,89,.16), transparent 70%)"></div>
      <div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba}px;display:grid;gap:30px">
        <p class="rotulo">Producto propio</p>
        <h2 style="font-size:96px">Lúmina.</h2>
        <p class="bajada" style="max-width:28ch">La plataforma para casamientos y fiestas de quince: la invitación y el panel para organizar todo. La pensamos, la diseñamos y la construimos nosotros.</p>
      </div>
      <img src="${img('lumina-fonos.webp')}" style="position:absolute;left:50%;bottom:${F.abajo + 80}px;height:${H ? 860 : 640}px;transform:translateX(-50%)">
      ${pie(true)}`, 'oscura'),
  ]

  // ── 5. Contacto ──
  S['estudio-contacto'] = [
    pagina(`${centro(48, `
      <p class="rotulo">Contacto</p>
      <h1 style="font-size:140px">Contanos tu idea.</h1>
      <p class="bajada" style="max-width:28ch">No hace falta que el proyecto esté definido. Te decimos cómo lo haríamos, en cuánto tiempo y cuánto sale.</p>
      <div style="display:grid;gap:18px;margin-top:20px">
        <span class="color" style="font-size:66px;font-weight:600;letter-spacing:-.045em">info@labbrickell.com.ar</span>
        <span style="display:flex;align-items:center;gap:18px;font-size:48px;font-weight:600;letter-spacing:-.035em">+54 9 11 2460 9038 ${WA}</span>
      </div>`)}
      ${pie()}`),
  ]

  // ── Promo A: te busca la IA ──
  S['promo-busqueda-ia'] = [
    pagina(`${centro(H ? 64 : 52, `
      <p class="rotulo">Visibilidad</p>
      <h1 style="font-size:${H ? 140 : 118}px">Ya no te busca solo Google. Ahora te busca <span class="color">la IA.</span></h1>
      <p class="bajada" style="max-width:27ch">Preparamos tu web para que los buscadores y los asistentes de IA la entiendan y te muestren cuando alguien pregunta por lo que hacés.</p>`)}
      ${pie()}`),
  ]

  // ── Promo B: una web linda no vende sola ──
  S['promo-web-vende'] = [
    pagina(`${centro(H ? 52 : 40, `
      <p class="rotulo">Diseño con intención</p>
      <h1 style="font-size:${H ? 140 : 116}px">Una web linda <span class="color">no vende sola.</span></h1>
      <div style="display:grid;border-top:2px solid var(--linea)">
        ${[
          ['Carga rápido', 'Si tarda en abrir, se van antes de verla.'],
          ['Se entiende en 5 segundos', 'Qué hacés y para quién, sin tener que buscarlo.'],
          ['La encuentran', 'Armada para que Google y las IA la muestren.'],
        ].map(([t, d]) => `<div style="padding:${H ? 34 : 26}px 0;border-bottom:2px solid var(--linea)"><div style="font-size:${H ? 52 : 44}px;font-weight:600;letter-spacing:-.03em">${t}</div><div class="bajada" style="font-size:34px;margin-top:8px">${d}</div></div>`).join('')}
      </div>`)}
      ${pie()}`),
  ]

  armarEducativas(S, H)
  armarCarrito(S, H)
  return S
}

// ============================================================
// EL CARRITO — "7 de cada 10 carritos se abandonan"
// ============================================================
// ⚠️ EL NÚMERO TIENE FUENTE Y VA AL PIE: Baymard Institute, que promedia los
// estudios publicados sobre abandono de carrito (da alrededor de un 70 %). Los
// motivos de la segunda placa son los que más se repiten en esos mismos
// estudios; van sin porcentajes porque cambian de un año a otro.
//
// ⚠️ LAS PANTALLAS SON DE BRUMA USADA DE VERDAD (capturarBruma.mjs): el
// estante lleno, el total, la ficha con el tamaño elegido y el momento de
// agregar. Bruma es una tienda que diseñó el estudio, no un cliente: por eso
// la placa dice "la diseñamos", nunca "nuestro cliente".
//
// ⚠️ EL TELÉFONO SE CORTA DEL LADO QUE NO IMPORTA. Si lo que se cuenta está
// arriba en la pantalla (el estante, la portada) sale por abajo; si está abajo
// (el total, el selector de tamaño, el aviso) sale por arriba y el texto va
// debajo.
const BRUMA = (ruta) => pathToFileURL(join(AQUI, 'salida', 'bruma', 'pantallas', ruta)).href

/**
 * El iPhone solo, como en linkedin.mjs: borde de verdad, sombra blanda.
 *
 * ⚠️ CON BARRA DE ESTADO: las capturas de la tienda arrancan con su cabecera
 * pegada arriba, y la isla del teléfono quedaba encima del título ("Tu
 * estan█te"). Un iPhone de verdad reserva esa franja (47 de 844), así que la
 * pantalla lleva la hora y los íconos, y la página empieza debajo. `ancla`
 * dice qué parte de la captura se conserva: arriba si el teléfono se corta
 * por abajo, abajo si se corta por arriba.
 */
const ICONOS = `<svg viewBox="0 0 68 14" style="height:100%;width:auto"><g fill="#0B0B0F"><rect x="0" y="8" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="7" rx="1"/><rect x="10" y="3.5" width="3" height="9.5" rx="1"/><rect x="15" y="1" width="3" height="12" rx="1"/><path d="M30 4.2a9 9 0 0 1 12 0l-1.4 1.5a7 7 0 0 0-9.2 0Zm2.8 3a5 5 0 0 1 6.4 0l-1.5 1.5a3 3 0 0 0-3.4 0Zm3.2 2.4 1.6 1.7-1.6 1.6-1.6-1.6Z"/><rect x="47" y="1.5" width="18" height="11" rx="3.2" fill="none" stroke="#0B0B0F" stroke-opacity=".45"/><rect x="49" y="3.5" width="12.5" height="7" rx="1.8"/><rect x="66" y="5" width="1.6" height="4" rx=".8" fill-opacity=".45"/></g></svg>`
function fono(src, alto, ancla = 'top') {
  const w = alto / 2.0927
  const barra = w * 0.9072 * (47 / 390) // la franja de estado, en px de pantalla
  return `
  <div style="position:relative;width:${w}px;padding:${w * 0.0322}px;border:${w * 0.0142}px solid #4a4a55;border-radius:${w * 0.166}px;background:#0b0b0f;box-shadow:0 ${w * 0.16}px ${w * 0.3}px -${w * 0.1}px rgba(26,22,32,.45)">
    <div style="position:relative;aspect-ratio:390/844;overflow:hidden;border-radius:${w * 0.135}px;background:#F4F2F5;display:flex;flex-direction:column">
      <div style="flex:none;height:${barra}px;display:flex;align-items:center;justify-content:space-between;padding:${barra * 0.18}px ${barra * 0.62}px 0 ${barra * 0.72}px;font:600 ${barra * 0.36}px -apple-system,'Geist',sans-serif;color:#0B0B0F">
        <span>9:41</span><span style="height:${barra * 0.27}px">${ICONOS}</span>
      </div>
      <img src="${src}" style="flex:1;min-height:0;width:100%;object-fit:cover;object-position:${ancla === 'bottom' ? 'bottom' : 'top'}">
    </div>
    <i style="position:absolute;top:${w * 0.06}px;left:50%;width:${w * 0.268}px;height:${w * 0.08}px;border-radius:99px;background:#000;transform:translateX(-50%)"></i>
  </div>`
}

/** La niebla de Bruma: un degradé de color, desenfocado, detrás del teléfono. */
const niebla = (tono, x, y, d, o = 0.7) => `<i style="position:absolute;left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;border-radius:50%;background:radial-gradient(closest-side,${tono},transparent);filter:blur(24px);opacity:${o}"></i>`

function armarCarrito(S, H) {
  const T = 8
  const n = (k) => (H ? '' : conteo(k, T))
  const FONDO = '#F4F2F5' // la niebla lila de Bruma
  const alto = H ? 1480 : 1172

  /** Texto arriba, teléfono que se va por abajo. */
  const fonoAbajo = ({ k, pantalla, tonos, rotulo, titulo, tam = 92, bajada, extra = '', top }) => pagina(`
    <div style="position:absolute;inset:0;background:${FONDO}"></div>
    ${tonos}
    ${n(k)}
    <div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba + (H ? 20 : 40)}px;display:grid;gap:26px">
      <p class="rotulo">${rotulo}</p>
      <h2 style="font-size:${tam}px">${titulo}</h2>
      ${bajada ? `<p class="bajada" style="max-width:30ch">${bajada}</p>` : ''}
      ${extra}
    </div>
    <div style="position:absolute;left:50%;top:${top ?? (H ? 860 : 700)}px;transform:translateX(-50%)">${fono(BRUMA(pantalla), alto)}</div>`)

  /** Teléfono que entra por arriba, texto abajo. */
  const fonoArriba = ({ k, pantalla, tonos, rotulo, titulo, tam = 88, bajada, extra = '' }) => {
    const base = H ? 1030 : 740 // dónde termina el teléfono (en la historia, arriba de la barra de responder)
    return pagina(`
    <div style="position:absolute;inset:0;background:${FONDO}"></div>
    ${tonos}
    <div style="position:absolute;left:50%;top:${base - alto}px;transform:translateX(-50%)">${fono(BRUMA(pantalla), alto, 'bottom')}</div>
    ${extra}
    ${n(k)}
    <div style="position:absolute;left:${M}px;right:${M}px;top:${base + (H ? 70 : 56)}px;display:grid;gap:22px">
      <p class="rotulo">${rotulo}</p>
      <h2 style="font-size:${tam}px">${titulo}</h2>
      ${bajada ? `<p class="bajada" style="max-width:32ch">${bajada}</p>` : ''}
    </div>
    ${pie()}`)
  }

  const fuente = `<p class="meta" style="margin-top:6px">Fuente: Baymard Institute</p>`
  const motivos = `<div style="display:grid;border-top:2px solid var(--linea);margin-top:12px">${[
    ['Costos que aparecen al final', 'El envío o un recargo recién en el último paso.'],
    ['Tener que crear una cuenta', 'Para comprar una vez, nadie quiere otra contraseña.'],
    ['No confiar en el sitio', 'Si se ve descuidado, nadie pone su tarjeta.'],
    ['Un pago largo y confuso', 'Cada paso de más es una puerta para irse.'],
  ].map(([t, d]) => `
    <div style="display:grid;gap:8px;padding:24px 0;border-bottom:2px solid var(--linea)">
      <span style="font-size:44px;font-weight:600;letter-spacing:-.03em">${t}</span>
      <span style="font-size:34px;line-height:1.4;color:var(--gris)">${d}</span>
    </div>`).join('')}</div>`

  // La lupa sobre la bolsa: el contador que cambió, agrandado. Sale de la
  // misma captura, con la bolsa (x 1010, y 102 en px de la captura) al centro.
  const lupa = (d) => {
    const z = 1.45, cx = 1010, cy = 104
    return `<div style="position:absolute;right:${H ? 96 : 70}px;top:${H ? 300 : 150}px;width:${d}px;height:${d}px;border-radius:50%;border:6px solid #fff;box-shadow:0 30px 60px -20px rgba(26,22,32,.45);
      background:url('${BRUMA('agregado.jpg')}') ${-(cx * z - d / 2)}px ${-(cy * z - d / 2)}px / ${1170 * z}px auto no-repeat #fff"></div>`
  }

  // La portada del reel de Bruma (reelCarrito.mjs). Sólo existe en vertical:
  // sale en marketing/salida/portada-reel-carrito-historia/01.png.
  // ⚠️ LO IMPORTANTE VA ENTRE y 300 E y 1640: es lo que queda en el recorte
  // 3:4 de la grilla del perfil.
  if (H) S['portada-reel-carrito'] = [
    // 01 · La noche: la misma del arranque del reel. Es la que va: en la
    // grilla, casi toda clara, un cuadro oscuro se ve antes que los demás.
    pagina(`
      <div style="position:absolute;inset:-10%;background:
        radial-gradient(60% 40% at 22% 30%, rgba(122,59,240,.32), transparent 70%),
        radial-gradient(55% 38% at 80% 24%, rgba(196,79,224,.24), transparent 68%),
        radial-gradient(55% 40% at 60% 80%, rgba(255,122,89,.14), transparent 70%)"></div>
      ${niebla('#E5847F', 540, 1350, 1000, 0.35)}
      <div style="position:absolute;left:${M}px;right:${M}px;top:320px;display:grid;gap:34px">
        <img src="${img('logo-brickell-blanco.png')}" style="height:46px;width:auto;justify-self:start" alt="">
        <h1 style="font-size:118px;color:#fff">¿Tu tienda online da ganas de <span class="color">comprar?</span></h1>
      </div>
      <div style="position:absolute;left:50%;top:930px;transform:translateX(-50%)">${fono(BRUMA('estante.jpg'), 1500)}</div>`, 'oscura'),
    // 02 · La clara, por si se prefiere.
    pagina(`
      <div style="position:absolute;inset:0;background:${FONDO}"></div>
      ${niebla('#C49ADB', 300, 1500, 1100)}${niebla('#E5847F', 860, 1250, 800, 0.55)}
      <div style="position:absolute;left:${M}px;right:${M}px;top:330px;display:grid;gap:30px">
        <p class="rotulo">Tiendas online</p>
        <h1 style="font-size:116px">¿Tu tienda da ganas de <span class="color">comprar?</span></h1>
      </div>
      <div style="position:absolute;left:50%;top:880px;transform:translateX(-50%)">${fono(BRUMA('estante.jpg'), 1500)}</div>`),
  ]

  S['edu-carrito'] = [
    // 1. La tapa: el número, y el estante lleno saliendo por abajo.
    fonoAbajo({
      k: 1, pantalla: 'estante.jpg', top: H ? 980 : 720,
      tonos: niebla('#C49ADB', 300, H ? 1400 : 1050, 900) + niebla('#E5847F', 820, H ? 1250 : 940, 700, 0.55),
      rotulo: 'Tiendas online', tam: H ? 112 : 100,
      titulo: '<span class="color">7 de cada 10</span> carritos se abandonan.',
      bajada: 'Y muchas veces no es por el producto: es por el camino hasta pagar.',
      extra: fuente,
    }),
    // 2. Por qué.
    pagina(`
      ${n(2)}
      ${centro(36, `
        <p class="rotulo">Por qué se van</p>
        <h2 style="font-size:88px">Los motivos que más se repiten.</h2>
        ${motivos}
        ${fuente}`)}
      ${pie()}`),
    // 3. El caso.
    fonoAbajo({
      k: 3, pantalla: 'portada.jpg',
      tonos: niebla('#C49ADB', 540, H ? 1450 : 1100, 1000),
      rotulo: 'Un caso', titulo: 'Así lo resolvimos en Bruma.', tam: H ? 100 : 92,
      bajada: 'Una perfumería que diseñamos: frascos, decants y un carrito que se arma como un estante.',
    }),
    // 4. El total.
    fonoArriba({
      k: 4, pantalla: 'total.jpg',
      tonos: niebla('#9CB3D6', 360, H ? 700 : 420, 800) + niebla('#F3C1CE', 760, H ? 900 : 560, 700, 0.6),
      rotulo: 'Costos', titulo: 'Ningún costo sorpresa.',
      bajada: 'El total, las cuotas y el envío se ven antes de pagar, no en el último paso.',
    }),
    // 5. Elegir.
    fonoArriba({
      k: 5, pantalla: 'ficha.jpg',
      tonos: niebla('#E5847F', 540, H ? 760 : 460, 900, 0.6),
      rotulo: 'Elegir', titulo: 'Cada opción, con su precio.',
      bajada: 'Decant o frasco: el total cambia en el botón antes de agregar.',
    }),
    // 6. La confirmación, con la lupa sobre la bolsa.
    fonoArriba({
      k: 6, pantalla: 'agregado.jpg',
      tonos: niebla('#E5B4D6', 540, H ? 760 : 460, 900, 0.7),
      rotulo: 'Confirmación', titulo: 'Que se note lo que agregaste.',
      bajada: 'La bolsa suma uno y un aviso lo confirma. Nadie se queda con la duda.',
      extra: lupa(H ? 300 : 250),
    }),
    // 7. La idea.
    pagina(`
      ${n(7)}
      ${centro(44, `
        <p class="rotulo">Diseño y código</p>
        <h2 style="font-size:${H ? 112 : 104}px">Un carrito lindo que no funciona no vende.</h2>
        <p class="bajada" style="max-width:28ch">Y uno que funciona pero se ve descuidado, tampoco: nadie pone su tarjeta en un sitio que no le da confianza.</p>`)}
      ${pie()}`),
    // 8. El cierre de la serie.
    pagina(`
      ${n(8)}
      ${centro(48, `
        <p class="rotulo">Brickell Lab</p>
        <h1 style="font-size:124px">¿Tu tienda vende o espanta?</h1>
        <p class="bajada" style="max-width:28ch">Contanos tu idea: te decimos cómo lo haríamos, en cuánto tiempo y cuánto sale.</p>
        <div style="display:grid;gap:18px;margin-top:16px">
          <span class="color" style="font-size:62px;font-weight:600;letter-spacing:-.045em">info@labbrickell.com.ar</span>
          <span style="display:flex;align-items:center;gap:18px;font-size:46px;font-weight:600;letter-spacing:-.035em">+54 9 11 2460 9038 ${WA}</span>
        </div>`)}
      ${pie()}`),
  ]
}

// ============================================================
// LAS EDUCATIVAS — carruseles para que el negocio entienda por qué
// ============================================================
// ⚠️ NINGÚN NÚMERO INVENTADO: nada de "el 75 % de los usuarios…". Si algún día
// se quiere un dato, va con su fuente al pie; mientras, se argumenta sin cifras.
//
// Tres formas de placa, todas del sistema de la web:
//   fotoTapa  foto a sangre con un velo abajo y el titular en blanco
//   texto     la placa tipográfica: rótulo, titular, bajada (y algo abajo)
//   compara   "Así no / Así sí" entre filetes
const MARCA_FOTOS = 'diseno-de-marca/' // Gonzalo las pasó todas juntas acá

function armarEducativas(S, H) {
  const n = (k, total) => (H ? '' : conteo(k, total))
  const fotoTapa = ({ archivo, pos = 'center', rotulo, titulo, bajada, k, total }) => pagina(`
    <img src="${archivo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos}">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,15,.28) 0%,rgba(11,11,15,0) 28%,rgba(11,11,15,0) 42%,rgba(11,11,15,.82) 78%,rgba(11,11,15,.9) 100%)"></div>
    ${n(k, total)}
    <div style="position:absolute;left:${M}px;right:${M}px;bottom:${F.abajo + 130}px;display:grid;gap:28px">
      <p class="rotulo">${rotulo}</p>
      <h1 style="font-size:${H ? 120 : 108}px">${titulo}</h1>
      ${bajada ? `<p class="bajada" style="max-width:26ch">${bajada}</p>` : ''}
    </div>
    ${pie(true)}`, 'oscura sobre-foto')
  const texto = ({ rotulo, titulo, bajada, abajo = '', k, total, tam = 96 }) => pagina(`
    ${n(k, total)}
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
  const compara = ({ tema, no, si, k, total }) => pagina(`
    ${n(k, total)}
    ${centro(40, `
      <p class="rotulo">Bien hecha vs. no</p>
      <h2 style="font-size:104px">${tema}</h2>
      <div style="display:grid;border-top:2px solid var(--linea);margin-top:16px">
        <div style="display:grid;gap:14px;padding:34px 0;border-bottom:2px solid var(--linea)">
          <span class="meta" style="color:var(--gris-2)">✕ &nbsp;Así no</span>
          <span style="font-size:44px;line-height:1.3;color:var(--gris);letter-spacing:-.02em">${no}</span>
        </div>
        <div style="display:grid;gap:14px;padding:34px 0;border-bottom:2px solid var(--linea)">
          <span class="meta color" style="width:max-content">✓ &nbsp;Así sí</span>
          <span style="font-size:48px;line-height:1.28;font-weight:600;letter-spacing:-.03em">${si}</span>
        </div>
      </div>`)}
    ${pie()}`)
  const cierre = ({ titulo, k, total }) => pagina(`
    ${n(k, total)}
    ${centro(48, `
      <p class="rotulo">Brickell Lab</p>
      <h1 style="font-size:124px">${titulo}</h1>
      <p class="bajada" style="max-width:28ch">Contanos tu idea: te decimos cómo lo haríamos, en cuánto tiempo y cuánto sale.</p>
      <div style="display:grid;gap:18px;margin-top:16px">
        <span class="color" style="font-size:62px;font-weight:600;letter-spacing:-.045em">info@labbrickell.com.ar</span>
        <span style="display:flex;align-items:center;gap:18px;font-size:46px;font-weight:600;letter-spacing:-.035em">+54 9 11 2460 9038 ${WA}</span>
      </div>`)}
    ${pie()}`)

  // ── A. Cómo una web posiciona tu negocio ──
  {
    const T = 7
    S['edu-web-posiciona'] = [
      fotoTapa({ archivo: foto(MARCA_FOTOS + '20322.jpg'), pos: 'center 30%', rotulo: 'Tu negocio en internet', titulo: 'Te están buscando ahora mismo.', bajada: '¿Te encuentran a vos o a tu competencia?', k: 1, total: T }),
      texto({ k: 2, total: T, rotulo: 'Cómo se busca hoy', titulo: 'Lo primero que hace alguien que te necesita es buscarte.', tam: 88, bajada: 'En Google, en Maps y, cada vez más, preguntándole a una inteligencia artificial. Si no aparecés ahí, para esa persona no existís.' }),
      texto({ k: 3, total: T, rotulo: 'Redes vs. web', titulo: 'Instagram no alcanza.', tam: 120, bajada: 'Una red muestra lo que publicaste hoy. Una web contesta lo que te preguntan siempre: qué hacés, cuánto sale, dónde estás y cómo te contactan.' }),
      fotoTapa({ archivo: foto(MARCA_FOTOS + '2147694592.jpg'), pos: '62% center', rotulo: 'El costo de no tenerla', titulo: 'Si tu web no contesta, te llaman.', bajada: 'Cada pregunta que el sitio no responde es una consulta que se pierde o un llamado más en tu día.', k: 4, total: T }),
      texto({ k: 5, total: T, rotulo: 'Qué hace que te encuentren', titulo: 'Lo que mira Google (y las IA).', tam: 84, abajo: lista([
        ['Que cargue rápido', 'Sobre todo en el teléfono, que es desde donde te buscan.'],
        ['Que diga qué hacés y dónde', 'Textos claros, no frases que podría firmar cualquiera.'],
        ['Que esté bien armada por dentro', 'SEO técnico: lo que no se ve, pero Google lee.'],
        ['Que una IA la pueda citar', 'GEO: información ordenada para que te recomienden.'],
      ]) }),
      fotoTapa({ archivo: foto(MARCA_FOTOS + '3985.jpg'), pos: 'center 40%', rotulo: 'El resultado', titulo: 'Una web bien hecha trabaja mientras vos atendés.', k: 6, total: T }),
      cierre({ titulo: '¿Tu web te trae clientes?', k: 7, total: T }),
    ]
  }

  // ── B. Una web bien hecha vs. una que no ──
  {
    const T = 7
    S['edu-web-bien-hecha'] = [
      fotoTapa({ archivo: foto(MARCA_FOTOS + '245324.jpg'), pos: '32% center', rotulo: 'Web bien hecha vs. web que no', titulo: 'Una web que no carga es una puerta cerrada.', bajada: 'Cinco diferencias que tus clientes notan aunque no sepan explicarlas.', k: 1, total: T }),
      compara({ k: 2, total: T, tema: 'Velocidad', no: 'Tarda en abrir y la gente se va antes de verla.', si: 'Abre al instante, aunque haya mala señal.' }),
      compara({ k: 3, total: T, tema: 'Celular', no: 'Hay que hacer zoom y mover la pantalla para leer.', si: 'Pensada primero para el teléfono.' }),
      compara({ k: 4, total: T, tema: 'Mensaje', no: 'Frases lindas que podría decir cualquiera.', si: 'Dice en cinco segundos qué hacés y para quién.' }),
      compara({ k: 5, total: T, tema: 'Contacto', no: 'Un formulario perdido al final de todo.', si: 'WhatsApp y mail a un toque, en cada pantalla.' }),
      compara({ k: 6, total: T, tema: 'Google', no: 'Existe, pero nadie la encuentra.', si: 'Armada para que Google y las IA la entiendan y la muestren.' }),
      cierre({ titulo: '¿La tuya cuál es?', k: 7, total: T }),
    ]
  }

  // ── C. La marca no es un logo ──
  {
    const T = 6
    S['edu-diseno-de-marca'] = [
      fotoTapa({ archivo: foto(MARCA_FOTOS + '2150248179.jpg'), pos: 'center', rotulo: 'Diseño de marca', titulo: 'La marca no es un logo.', bajada: 'Es todo lo que dice quién sos antes de que abras la boca.', k: 1, total: T }),
      texto({ k: 2, total: T, rotulo: 'Qué es una marca', titulo: 'Es cómo te reconocen cuando no estás.', tam: 96, bajada: 'Colores, tipografías, tono, fotos, packaging, la web, un aviso: piezas distintas que tienen que hablar con la misma voz.' }),
      texto({ k: 3, total: T, rotulo: 'Por qué importa', titulo: 'La gente confía en lo que se ve cuidado.', tam: 96, bajada: 'Una marca prolija se lee como un negocio serio. Una desprolija hace dudar, aunque el producto sea bueno.' }),
      pagina(`
        ${n(4, T)}
        <div style="position:absolute;left:${M}px;right:${M}px;top:${F.arriba}px;display:grid;gap:30px">
          <p class="rotulo">Un caso: Bloom Bud</p>
          <h2 style="font-size:${H ? 100 : 88}px;margin-top:10px">La misma marca en todos lados.</h2>
          <p class="bajada" style="max-width:28ch">Una web, un aviso en historias y el packaging: un solo sistema visual.</p>
        </div>
        <div style="position:absolute;left:0;right:0;top:${H ? 900 : 640}px">${aparatos({ esc: img('hacemos/bloombud-escritorio.webp'), tel: img('hacemos/bloombud-telefono.webp'), ancla: 'center', alto: H ? 560 : 470 })}</div>
        ${pie()}`),
      pagina(`
        ${n(5, T)}
        <img src="${doc('identidad/Captura de pantalla 2026-01-04 194755.png')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,15,0) 45%,rgba(11,11,15,.85) 100%)"></div>
        <div style="position:absolute;left:${M}px;right:${M}px;bottom:${F.abajo + 130}px;display:grid;gap:26px">
          <p class="rotulo">Un sistema, no una pieza suelta</p>
          <h2 style="font-size:88px">Cada producto nuevo ya sabe cómo tiene que verse.</h2>
        </div>
        ${pie(true)}`, 'oscura sobre-foto'),
      cierre({ titulo: '¿Tu marca dice quién sos?', k: 6, total: T }),
    ]
  }

  // ════════════════════════════════════════════════════════
  // LA CAMADA DE NECESIDAD (octubre 2026) — generar la necesidad, no
  // describir el servicio. Pedido de Gonzalo, con estas palabras: "hacerle
  // pensar a la gente que a veces tiene una idea para su negocio, algo que
  // posiblemente lo ayude en el día a día pero no lo sabe implementar", y
  // "la venta tiene que ser emocional y no fría".
  //
  // ⚠️ LAS FOTOS SON DE UNSPLASH (fotos/necesidad/, con _creditos.txt al
  // lado): licencia libre para uso comercial. Se eligieron las que NO
  // muestran caras reconocibles ni marcas ajenas — las que sí, quedaron en
  // la carpeta como repuesto y no se usan.
  //
  // ⚠️ NINGUNA PROMESA QUE EL ESTUDIO NO CUMPLA: "te decimos cómo lo
  // haríamos, en cuánto tiempo y cuánto sale" ya está publicado en
  // estudio-contacto; "si no te suma, te lo decimos" es la postura de la
  // casa dicha de frente. Sin números inventados, como todas las educativas.
  // ════════════════════════════════════════════════════════

  // ── D. La idea que tenés anotada ──
  {
    const T = 5
    S['necesidad-la-idea'] = [
      fotoTapa({ archivo: foto('necesidad/libreta-idea-2.jpg'), pos: 'center 40%',
        rotulo: 'Esa idea que tenés', titulo: 'La tenés anotada hace meses.',
        bajada: 'Eso que harías en tu negocio si supieras por dónde empezar.', k: 1, total: T }),
      texto({ k: 2, total: T, rotulo: 'Te suena', titulo: 'La pensás cada vez que cerrás.', tam: 96,
        bajada: 'Un sistema para los turnos. Un catálogo que se actualice solo. Dejar de pasar pedidos a mano. No es un capricho: es tu día a día pidiendo ayuda.' }),
      texto({ k: 3, total: T, rotulo: 'El freno', titulo: 'No sabés implementarla. No tenés por qué.', tam: 84,
        bajada: 'Tu oficio es tu negocio. El nuestro es convertir ideas en software: una web, un sistema, una herramienta que te saque trabajo de encima.' }),
      texto({ k: 4, total: T, rotulo: 'Cómo trabajamos', titulo: 'Nos la contás como te salga.', tam: 96,
        bajada: 'No hace falta que esté definida ni escrita en técnico. Te decimos cómo la haríamos, en cuánto tiempo y cuánto sale. Después decidís vos.' }),
      cierre({ titulo: '¿Cuál es la tuya?', k: 5, total: T }),
    ]
  }

  // ── E. «Una web es cara» ──
  {
    const T = 5
    S['necesidad-web-inversion'] = [
      fotoTapa({ archivo: foto('necesidad/duena-cafe-1.jpg'), pos: 'center 30%',
        rotulo: 'Hablemos de plata', titulo: '«Una web es cara.»',
        bajada: 'Depende de qué esté pagando.', k: 1, total: T }),
      texto({ k: 2, total: T, rotulo: 'El reencuadre', titulo: 'Cara es la que no hace nada.', tam: 104,
        bajada: 'Una web que solo existe es un gasto, salga lo que salga. Una que contesta, muestra y vende es otra cosa: trabaja.' }),
      texto({ k: 3, total: T, rotulo: 'Qué paga', titulo: 'Mientras atendés, ella también atiende.', tam: 88, abajo: lista([
        ['Contesta lo de siempre', 'Horarios, precios, dónde estás, cómo pedirte.'],
        ['Te encuentra el que te busca', 'En Google, en Maps y cuando le preguntan a una IA.'],
        ['Muestra tu laburo en serio', 'Con la seriedad que tu negocio ya tiene en persona.'],
      ]) }),
      texto({ k: 4, total: T, rotulo: 'La verdad', titulo: 'No es para todos. Y te lo decimos.', tam: 88,
        bajada: 'Si una web no le va a sumar a tu negocio, te lo decimos antes de cobrarte. Cuando sí suma, deja de ser un gasto: es una inversión que se paga sola.' }),
      cierre({ titulo: '¿La tuya qué sería?', k: 5, total: T }),
    ]
  }

  // ── F. El día a día que se puede digitalizar ──
  {
    const T = 6
    S['necesidad-dia-a-dia'] = [
      fotoTapa({ archivo: foto('necesidad/persiana-noche-2.jpg'), pos: 'center',
        rotulo: 'Tu negocio, de noche', titulo: 'Tu local cierra. Tu negocio no debería.',
        bajada: 'Lo que te preguntan a las once de la noche también es una venta.', k: 1, total: T }),
      texto({ k: 2, total: T, rotulo: 'Eso también se puede', titulo: 'Los turnos, sin el ida y vuelta.', tam: 96,
        bajada: 'Una agenda online que muestra los horarios libres y reserva sola. Vos te enterás; no coordinás.' }),
      texto({ k: 3, total: T, rotulo: 'Eso también se puede', titulo: 'El catálogo, sin reenviar fotos.', tam: 96,
        bajada: 'Un link con tus productos y los precios al día, y un botón que arma el pedido por WhatsApp.' }),
      texto({ k: 4, total: T, rotulo: 'Eso también se puede', titulo: 'Lo que te preguntan siempre, respondido una sola vez.', tam: 76,
        bajada: 'Horarios, precios, ubicación, formas de pago: una página que contesta mientras vos trabajás.' }),
      texto({ k: 5, total: T, rotulo: 'A medida', titulo: 'Tu negocio no es genérico. Tu solución tampoco.', tam: 84,
        bajada: 'No vendemos plantillas: miramos cómo trabajás y armamos la herramienta que te falta. Chica o grande, pero tuya.' }),
      cierre({ titulo: '¿Qué te está comiendo tiempo?', k: 6, total: T }),
    ]
  }
}

// ============================================================
// LA CAPTURA — Chrome headless por el protocolo de depuración
// ============================================================
function buscarChrome() {
  return [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find(existsSync)
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), 'bl-mkt-'))
  const puerto = 9400 + Math.floor(Math.random() * 400)
  const chrome = spawn(buscarChrome(), ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let lista
  for (let i = 0; i < 60; i++) {
    try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (lista.length) break } catch {}
    await esperar(250)
  }
  const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: 1920, deviceScaleFactor: 1, mobile: false })
  await cmd('Page.enable')
  return { cmd, cerrar: () => { ws.close(); chrome.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

async function capturar(cmd, html, destino, alto) {
  const tmp = join(tmpdir(), `bl-placa-${process.pid}.html`)
  writeFileSync(tmp, html)
  await cmd('Page.navigate', { url: pathToFileURL(tmp).href })
  // Tipografías e imágenes cargadas antes de sacar la foto.
  await cmd('Runtime.evaluate', { expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await new Promise(r=>setTimeout(r,300))})()`, awaitPromise: true })
  const s = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: ANCHO, height: alto, scale: 1 } })
  writeFileSync(destino, Buffer.from(s.result.data, 'base64'))
}

const filtro = process.argv[2]
const { cmd, cerrar } = await abrirChrome()
try {
  for (const [formato, sufijo] of [['post', ''], ['historia', '-historia']]) {
    F = FORMATOS[formato]
    for (const [serie, placas] of Object.entries(armarSeries())) {
      const nombre = serie + sufijo
      if (filtro && !nombre.startsWith(filtro)) continue
      const dir = join(SALIDA, nombre)
      rmSync(dir, { recursive: true, force: true })
      mkdirSync(dir, { recursive: true })
      for (let k = 0; k < placas.length; k++) {
        await capturar(cmd, placas[k], join(dir, `${String(k + 1).padStart(2, '0')}.png`), F.alto)
        console.log('✓', nombre, k + 1)
      }
    }
  }
} finally {
  cerrar()
}
