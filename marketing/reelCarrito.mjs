// ============================================================
// reelCarrito.mjs — "Una tienda que da ganas de comprar": Bruma, usada
// ============================================================
//
// QUÉ SALE DE ACÁ. Un reel 1080 × 1920 a 30 cuadros, mudo (pista de silencio,
// para que en Instagram se le pueda poner música del catálogo):
//
//   1. la noche con el logo y la pregunta
//   2. el teléfono sobre la niebla de Bruma: la tienda se recorre, se abre el
//      Baccarat, se lee cómo evoluciona en la piel, se elige el frasco y se
//      agrega (el frasco vuela a la bolsa); después un decant de La Vie est
//      Belle; el aviso lleva al estante y se suma uno más
//   3. la noche con la firma: logo, "Diseñamos para vos." y la dirección
//
//   node marketing/reelCarrito.mjs              → graba la tienda y arma el reel
//   node marketing/reelCarrito.mjs --componer   → sólo rearma (usa la grabación)
//   node marketing/reelCarrito.mjs --mirar      → cuadros sueltos del reel
//
// ⚠️ LA TIENDA SE GRABA CON UN RELOJ NUESTRO. Sacar cada foto tarda más que un
// cuadro: con el reloj de verdad las animaciones correrían cinco veces más
// rápido que el video y todo se vería a los saltos. Por eso, antes de que
// cargue la página, se reemplazan Date, performance.now, setTimeout y
// requestAnimationFrame por un reloj que avanza 1/30 de segundo por cuadro, y
// cada animación (transiciones CSS, keyframes y la del frasco que vuela) se
// pausa y se pone en su segundo exacto. Así el video es la tienda tal cual se
// mueve, cuadro por cuadro, y es repetible.
//
// ⚠️ SE GRABA EN 390 × 797, NO EN 390 × 844: el teléfono del reel tiene su
// barra de estado (47 px arriba, la hora y los íconos). Si la tienda ocupara
// la pantalla entera, la isla le taparía la cabecera; si se recortara abajo,
// se perderían el aviso y los botones fijos. La tienda mide lo que queda.
//
// ⚠️ MIENTRAS SE VE LA TIENDA NO HAY NI UNA LETRA NUESTRA ALREDEDOR (como en
// el reel de proyectos): el teléfono solo. El fondo es la niebla de Bruma y
// cambia de color con el perfume que se está mirando.
// ============================================================

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const TIENDA = join(AQUI, '..', 'docs', 'proyectos', 'perfumeria.html')
const WEB = join(AQUI, '..', 'public', 'v4')
const DIR = join(AQUI, 'salida', 'reel-carrito')
const GRABACION = join(DIR, 'tienda')
const CUADROS = join(DIR, 'cuadros')
const url = (p) => pathToFileURL(p).href
const FPS = 30
const ANCHO = 390, ALTO = 797, DPR = 2

// ============================================================
// EL GUION DE LA TIENDA (segundos de la grabación)
// ============================================================
// Cada toque: el dedo aparece 0,45 s antes, aprieta en `t` y suelta una onda.
const GUION = [
  { t: 1.3, a: 'bajar', hasta: 'grilla', dur: 2.2 },
  { t: 4.0, a: 'tocar', sel: '.prod__foto[data-ver="baccarat-rouge"]' },
  { t: 5.3, a: 'bajarFicha', dur: 1.3 },
  { t: 7.0, a: 'tocar', sel: '#tallas [data-talla="2"]' },
  { t: 7.8, a: 'tocar', sel: '#agregar' },
  { t: 9.4, a: 'tocar', sel: '.prod__foto[data-ver="la-vie-est-belle"]' },
  { t: 10.6, a: 'tocar', sel: '#tallas [data-talla="1"]' },
  { t: 11.3, a: 'tocar', sel: '#agregar' },
  // El aviso trae su propio "Ver": es lo que tocaría cualquiera.
  { t: 12.9, a: 'tocar', sel: '#aviso button' },
  // Uno más del decant de La Vie est Belle (es el segundo del estante).
  { t: 15.2, a: 'tocar', sel: '#lista [data-i="1"][data-d="1"]' },
]
const FIN_GRABACION = 16.8

