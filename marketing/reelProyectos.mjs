// ============================================================
// reelProyectos.mjs — "Lo que construimos": el portfolio adentro de un iPhone
// ============================================================
//
// QUÉ SALE DE ACÁ. Un reel institucional 1080 × 1920 a 30 cuadros, con
// efectos de sonido y SIN MÚSICA (pedido de Gonzalo):
//
//   1. la sección Proyectos de la web en una ventana; el cursor hace clic en
//      la tarjeta de Cenit
//   2. la tarjeta se estira hasta volverse un iPhone casi a pantalla completa
//   3. Cenit se scrollea: un tramo, un salto rápido con barrido y otro tramo
//      (se ven partes, nunca la web entera)
//   4. el teléfono gira y del otro lado está Meridiano
//   5. un toque en la pantalla abre Gadir en un círculo que crece desde el dedo
//   6. el teléfono se va de cuadro y, recién cuando salió entero, sube la
//      noche con la firma: logo, "Diseñamos para vos." y la dirección
//
// ⚠️ APERTURA Y CIERRE EN OSCURO, el medio en claro (decisión 29/09/2026): el
// primer cuadro oscuro con el logo blanco se despega de un feed que es casi
// todo claro, y oscuro → claro → oscuro funciona como un telón que se abre y
// se cierra alrededor de los sitios. La noche es la de la web (#0f0c1c con la
// aurora), la misma de la sección Lúmina: no se inventa nada.
//
//   node marketing/capturarSitios.mjs   → (una vez) los sitios en ancho de iPhone
//   node marketing/reelProyectos.mjs    → el reel
//   node marketing/reelProyectos.mjs --mirar → sólo algunos cuadros sueltos
//   node marketing/reelProyectos.mjs --linkedin → la versión 4:5 (1080×1350)
//
// ⚠️ LINKEDIN VA EN 4:5 Y NO EN 9:16: en el feed de escritorio el vertical se
// ve chico y con bandas, y el 16:9 achica el teléfono, que es el protagonista.
// El 4:5 se ve grande en el celular y en la compu. Es la MISMA escena: todo
// lo que mide el teléfono sale de `FK` (el alto del cuadro / el de Instagram).
//
// ⚠️ MIENTRAS SE VEN LOS SITIOS NO HAY NI UNA LETRA NUESTRA ALREDEDOR: el
// teléfono solo, sobre el fondo claro de la web.
//
// ⚠️ TODO SALE DE `pintar(t)`: la escena es una función del tiempo, así que
// cada cuadro es exacto y repetible (nada de grabar la pantalla en vivo). Los
// sonidos salen de la misma lista de momentos (`EVENTOS`), así que si se
// mueve un tiempo, el sonido se mueve con él.
// ============================================================
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const REEL = join(AQUI, 'salida', 'reel')
const LINKEDIN = process.argv.includes('--linkedin')
const ALTO = LINKEDIN ? 1350 : 1920
/** Escala del teléfono respecto de la versión de Instagram. */
const FK = LINKEDIN ? 0.7225 : 1
const CUADROS = join(REEL, LINKEDIN ? 'cuadros-linkedin' : 'cuadros')
const FPS = 30
const DUR = 19.5
const url = (p) => pathToFileURL(p).href
const WEB = join(AQUI, '..', 'public', 'v4')

// ── Los momentos (en segundos). El sonido se arma con esta misma lista. ──
// `O` es lo que dura la apertura: todo el contenido corre O segundos.
const O = 1.7
const T = {
  logo: 0.15, cortina: 1.3, cortinaFin: 1.95, ventana: 1.45,
  cursorEntra: O + 0.5, clic: O + 1.9,
  morfFin: O + 2.8,
  flip: O + 6.3, flipFin: O + 7.0,
  toque: O + 10.4, circuloFin: O + 11.0,
  // El teléfono se va entero por abajo y RECIÉN AHÍ sube la noche.
  sale: O + 14.0, saleFin: O + 14.75,
  noche: O + 14.8, nocheFin: O + 15.35,
  firma: O + 15.15,
}
const EVENTOS = [
  ['cierre', T.logo + 0.1],
  ['barrido', T.cortina],
  ['clic', T.clic],
  ['barrido', T.clic + 0.05],
  ['salto', O + 4.25], // saltos rápidos de scroll (ver PLANES)
  ['giro', T.flip],
  ['salto', O + 8.35],
  ['toque', T.toque],
  ['barrido', T.toque + 0.08],
  ['salto', O + 12.45],
  ['barrido', T.sale],
  ['cierre', T.firma + 0.15],
]

// El recorrido de cada sitio, en px de pantalla del teléfono (748 de ancho):
// [t0, t1, desde, hasta, rápido?]. El rápido lleva barrido de movimiento.
const PLANES = Object.fromEntries(Object.entries({
  cenit: [[2.8, 4.25, 0, 1350], [4.25, 4.7, 1350, 6150, true], [4.7, 6.3, 6150, 7000]],
  meridiano: [[7.0, 8.35, 0, 1250], [8.35, 8.8, 1250, 5150, true], [8.8, 10.4, 5150, 5900]],
  gadir: [[11.0, 12.45, 0, 1350], [12.45, 12.9, 1350, 6450, true], [12.9, 14.75, 6450, 7300]],
}).map(([k, v]) => [k, v.map(([a, b, ...r]) => [a + O, b + O, ...r])]))

// ============================================================
// LA ESCENA
// ============================================================
const HTML = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: ${ALTO}px; overflow: hidden; background: #F5F5F7; font-family: 'Geist', sans-serif; }
  #fondo { position: absolute; inset: -20%; background:
    radial-gradient(40% 30% at 20% 25%, rgba(255,46,143,.10), transparent 70%),
    radial-gradient(40% 30% at 80% 70%, rgba(124,77,255,.12), transparent 70%); }
  /* La ventana del navegador con la sección Proyectos. */
  #ventana { position: absolute; left: 40px; top: ${Math.round((ALTO - 540) / 2)}px; width: 1000px; border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 40px 90px -40px rgba(11,11,15,.35), 0 0 0 1px rgba(11,11,15,.06); transform-origin: 50% 50%; }
  #ventana .barra { height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 20px; border-bottom: 1px solid #E6E6EA; background: #FAFAFB; }
  #ventana .barra i { width: 13px; height: 13px; border-radius: 50%; background: #E1E1E6; }
  #ventana .barra span { margin: 0 auto; transform: translateX(-24px); font: 500 17px 'Geist Mono', monospace; color: #9A9CA6; background: #F0F0F3; padding: 7px 22px; border-radius: 99px; }
  #ventana img { display: block; width: 1000px; }
  #objetivo { position: absolute; }
  /* El cursor. */
  #cursor { position: absolute; width: 74px; height: 74px; transform-origin: 8px 6px; }
  #onda { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 3px solid rgba(178,60,255,.7); opacity: 0; }
  /* El teléfono. */
  #fono { position: absolute; left: ${540 - 400 * FK}px; top: ${(ALTO - 1674 * FK) / 2}px; width: ${800 * FK}px; height: ${1674 * FK}px; perspective: 2600px; }
  #cuerpo { position: absolute; inset: 0; border-radius: ${133 * FK}px; background: #0b0b0f; box-shadow: 0 0 0 5px #3a3a44, 0 70px 120px -50px rgba(11,11,15,.55); transform-style: preserve-3d; }
  #isla { position: absolute; top: ${48 * FK}px; left: 50%; width: ${214 * FK}px; height: ${62 * FK}px; margin-left: ${-107 * FK}px; border-radius: 99px; background: #000; z-index: 5; }
  /* La pantalla: vive fuera del cuerpo porque también es la tarjeta que se estira. */
  #pantalla { position: absolute; overflow: hidden; background: #000; }
  .capa { position: absolute; inset: 0; overflow: hidden; }
  .capa img { position: absolute; left: 0; top: 0; width: 100%; will-change: transform; }
  #tarjeta { object-fit: cover; width: 100%; height: 100%; position: absolute; inset: 0; }
  #dedo { position: absolute; width: 110px; height: 110px; margin: -55px 0 0 -55px; border-radius: 50%; background: rgba(255,255,255,.55); box-shadow: 0 0 0 3px rgba(255,255,255,.8); opacity: 0; z-index: 6; }
  /* La noche de la apertura y el cierre: la de la web, con su aurora. */
  #noche { position: absolute; inset: 0; background: #0f0c1c; z-index: 20; }
  #noche::before { content: ''; position: absolute; inset: -10%; background:
    radial-gradient(60% 40% at 22% 30%, rgba(122,59,240,.30), transparent 70%),
    radial-gradient(55% 38% at 80% 24%, rgba(196,79,224,.22), transparent 68%),
    radial-gradient(55% 40% at 60% 80%, rgba(255,122,89,.12), transparent 70%); }
  .marca { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 46px; }
  .marca img { width: 640px; }
  .marca i { display: block; width: 96px; height: 6px; border-radius: 3px; background: linear-gradient(90deg,#FF2E8F,#B23CFF 55%,#7C4DFF); transform-origin: left center; }
  /* La frase y la dirección con los valores del cierre de Lúmina (reelRespuestas):
     peso 500 a 54 px, casi blanca; la dirección en mono a 30 px. */
  .marca b { font-weight: 500; font-size: 54px; line-height: 1.22; letter-spacing: -.015em; color: rgba(255,255,255,.94); }
  .marca span { font: 500 30px 'Geist Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.66); }
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="vb" x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation="0 0"/></filter></svg>
<div id="fondo"></div>
<div id="ventana"><div class="barra"><i></i><i></i><i></i><span>labbrickell.com.ar</span></div><div style="position:relative"><img id="seccion" src="${url(join(REEL, 'proyectos.png'))}"><div id="objetivo"></div></div></div>
<div id="fono"><div id="cuerpo"></div><div id="isla"></div></div>
<div id="pantalla">
  <img id="tarjeta" src="${url(join(WEB, 'proyectos', 'cenit.webp'))}">
  <div class="capa" id="c-cenit"><img src="${url(join(REEL, 'sitios', 'cenit.png'))}"></div>
  <div class="capa" id="c-meridiano"><img src="${url(join(REEL, 'sitios', 'meridiano.png'))}"></div>
  <div class="capa" id="c-gadir"><img src="${url(join(REEL, 'sitios', 'gadir.png'))}"></div>
  <div id="dedo"></div>
</div>
<div id="onda"></div>
<svg id="cursor" viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.6-4.4 3 6.7 3.1-1.4-3-6.6 6.4-.4z" fill="#0B0B0F" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
<div id="noche">
  <div class="marca" id="apertura"><img src="${url(join(WEB, 'logo-brickell-blanco.png'))}"><i></i></div>
  <div class="marca" id="firma"><img src="${url(join(WEB, 'logo-brickell-blanco.png'))}"><i></i><b>Diseñamos para vos.</b><span>labbrickell.com.ar</span></div>
</div>
<script>
  const T = ${JSON.stringify(T)}, PLANES = ${JSON.stringify(PLANES)}, ALTO = ${ALTO}, FK = ${FK}
  const $ = (s) => document.querySelector(s)
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
  const tramo = (t, a, b) => cl((t - a) / (b - a))
  const suave = (x) => x * x * (3 - 2 * x)
  const salida = (x) => 1 - Math.pow(1 - x, 3)
  const entrada = (x) => x * x * x
  const inout = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const mix = (a, b, x) => a + (b - a) * x
  // La tarjeta de Cenit dentro de la sección (px de la captura a 1440 de ancho).
  const S = 1000 / 1440, CARD = { x: 406 * S, y: 250 * S, w: 304 * S, h: 190 * S }
  const o = $('#objetivo'); Object.assign(o.style, { left: CARD.x + 'px', top: CARD.y + 'px', width: CARD.w + 'px', height: CARD.h + 'px' })
  const FONO_TOP = (ALTO - 1674 * FK) / 2
  const PANT = { x: 540 - 400 * FK + 26 * FK, y: FONO_TOP + 26 * FK, w: 748 * FK, h: 1622 * FK, r: 101 * FK }

  function scroll(t, plan) {
    let y = plan[0][2], vel = 0
    for (const [a, b, d, h, rapido] of plan) {
      if (t < a) break
      const x = tramo(t, a, b)
      if (rapido) { y = mix(d, h, inout(x)); vel = t <= b ? Math.sin(x * Math.PI) : 0 } else { y = mix(d, h, inout(x)); vel = 0 }
    }
    return { y, vel }
  }
  function pintarSitio(id, t, plan) {
    const { y, vel } = scroll(t, plan)
    const img = $('#c-' + id + ' img')
    img.style.transform = 'translateY(' + (-y * FK) + 'px)'
    return vel
  }

  window.pintar = function (t) {
    // Fondo: respira apenas.
    $('#fondo').style.transform = 'translate(' + Math.sin(t * .3) * 30 + 'px,' + Math.cos(t * .25) * 30 + 'px)'

    // ── 1. La ventana y el clic ──
    const aparece = salida(tramo(t, T.ventana, T.ventana + .6))
    const acerca = inout(tramo(t, T.ventana + .3, T.clic))
    const vVent = $('#ventana')
    const sale = tramo(t, T.clic, T.morfFin)
    vVent.style.opacity = aparece * (1 - salida(sale))
    vVent.style.transformOrigin = (CARD.x + CARD.w / 2 + 40) / 10 + '% 60%'
    vVent.style.transform = 'translateY(' + (1 - aparece) * 40 + 'px) scale(' + (1 + acerca * .32 + sale * .06) + ')'
    vVent.style.filter = 'blur(' + sale * 10 + 'px)'

    const r = o.getBoundingClientRect()
    const blanco = { x: r.left + r.width * .52, y: r.top + r.height * .55 }
    const c = $('#cursor')
    const m = inout(tramo(t, T.cursorEntra, T.clic - .15))
    const cx = mix(930, blanco.x, m), cy = mix(ALTO - 380, blanco.y, m)
    const aprieta = t > T.clic - .06 && t < T.clic + .12 ? .82 : 1
    c.style.left = cx + 'px'; c.style.top = cy + 'px'
    c.style.opacity = tramo(t, T.cursorEntra, T.cursorEntra + .25) * (1 - tramo(t, T.clic + .15, T.clic + .45))
    c.style.transform = 'scale(' + aprieta + ')'
    const on = tramo(t, T.clic, T.clic + .5)
    Object.assign($('#onda').style, { left: blanco.x + 'px', top: blanco.y + 'px', opacity: t >= T.clic ? (1 - on) : 0, transform: 'scale(' + (.3 + on * 1.1) + ')' })

    // ── 2. La tarjeta se estira hasta ser la pantalla ──
    const p = $('#pantalla'), f = $('#fono')
    const mf = inout(tramo(t, T.clic + .05, T.morfFin))
    const desde = { x: r.left, y: r.top, w: r.width, h: r.height, r: 12 }
    const rect = t < T.clic ? desde : { x: mix(desde.x, PANT.x, mf), y: mix(desde.y, PANT.y, mf), w: mix(desde.w, PANT.w, mf), h: mix(desde.h, PANT.h, mf), r: mix(12, PANT.r, mf) }
    Object.assign(p.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', borderRadius: rect.r + 'px' })
    p.style.opacity = t < T.clic ? 0 : 1
    $('#tarjeta').style.opacity = 1 - tramo(t, T.clic + .25, T.clic + .7)
    const cuerpo = salida(tramo(t, T.clic + .3, T.clic + .6))
    f.style.opacity = cuerpo
    f.style.transform = 'scale(' + mix(.9, 1, salida(cuerpo)) + ')'

    // ── 3–5. Los sitios ──
    let vel = 0
    vel = Math.max(vel, pintarSitio('cenit', t, PLANES.cenit))
    vel = Math.max(vel, pintarSitio('meridiano', t, PLANES.meridiano))
    vel = Math.max(vel, pintarSitio('gadir', t, PLANES.gadir))
    $('#vb feGaussianBlur').setAttribute('stdDeviation', '0 ' + (vel * 28 * FK).toFixed(1))
    document.querySelectorAll('.capa').forEach((k) => (k.style.filter = vel > .02 ? 'url(#vb)' : 'none'))

    // Giro: Cenit → Meridiano. El teléfono entero (cuerpo + pantalla) gira en Y.
    const g = tramo(t, T.flip, T.flipFin)
    let ang = 0
    if (g > 0 && g < 1) ang = g < .5 ? inout(g * 2) * 90 : -90 + inout((g - .5) * 2) * 90
    const giro = 'perspective(2600px) rotateY(' + ang + 'deg) scale(' + (1 - Math.sin(g * Math.PI) * .08) + ')'
    // Se va por abajo acelerando (entra lento, sale rápido), con un leve giro.
    const sk = entrada(tramo(t, T.sale, T.saleFin))
    const achica = 'translateY(' + (sk * (ALTO + 180)) + 'px) rotate(' + (sk * 6) + 'deg) scale(' + (1 - sk * .12) + ')'
    ;[f, p].forEach((el) => { el.style.transformOrigin = '540px ' + (ALTO / 2 - (el === p ? rect.y : FONO_TOP)) + 'px' })
    f.style.transform = (g > 0 && g < 1 ? giro : '') + ' ' + achica + ' scale(' + mix(.9, 1, salida(cuerpo)) + ')'
    p.style.transform = (g > 0 && g < 1 ? giro : '') + ' ' + achica
    const verMer = g >= .5
    $('#c-cenit').style.opacity = verMer ? 0 : 1
    $('#c-meridiano').style.opacity = verMer ? 1 : 0

    // Toque + círculo: Meridiano → Gadir.
    const d = $('#dedo'), punto = { x: 500 * FK, y: 1050 * FK }
    const dt = tramo(t, T.toque - .35, T.toque + .25)
    Object.assign(d.style, { left: punto.x + 'px', top: punto.y + 'px', opacity: dt > 0 && dt < 1 ? Math.sin(dt * Math.PI) : 0, transform: 'scale(' + (t < T.toque ? 1 : .8) + ')' })
    const circ = inout(tramo(t, T.toque, T.circuloFin))
    const gd = $('#c-gadir')
    gd.style.opacity = t >= T.toque ? 1 : 0
    gd.style.clipPath = 'circle(' + circ * 1900 + 'px at ' + punto.x + 'px ' + punto.y + 'px)'

    // ── 0 y 6. La noche: apertura (baja como un telón) y cierre (sube) ──
    const noche = $('#noche')
    if (t < T.noche) {
      // Apertura: el logo entra y la rayita se dibuja; después la noche se
      // levanta hacia arriba y deja ver la web.
      const k = inout(tramo(t, T.cortina, T.cortinaFin))
      noche.style.clipPath = 'inset(0 0 ' + (k * 100) + '% 0)'
      noche.style.display = k >= 1 ? 'none' : 'block'
      const la = salida(tramo(t, T.logo, T.logo + .6))
      const ap = $('#apertura')
      ap.style.opacity = la * (1 - tramo(t, T.cortina - .1, T.cortina + .3))
      ap.style.transform = 'translateY(' + ((1 - la) * 30 - k * 260) + 'px)'
      ap.querySelector('i').style.transform = 'scaleX(' + salida(tramo(t, T.logo + .35, T.logo + .95)) + ')'
      $('#firma').style.opacity = 0
    } else {
      // Cierre: recién con el teléfono fuera de cuadro, la noche sube.
      const k = inout(tramo(t, T.noche, T.nocheFin))
      noche.style.display = 'block'
      noche.style.clipPath = 'inset(' + ((1 - k) * 100) + '% 0 0 0)'
      $('#apertura').style.opacity = 0
      const fi = $('#firma')
      const a = (x) => salida(tramo(t, T.firma + x, T.firma + x + .6))
      fi.style.opacity = 1
      fi.querySelector('img').style.cssText = 'opacity:' + a(0) + ';transform:translateY(' + (1 - a(0)) * 30 + 'px)'
      fi.querySelector('i').style.transform = 'scaleX(' + a(.25) + ')'
      fi.querySelector('b').style.cssText = 'opacity:' + a(.4) + ';transform:translateY(' + (1 - a(.4)) * 24 + 'px)'
      fi.querySelector('span').style.opacity = a(.6)
    }
  }
  window.pintar(0)
</script></body></html>`

// ============================================================
// EL SONIDO — sintetizado con ffmpeg, sin música
// ============================================================
const FFMPEG = ['C:/ProgramData/chocolatey/bin/ffmpeg.exe', join(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Links/ffmpeg.exe'), '/usr/bin/ffmpeg', 'ffmpeg'].find((p) => p === 'ffmpeg' || existsSync(p))
const correr = (args) => new Promise((ok, mal) => {
  const p = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] })
  let e = ''; p.stderr.on('data', (d) => (e += d)); p.on('close', (c) => (c === 0 ? ok() : mal(new Error(e))))
})
/** La paleta: cortos, en frecuencias medias, a volumen de efecto (no de música). */
const SONIDOS = {
  clic: 'sine=f=2400:d=0.018,volume=0.55,afade=t=out:st=0.004:d=0.014',
  toque: 'sine=f=1100:d=0.05,volume=0.45,afade=t=out:st=0.01:d=0.04',
  barrido: 'anoisesrc=color=pink:d=0.7:a=0.5,bandpass=f=900:w=700,afade=t=in:d=0.25,afade=t=out:st=0.3:d=0.4,volume=0.9',
  salto: 'anoisesrc=color=pink:d=0.45:a=0.5,bandpass=f=2200:w=1500,afade=t=in:d=0.15,afade=t=out:st=0.18:d=0.27,volume=0.6',
  giro: 'anoisesrc=color=brown:d=0.75:a=0.6,bandpass=f=500:w=400,afade=t=in:d=0.3,afade=t=out:st=0.35:d=0.4,volume=1.2',
  cierre: 'sine=f=660:d=0.5,volume=0.28,afade=t=in:d=0.01,afade=t=out:st=0.05:d=0.45',
}
async function armarSonido(destino) {
  const dir = join(REEL, 'sonidos'); mkdirSync(dir, { recursive: true })
  for (const [n, filtro] of Object.entries(SONIDOS)) await correr(['-f', 'lavfi', '-i', filtro, '-ar', '48000', '-ac', '2', join(dir, n + '.wav')])
  const ins = [], fil = []
  EVENTOS.forEach(([n, t], k) => { ins.push('-i', join(dir, n + '.wav')); const ms = Math.round(t * 1000); fil.push(`[${k}]adelay=${ms}|${ms}[a${k}]`) })
  fil.push(EVENTOS.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${EVENTOS.length}:normalize=0,volume=5,apad=whole_dur=${DUR}[s]`)
  await correr([...ins, '-filter_complex', fil.join(';'), '-map', '[s]', '-t', String(DUR), destino])
}

// ============================================================
// LA CAPTURA — cuadro por cuadro
// ============================================================
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
async function chrome() {
  const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
  const perfil = mkdtempSync(join(tmpdir(), 'bl-reel-'))
  const puerto = 9700 + Math.floor(Math.random() * 90)
  const p = spawn(exe, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let l
  for (let i = 0; i < 60; i++) { try { l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (l.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(l.find((x) => x.type === 'page').webSocketDebuggerUrl)
  ws.binaryType = 'arraybuffer'
  await new Promise((r) => (ws.onopen = r))
  let id = 0; const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1080, height: ALTO, deviceScaleFactor: 1, mobile: false })
  await cmd('Page.enable')
  return { cmd, cerrar: () => { ws.close(); p.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

const mirar = process.argv.includes('--mirar')
if (!existsSync(join(REEL, 'sitios', 'cenit.png'))) { console.error('Falta correr antes: node marketing/capturarSitios.mjs'); process.exit(1) }
rmSync(CUADROS, { recursive: true, force: true }); mkdirSync(CUADROS, { recursive: true })
const escena = join(REEL, LINKEDIN ? 'escena-linkedin.html' : 'escena.html'); writeFileSync(escena, HTML)
const { cmd, cerrar } = await chrome()
try {
  await cmd('Page.navigate', { url: url(escena) })
  await cmd('Runtime.evaluate', { expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await Promise.all([...document.images].map(i=>i.decode().catch(()=>0)))})()`, awaitPromise: true })
  const tiempos = mirar ? [0.2, 0.9, 1.5, 1.7, 2.3, 3.6, 4.3, 15.7, 16.0, 16.3, 16.6, 16.9, 17.3, 18.0, 19.0] : Array.from({ length: DUR * FPS }, (_, n) => n / FPS)
  for (let n = 0; n < tiempos.length; n++) {
    await cmd('Runtime.evaluate', { expression: `new Promise(r=>{pintar(${tiempos[n]});requestAnimationFrame(()=>requestAnimationFrame(r))})`, awaitPromise: true })
    const s = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1080, height: ALTO, scale: 1 } })
    writeFileSync(join(CUADROS, `${String(n).padStart(4, '0')}.jpg`), Buffer.from(s.result.data, 'base64'))
    if (n % 30 === 0) console.log('cuadro', n, '/', tiempos.length)
  }
} finally { cerrar() }

if (!mirar) {
  const audio = join(REEL, 'sonido.wav')
  await armarSonido(audio)
  const salida = join(REEL, LINKEDIN ? 'reel-proyectos-linkedin.mp4' : 'reel-proyectos.mp4')
  await correr(['-framerate', String(FPS), '-i', join(CUADROS, '%04d.jpg'), '-i', audio, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', salida])
  console.log('✓', salida, readdirSync(CUADROS).length, 'cuadros')
}