// ============================================================
// EL RELOJ — se instala antes de que corra la página
// ============================================================
const RELOJ = `(() => {
  const RealDate = Date
  const base = RealDate.now()
  let V = 0
  class D extends RealDate {
    constructor(...a) { if (!a.length) super(base + V); else super(...a) }
    static now() { return base + V }
  }
  window.Date = D
  performance.now = () => V
  let seq = 0
  const timers = new Map()
  window.setTimeout = (fn, ms = 0, ...args) => { const id = ++seq; timers.set(id, { t: V + Math.max(0, +ms || 0), fn, args }); return id }
  window.clearTimeout = (id) => { timers.delete(id) }
  window.setInterval = (fn, ms, ...args) => {
    const id = ++seq
    const prog = () => timers.set(id, { t: V + Math.max(1, +ms || 1), fn: () => { prog(); fn(...args) }, args: [] })
    prog(); return id
  }
  window.clearInterval = window.clearTimeout
  window.__realRAF = window.requestAnimationFrame.bind(window)
  let rafs = [], rafSeq = 0
  window.requestAnimationFrame = (fn) => { const id = ++rafSeq; rafs.push({ id, fn }); return id }
  window.cancelAnimationFrame = (id) => { rafs = rafs.filter((r) => r.id !== id) }
  const nacio = new WeakMap()

  window.__avanzar = (ms) => {
    const fin = V + ms
    // Un cálculo de estilos antes de nada: si un elemento se acaba de mostrar,
    // la transición tiene que arrancar desde su estado inicial.
    void document.documentElement.offsetHeight
    for (;;) {
      let prox = null
      for (const [id, tm] of timers) if (tm.t <= fin && (!prox || tm.t < prox[1].t)) prox = [id, tm]
      if (!prox) break
      timers.delete(prox[0]); V = Math.max(V, prox[1].t)
      try { prox[1].fn(...prox[1].args) } catch (e) { console.error(e) }
    }
    V = fin
    const lote = rafs; rafs = []
    for (const r of lote) { try { r.fn(V) } catch (e) { console.error(e) } }
    // Cada animación en su segundo exacto. Las que terminan se terminan de
    // verdad (finish), así se cumplen sus promesas y eventos.
    for (const a of document.getAnimations()) {
      if (!nacio.has(a)) nacio.set(a, V)
      if (a.playState === 'finished') continue
      const t = V - nacio.get(a)
      const fin = a.effect ? a.effect.getComputedTiming().endTime : Infinity
      if (isFinite(fin) && t >= fin) a.finish()
      else { a.pause(); a.currentTime = t }
    }
  }
})()`

// El dedo: un círculo blanco que aparece, aprieta y suelta una onda.
const DEDO = `(() => {
  const c = document.createElement('div')
  c.id = '__dedo'
  c.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none'
  c.innerHTML = '<i id="__onda" style="position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;box-shadow:0 0 0 2.5px rgba(255,255,255,.95),0 0 18px rgba(28,24,32,.18);opacity:0"></i>' +
    '<i id="__yema" style="position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.85),rgba(255,255,255,.45) 70%);box-shadow:0 0 0 2.5px #fff,0 10px 24px rgba(28,24,32,.35);opacity:0"></i>'
  document.body.appendChild(c)
  window.__dedo = ({ x, y, o, s, r }) => {
    const y1 = document.getElementById('__yema'), on = document.getElementById('__onda')
    y1.style.left = x + 'px'; y1.style.top = y + 'px'
    y1.style.opacity = o; y1.style.transform = 'scale(' + s + ')'
    on.style.left = r.x + 'px'; on.style.top = r.y + 'px'
    on.style.opacity = r.o; on.style.transform = 'scale(' + r.e + ')'
  }
  window.__centro = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }
  // Los anillos de foco no van: en el teléfono no aparecen con el dedo.
  const st = document.createElement('style'); st.textContent = ':focus-visible{outline:none!important}'; document.head.appendChild(st)
  document.documentElement.style.scrollBehavior = 'auto'
})()`

// ============================================================
// CHROME
// ============================================================
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
async function chrome({ ancho, alto, dpr, movil }) {
  const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
  const perfil = mkdtempSync(join(tmpdir(), 'bl-carrito-'))
  const puerto = 9100 + Math.floor(Math.random() * 90)
  const p = spawn(exe, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let l
  for (let i = 0; i < 60; i++) { try { l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (l.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(l.find((x) => x.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pend = {}
  const errores = []
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] }
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errores.push(m.params.args.map((a) => a.value || a.description).join(' '))
  }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: dpr, mobile: movil })
  await cmd('Page.enable'); await cmd('Runtime.enable')
  const ev = async (expression) => {
    const r = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'error en la página')
    return r.result?.result?.value
  }
  return { cmd, ev, errores, cerrar: () => { ws.close(); p.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

// ============================================================
// 1. LA GRABACIÓN DE LA TIENDA
// ============================================================
const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const cl = (x) => Math.min(1, Math.max(0, x))

async function grabarTienda() {
  rmSync(GRABACION, { recursive: true, force: true }); mkdirSync(GRABACION, { recursive: true })
  const { cmd, ev, errores, cerrar } = await chrome({ ancho: ANCHO, alto: ALTO, dpr: DPR, movil: true })
  try {
    await cmd('Page.addScriptToEvaluateOnNewDocument', { source: RELOJ })
    await cmd('Page.navigate', { url: url(TIENDA) })
    await esperar(1200)
    await ev(`(async () => {
      try { localStorage.clear() } catch {}
      await document.fonts.ready
      document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'))
      await Promise.all([...document.images].map((i) => i.decode().catch(() => 0)));
      ${DEDO}
    })()`)
    // Las imágenes que la tienda crea después (la ficha, el estante) ya están
    // en caché: se cargaron con la grilla.

    const ms = 1000 / FPS
    const total = Math.round(FIN_GRABACION * FPS)
    const hechos = new Set()
    const iniciados = new Set()
    const bajadas = [] // { a, t, dur, desde, hasta, el }
    // ⚠️ EL PUNTERO VIAJA (Gonzalo: "que se entienda y que no sea aburrido"):
    // va de un botón al siguiente en vez de aparecer en el lugar, y en los
    // scrolls arrastra hacia arriba como un pulgar. Si entre dos gestos hay
    // mucho tiempo, se desvanece para no quedar tapando la tienda.
    const ptr = { x: ANCHO * 0.64, y: ALTO * 0.75, o: 0, s: 1 }
    const onda = { x: 0, y: 0, k: -1 }
    let objetivo = null // { t, desde, hasta, aparece }
    const VIAJE = 0.6
    for (let k = 0; k < total; k++) {
      const t = k / FPS
      // Lo que arranca en este cuadro.
      for (const [i, g] of GUION.entries()) {
        if (hechos.has(i)) continue
        if (g.a === 'tocar' && t >= g.t - VIAJE && !iniciados.has(i)) {
          iniciados.add(i)
          const c = await ev(`__centro(${JSON.stringify(g.sel)})`)
          if (!c) throw new Error('No encontré ' + g.sel + ' en el segundo ' + t.toFixed(2))
          const visible = ptr.o > 0.3
          objetivo = { t: g.t, hasta: c, desde: visible ? { x: ptr.x, y: ptr.y } : { x: c.x + 46, y: c.y + 110 }, aparece: !visible }
          onda.k = -1
        }
        if (t < g.t) continue
        hechos.add(i)
        if (g.a === 'tocar') await ev(`document.querySelector(${JSON.stringify(g.sel)}).click()`)
        if (g.a === 'bajar') {
          const [desde, hasta] = await ev(`[scrollY, document.querySelector('#grilla').getBoundingClientRect().top + scrollY - 80]`)
          bajadas.push({ ...g, desde, hasta, el: 'pagina' })
        }
        if (g.a === 'bajarFicha') {
          const [desde, hasta] = await ev(`(() => { const f = document.querySelector('#ficha'); return [f.scrollTop, f.scrollHeight - f.clientHeight] })()`)
          bajadas.push({ ...g, desde, hasta, el: 'ficha' })
        }
      }
      // Los scrolls en curso.
      for (const b of bajadas) {
        const p = cl((t - b.t) / b.dur)
        if (p <= 0 || (p >= 1 && b.listo)) continue
        const y = Math.round(b.desde + (b.hasta - b.desde) * suave(p))
        await ev(b.el === 'pagina' ? `scrollTo(0, ${y})` : `document.querySelector('#ficha').scrollTop = ${y}`)
        if (p >= 1) b.listo = true
      }
      // El puntero.
      const arrastre = bajadas.find((b) => t >= b.t && t <= b.t + b.dur + 0.3)
      if (arrastre) {
        const p = cl((t - arrastre.t) / arrastre.dur)
        if (arrastre.y0 === undefined) arrastre.y0 = ptr.o > 0.3 ? ptr.y : ALTO * 0.74
        ptr.x += (ANCHO * 0.64 - ptr.x) * 0.25
        ptr.y = arrastre.y0 + (ALTO * 0.3 - arrastre.y0) * suave(p)
        ptr.o = p >= 1 ? Math.max(0, 1 - (t - arrastre.t - arrastre.dur) / 0.3) : Math.max(ptr.o, cl((t - arrastre.t) / 0.15))
        ptr.s = p > 0 && p < 1 ? 0.88 : 1
      } else if (objetivo && t <= objetivo.t) {
        const p = cl((t - (objetivo.t - VIAJE)) / (VIAJE - 0.08))
        ptr.x = objetivo.desde.x + (objetivo.hasta.x - objetivo.desde.x) * suave(p)
        ptr.y = objetivo.desde.y + (objetivo.hasta.y - objetivo.desde.y) * suave(p)
        ptr.o = objetivo.aparece ? Math.max(ptr.o, cl(p / 0.45)) : 1
        ptr.s = t >= objetivo.t - 0.06 ? 0.8 : 1
      } else if (objetivo) {
        const a = t - objetivo.t
        ptr.s = a < 0.12 ? 0.8 : 1
        if (!objetivo.onda) { objetivo.onda = true; onda.x = ptr.x; onda.y = ptr.y; onda.k = 0 }
        const prox = GUION.find((g) => g.t > objetivo.t + 0.01)
        const llega = prox ? prox.t - (prox.a === 'tocar' ? VIAJE : 0) : Infinity
        if (llega - objetivo.t > 1.7 && a > 1.0) ptr.o = Math.max(0, 1 - (a - 1.0) / 0.3)
      }
      let r = { x: onda.x, y: onda.y, o: 0, e: 1 }
      if (onda.k >= 0) {
        const p = cl(onda.k / 15)
        r = { x: onda.x, y: onda.y, o: +(0.95 * (1 - p)).toFixed(3), e: +(1 + p * 1.5).toFixed(3) }
        onda.k = p >= 1 ? -1 : onda.k + 1
      }
      const d = { x: +ptr.x.toFixed(1), y: +ptr.y.toFixed(1), o: +ptr.o.toFixed(3), s: ptr.s, r }
      await ev(`__dedo(${JSON.stringify(d)}); __avanzar(${ms})`)
      await ev(`new Promise((r) => __realRAF(() => __realRAF(r)))`)
      const s = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 93, clip: { x: 0, y: await ev('scrollY'), width: ANCHO, height: ALTO, scale: 1 } })
      writeFileSync(join(GRABACION, `${String(k).padStart(4, '0')}.jpg`), Buffer.from(s.result.data, 'base64'))
      if (k % 60 === 0) console.log(`  tienda ${k}/${total}`)
    }
    if (errores.length) console.log('⚠ errores en la página:', errores.slice(0, 5))
  } finally { cerrar() }
}

// ============================================================
// 2. LA COMPOSICIÓN — todo sale de pintar(t)
// ============================================================
const O = 2.2                       // lo que dura la apertura
const REC = FIN_GRABACION           // lo que dura la tienda
const T = {
  logo: 0.15, pregunta: 0.55, cortina: 1.6, cortinaFin: 2.25,
  sale: O + REC, saleFin: O + REC + 0.7,
  noche: O + REC + 0.75, nocheFin: O + REC + 1.3, firma: O + REC + 1.1,
}
const DUR = O + REC + 3.6
// La niebla sigue al perfume que se mira (segundos de la grabación).
const TONOS = [
  [0, '#C49ADB', '#F0A6C4'], [3.9, '#C49ADB', '#F0A6C4'],
  [4.5, '#E5847F', '#F2B49A'], [8.6, '#E5847F', '#F2B49A'],
  [9.3, '#F3C1CE', '#E9B8D3'], [12.6, '#F3C1CE', '#E9B8D3'],
  [13.4, '#C49ADB', '#E5847F'], [99, '#C49ADB', '#E5847F'],
]
// ⚠️ LA CÁMARA SE ACERCA A LO QUE IMPORTA (para que no sea un teléfono
// quieto 17 segundos): al elegir el tamaño y agregar, al estante cuando se
// abre y a la fila donde se suma uno. Antes del vuelo a la bolsa se aleja, así
// se ve el frasco cruzar la pantalla. [segundo de la grabación, zoom, foco x,
// foco y] — el foco en fracciones de la pantalla de la tienda.
const CAMARA = [
  [0, 1, 0.5, 0.5], [6.4, 1, 0.5, 0.5], [7.0, 1.3, 0.5, 0.86],
  [7.75, 1.3, 0.5, 0.86], [8.3, 1, 0.5, 0.5],
  [10.1, 1, 0.5, 0.5], [10.6, 1.22, 0.5, 0.86], [11.25, 1.22, 0.5, 0.86], [11.8, 1, 0.5, 0.5],
  [13.1, 1, 0.5, 0.5], [13.8, 1.2, 0.5, 0.26], [14.6, 1.2, 0.5, 0.26], [15.05, 1.24, 0.5, 0.52],
  [16.2, 1.24, 0.5, 0.52], [16.8, 1, 0.5, 0.5], [99, 1, 0.5, 0.5],
]
// El teléfono: alto exterior y lo que sale de ahí (mismas proporciones que el
// iPhone de las placas: marco 3,22 %, borde 1,42 %).
const FONO_ALTO = 1700
const FW = FONO_ALTO / 2.0927
const PANT_W = FW * 0.9072
const BARRA = PANT_W * (47 / 390)

const ICONOS = `<svg viewBox="0 0 68 14" style="height:100%;width:auto"><g fill="#0B0B0F"><rect x="0" y="8" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="7" rx="1"/><rect x="10" y="3.5" width="3" height="9.5" rx="1"/><rect x="15" y="1" width="3" height="12" rx="1"/><path d="M30 4.2a9 9 0 0 1 12 0l-1.4 1.5a7 7 0 0 0-9.2 0Zm2.8 3a5 5 0 0 1 6.4 0l-1.5 1.5a3 3 0 0 0-3.4 0Zm3.2 2.4 1.6 1.7-1.6 1.6-1.6-1.6Z"/><rect x="47" y="1.5" width="18" height="11" rx="3.2" fill="none" stroke="#0B0B0F" stroke-opacity=".45"/><rect x="49" y="3.5" width="12.5" height="7" rx="1.8"/><rect x="66" y="5" width="1.6" height="4" rx=".8" fill-opacity=".45"/></g></svg>`

const ESCENA = () => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; background: #F4F2F5; font-family: 'Geist', sans-serif; }
  /* La niebla de Bruma: dos nubes de color que siguen al perfume. */
  .nube { position: absolute; border-radius: 50%; filter: blur(70px); }
  #n1 { width: 1100px; height: 1100px; left: -260px; top: 180px; }
  #n2 { width: 900px; height: 900px; right: -300px; top: 900px; }
  #n3 { width: 700px; height: 700px; left: 200px; top: 1400px; opacity: .5; }
  #fono { position: absolute; left: ${540 - FW / 2}px; top: ${(1920 - FONO_ALTO) / 2}px; width: ${FW}px; padding: ${FW * 0.0322}px; border: ${FW * 0.0142}px solid #4a4a55; border-radius: ${FW * 0.166}px; background: #0b0b0f; box-shadow: 0 ${FW * 0.14}px ${FW * 0.28}px -${FW * 0.1}px rgba(26,22,32,.5); transform-origin: 50% 60%; }
  #pantalla { position: relative; aspect-ratio: 390 / 844; overflow: hidden; border-radius: ${FW * 0.135}px; background: #F4F2F5; display: flex; flex-direction: column; }
  #barra { flex: none; height: ${BARRA}px; display: flex; align-items: center; justify-content: space-between; padding: ${BARRA * 0.18}px ${BARRA * 0.62}px 0 ${BARRA * 0.72}px; font: 600 ${BARRA * 0.36}px -apple-system, 'Geist', sans-serif; color: #0B0B0F; }
  #barra span:last-child { height: ${BARRA * 0.27}px; }
  #cuadro { flex: 1; min-height: 0; width: 100%; object-fit: cover; object-position: top; display: block; }
  #isla { position: absolute; top: ${FW * 0.06}px; left: 50%; width: ${FW * 0.268}px; height: ${FW * 0.08}px; margin-left: ${-FW * 0.134}px; border-radius: 99px; background: #000; }
  /* La noche: la de la web, con su aurora (igual que el reel de proyectos). */
  #noche { position: absolute; inset: 0; background: #0f0c1c; z-index: 20; }
  #noche::before { content: ''; position: absolute; inset: -10%; background:
    radial-gradient(60% 40% at 22% 30%, rgba(122,59,240,.30), transparent 70%),
    radial-gradient(55% 38% at 80% 24%, rgba(196,79,224,.22), transparent 68%),
    radial-gradient(55% 40% at 60% 80%, rgba(255,122,89,.12), transparent 70%); }
  .marca { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 46px; text-align: center; }
  .marca img { width: 640px; }
  .marca i { display: block; width: 96px; height: 6px; border-radius: 3px; background: linear-gradient(90deg,#FF2E8F,#B23CFF 55%,#7C4DFF); transform-origin: left center; }
  #apertura img { width: 420px; }
  #apertura b { max-width: 15ch; font-weight: 600; font-size: 84px; line-height: 1.04; letter-spacing: -.035em; color: #fff; text-wrap: balance; }
  .marca b { font-weight: 500; font-size: 54px; line-height: 1.22; letter-spacing: -.015em; color: rgba(255,255,255,.94); }
  .marca span { font: 500 30px 'Geist Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.66); }
</style></head><body>
<i class="nube" id="n1"></i><i class="nube" id="n2"></i><i class="nube" id="n3"></i>
<div id="fono"><div id="pantalla"><div id="barra"><span>9:41</span><span>${ICONOS}</span></div><img id="cuadro" src="${url(join(GRABACION, '0000.jpg'))}"></div><i id="isla"></i></div>
<div id="noche">
  <div class="marca" id="apertura"><img src="${url(join(WEB, 'logo-brickell-blanco.png'))}"><i></i><b>¿Tu tienda online da ganas de comprar?</b></div>
  <div class="marca" id="firma"><img src="${url(join(WEB, 'logo-brickell-blanco.png'))}"><i></i><b>Diseñamos para vos.</b><span>labbrickell.com.ar</span></div>
</div>
<script>
  const T = ${JSON.stringify(T)}, O = ${O}, REC = ${REC}, FPS = ${FPS}, TONOS = ${JSON.stringify(TONOS)}, CAMARA = ${JSON.stringify(CAMARA)}
  const FW = ${FW}, BORDE = ${FW * 0.0142}, MARCO = ${FW * 0.0322}, BARRA = ${BARRA}, PANT_H = ${PANT_W * 844 / 390}, TOP = ${(1920 - FONO_ALTO) / 2}
  const DIR = ${JSON.stringify(url(GRABACION))}, TOTAL = ${Math.round(REC * FPS)}
  const $ = (s) => document.querySelector(s)
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
  const tramo = (t, a, b) => cl((t - a) / (b - a))
  const salida = (x) => 1 - Math.pow(1 - x, 3)
  const entrada = (x) => x * x * x
  const inout = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const mix = (a, b, x) => a + (b - a) * x
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const color = (a, b, x) => { const p = hex(a), q = hex(b); return 'rgb(' + p.map((v, i) => Math.round(mix(v, q[i], x))).join(',') + ')' }
  function tono(s) {
    for (let i = 0; i < TONOS.length - 1; i++) {
      const [a, c1, c2] = TONOS[i], [b, d1, d2] = TONOS[i + 1]
      if (s <= b) { const x = inout(tramo(s, a, b)); return [color(c1, d1, x), color(c2, d2, x)] }
    }
    return [TONOS.at(-1)[1], TONOS.at(-1)[2]]
  }
  let actual = -1
  window.pintar = async function (t) {
    const s = cl(t - O, 0, REC)          // segundo de la grabación
    // La niebla: el color del perfume, respirando.
    const [a, b] = tono(s)
    $('#n1').style.background = 'radial-gradient(closest-side,' + a + ',transparent)'
    $('#n2').style.background = 'radial-gradient(closest-side,' + b + ',transparent)'
    $('#n3').style.background = 'radial-gradient(closest-side,' + a + ',transparent)'
    $('#n1').style.transform = 'translate(' + Math.sin(t * .35) * 50 + 'px,' + Math.cos(t * .3) * 40 + 'px)'
    $('#n2').style.transform = 'translate(' + Math.cos(t * .28) * 60 + 'px,' + Math.sin(t * .33) * 50 + 'px)'
    $('#n3').style.transform = 'translate(' + Math.sin(t * .22 + 1) * 70 + 'px,0)'

    // El cuadro de la tienda que toca.
    const n = Math.min(TOTAL - 1, Math.round(s * FPS))
    if (n !== actual) {
      actual = n
      const img = $('#cuadro')
      img.src = DIR + '/' + String(n).padStart(4, '0') + '.jpg'
      await img.decode().catch(() => 0)
    }

    // El teléfono: sube con la cortina, flota apenas y se va por abajo.
    const entra = salida(tramo(t, T.cortina - .1, T.cortinaFin + .25))
    const sk = entrada(tramo(t, T.sale, T.saleFin))
    const flota = Math.sin(t * 1.1) * 5
    // La cámara: zoom alrededor del foco, y el foco se arrima al centro del
    // cuadro para no quedar abajo, donde Instagram pone el texto.
    let z = 1, fx = .5, fy = .5
    for (let i = 0; i < CAMARA.length - 1; i++) {
      const [a, z1, x1, y1] = CAMARA[i], [b, z2, x2, y2] = CAMARA[i + 1]
      if (s <= b) { const k = inout(tramo(s, a, b)); z = mix(z1, z2, k); fx = mix(x1, x2, k); fy = mix(y1, y2, k); break }
    }
    const ox = BORDE + MARCO + fx * (FW * .9072), oy = BORDE + MARCO + BARRA + fy * (PANT_H - BARRA)
    const arrima = (960 - (TOP + oy)) * Math.min(1, (z - 1) / .3) * .55
    const fo = $('#fono')
    fo.style.transformOrigin = ox + 'px ' + oy + 'px'
    fo.style.transform = 'translateY(' + ((1 - entra) * 160 + flota + sk * 2100 + arrima) + 'px) rotate(' + sk * 5 + 'deg) scale(' + ((mix(.94, 1, entra) - sk * .1) * z) + ')'

    // La noche: apertura (telón que sube) y cierre (telón que baja).
    const noche = $('#noche')
    if (t < T.noche) {
      const k = inout(tramo(t, T.cortina, T.cortinaFin))
      noche.style.clipPath = 'inset(0 0 ' + (k * 100) + '% 0)'
      noche.style.display = k >= 1 ? 'none' : 'block'
      const ap = $('#apertura')
      const la = salida(tramo(t, T.logo, T.logo + .6)), pr = salida(tramo(t, T.pregunta, T.pregunta + .6))
      ap.style.opacity = 1 - tramo(t, T.cortina - .1, T.cortina + .3)
      ap.style.transform = 'translateY(' + (-k * 260) + 'px)'
      ap.querySelector('img').style.cssText = 'opacity:' + la + ';transform:translateY(' + (1 - la) * 30 + 'px)'
      ap.querySelector('i').style.transform = 'scaleX(' + salida(tramo(t, T.logo + .35, T.logo + .95)) + ')'
      ap.querySelector('b').style.cssText = 'opacity:' + pr + ';transform:translateY(' + (1 - pr) * 30 + 'px)'
      $('#firma').style.opacity = 0
    } else {
      const k = inout(tramo(t, T.noche, T.nocheFin))
      noche.style.display = 'block'
      noche.style.clipPath = 'inset(' + ((1 - k) * 100) + '% 0 0 0)'
      $('#apertura').style.opacity = 0
      const fi = $('#firma')
      const f = (x) => salida(tramo(t, T.firma + x, T.firma + x + .6))
      fi.style.opacity = 1
      fi.querySelector('img').style.cssText = 'opacity:' + f(0) + ';transform:translateY(' + (1 - f(0)) * 30 + 'px)'
      fi.querySelector('i').style.transform = 'scaleX(' + f(.25) + ')'
      fi.querySelector('b').style.cssText = 'opacity:' + f(.4) + ';transform:translateY(' + (1 - f(.4)) * 24 + 'px)'
      fi.querySelector('span').style.opacity = f(.6)
    }
  }
</script></body></html>`

const FFMPEG = ['C:/ProgramData/chocolatey/bin/ffmpeg.exe', join(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Links/ffmpeg.exe'), '/usr/bin/ffmpeg', 'ffmpeg'].find((p) => p === 'ffmpeg' || existsSync(p))
const correr = (args) => new Promise((ok, mal) => {
  const p = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] })
  let e = ''; p.stderr.on('data', (d) => (e += d)); p.on('close', (c) => (c === 0 ? ok() : mal(new Error(e))))
})

async function componer(tiempos) {
  rmSync(CUADROS, { recursive: true, force: true }); mkdirSync(CUADROS, { recursive: true })
  const escena = join(DIR, 'escena.html'); writeFileSync(escena, ESCENA())
  const { cmd, ev, cerrar } = await chrome({ ancho: 1080, alto: 1920, dpr: 1, movil: false })
  try {
    await cmd('Page.navigate', { url: url(escena) })
    await esperar(800)
    await ev(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>0)))})()`)
    for (let n = 0; n < tiempos.length; n++) {
      await ev(`pintar(${tiempos[n]}).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))`)
      const s = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } })
      writeFileSync(join(CUADROS, `${String(n).padStart(4, '0')}.jpg`), Buffer.from(s.result.data, 'base64'))
      if (n % 60 === 0) console.log(`  reel ${n}/${tiempos.length}`)
    }
  } finally { cerrar() }
}

// ============================================================
// MAIN
// ============================================================
mkdirSync(DIR, { recursive: true })
const mirar = process.argv.includes('--mirar')
if (!process.argv.includes('--componer') || !existsSync(join(GRABACION, '0000.jpg'))) {
  console.log('Grabando la tienda…')
  await grabarTienda()
}
const tiempos = mirar
  ? [0.4, 1.2, 1.9, 2.4, O + 2.0, O + 4.3, O + 6.2, O + 7.9, O + 8.2, O + 8.6, O + 11.4, O + 11.9, O + 13.3, O + 15.3, O + 16.0, DUR - 1.2]
  : Array.from({ length: Math.round(DUR * FPS) }, (_, n) => n / FPS)
console.log('Componiendo…')
await componer(tiempos)
if (!mirar) {
  const salida = join(DIR, 'reel-carrito.mp4')
  await correr(['-framerate', String(FPS), '-i', join(CUADROS, '%04d.jpg'), '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', salida])
  console.log('✓', salida, readdirSync(CUADROS).length, 'cuadros', `(${DUR.toFixed(1)} s, mudo)`)
}
