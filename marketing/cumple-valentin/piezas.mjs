// ============================================================
// piezas.mjs — separa los SVG de la granja en piezas sueltas
// ============================================================
// Los SVG de docs/zenon son láminas con varios dibujos juntos. Cada pieza se
// saca dejando visible sólo su rama del árbol del SVG (`ruta`, índices de
// hijos desde el primer nivel con más de un hijo) y, si hace falta, sólo un
// rango de trazos adentro de esa rama (`desde`/`hasta`). Se recorta el viewBox
// a lo visible y se exporta como PNG transparente, en alta.
//
//   node marketing/cumple-valentin/piezas.mjs
//
// Salida: marketing/salida/cumple-valentin/piezas/<nombre>.png
//
// ⚠️ stuff.svg SE SACÓ (Gonzalo: "esos animales eran muy tétricos"). Los
// animales ahora salen del árbol con la casita (el granjero y los suyos).
// ============================================================
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DOCS = join(AQUI, '..', '..', 'docs', 'zenon')
const SALIDA = join(AQUI, '..', 'salida', 'cumple-valentin', 'piezas')

const PRADERA = '1846848_8765.svg'
const CASITA = '27287721_lipo_fdzk_211115.svg'
const PASTO = '4970168_31222.svg'

// [nombre, archivo, ruta, px por unidad, { desde, hasta }]
// El fondo de la pradera (1.0.0) son miles de trazos en orden de pintado:
// hasta el 59 cielo y nubes, del 60 al 499 las lomas, del 500 las flores.
const PIEZAS = [
  // ⚠️ LAS TRES CAPAS DE LA PRADERA LLEVAN CAJA FIJA (el cuadro entero de la
  // pradera): medir miles de trazos colgaba el navegador, y con el mismo marco
  // las tres quedan alineadas entre sí, que es lo que pide el paralaje.
  ['cielo', PRADERA, [1, 0], 14, { desde: 0, hasta: 59, caja: [0, -1.9, 177.1, 143.1] }],
  ['lomas', PRADERA, [1, 0], 14, { desde: 60, hasta: 499, caja: [0, -1.9, 177.1, 143.1] }],
  ['flores', PRADERA, [1, 0], 14, { desde: 500, hasta: 1e9, caja: [0, -1.9, 177.1, 143.1] }],
  ['vaca-pradera-1', PRADERA, [1, 1], 30],
  ['vaca-pradera-2', PRADERA, [1, 2], 30],
  ['vaca-pradera-3', PRADERA, [1, 3], 30],
  ['casita', CASITA, [0], 40],
  ['granjero', CASITA, [1, 0], 60],
  ['perro', CASITA, [1, 1], 60],
  ['murcielago', CASITA, [1, 2], 60],
  ['vaca-casita', CASITA, [1, 3], 60],
  ['gallina', CASITA, [1, 4], 60],
  ['chancho', CASITA, [1, 5], 60],
  ['pastizal', PASTO, [1], 8],
  // De la granja de siempre (zenon.svg): el molino, el granero, la cerca.
  ['arbusto', 'zenon.svg', [[0, 1, 2]], 20],
  ['molino', 'zenon.svg', [3], 20],
  ['granero', 'zenon.svg', [4], 20],
  ['manzano', 'zenon.svg', [5], 20],
  ['cerca', 'zenon.svg', [6], 20],
  ['pasto', 'zenon.svg', [7], 20],
]

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
async function chrome() {
  const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
  const perfil = mkdtempSync(join(tmpdir(), 'zenon-'))
  const puerto = 9500 + Math.floor(Math.random() * 90)
  const p = spawn(exe, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', 'about:blank'])
  let l
  for (let i = 0; i < 60; i++) { try { l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (l.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(l.find((x) => x.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0; const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Page.enable')
  await cmd('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  return { cmd, cerrar: () => { ws.close(); p.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

// Adentro de la página: deja visible sólo la rama pedida y devuelve la caja.
const AISLAR = (ruta, rango) => {
  const s = document.documentElement
  let nodo = s
  while (nodo.children.length === 1 && nodo.firstElementChild.tagName === 'g') nodo = nodo.firstElementChild
  for (const paso of ruta) {
    const quiero = Array.isArray(paso) ? paso : [paso]
    const hijos = [...nodo.children]
    hijos.forEach((h, i) => { if (!quiero.includes(i) && h.tagName !== 'defs') h.style.display = 'none' })
    if (quiero.length > 1) { nodo = null; break }
    nodo = hijos[quiero[0]]
    // Grupos con un solo hijo: se baja sin gastar un paso de la ruta.
    while (nodo && rango && nodo.children.length === 1 && nodo.firstElementChild.tagName === 'g') nodo = nodo.firstElementChild
  }
  if (nodo && rango) {
    [...nodo.children].forEach((h, i) => { if (h.tagName !== 'defs' && (i < rango.desde || i > rango.hasta)) h.style.display = 'none' })
  }
  if (rango && rango.caja) return { fija: rango.caja, vb: s.getAttribute('viewBox') }
  // La caja de todo lo visible.
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  const medir = (el) => {
    if (el.style && el.style.display === 'none') return
    if (el.tagName === 'defs' || el.tagName === 'clipPath' || el.tagName === 'mask') return
    if (el.children.length && el.tagName === 'g') { [...el.children].forEach(medir); return }
    if (!el.getBBox) return
    let b; try { b = el.getBBox() } catch (e) { return }
    if (!b.width && !b.height) return
    const m = el.getCTM(), sm = s.getCTM ? s.getScreenCTM() : null
    const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => {
      const p = s.createSVGPoint(); p.x = x; p.y = y
      return p.matrixTransform(m)
    })
    pts.forEach((p) => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y) })
  }
  medir(s)
  return { x0, y0, x1, y1, vb: s.getAttribute('viewBox') }
}

mkdirSync(SALIDA, { recursive: true })
const { cmd, cerrar } = await chrome()
try {
  const solo = process.argv[2]
  for (const [nombre, archivo, ruta, px, rango] of PIEZAS) {
    if (solo && !nombre.startsWith(solo)) continue
    console.log('…', nombre)
    await cmd('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1000, deviceScaleFactor: 1, mobile: false })
    await cmd('Page.navigate', { url: pathToFileURL(join(DOCS, archivo)).href })
    await esperar(2500)
    // Con width/height = viewBox en px, la CTM queda en unidades del viewBox.
    await cmd('Runtime.evaluate', { expression: `(() => { const s = document.documentElement; const vb = s.getAttribute('viewBox').split(/[ ,]+/).map(Number); s.setAttribute('width', vb[2]); s.setAttribute('height', vb[3]); s.style.position='absolute'; s.style.left = 0; s.style.top = 0 })()` })
    const r = await cmd('Runtime.evaluate', { returnByValue: true, expression: `(${AISLAR.toString()})(${JSON.stringify(ruta)}, ${JSON.stringify(rango || null)})` })
    const c = r.result.result.value
    const vb = c.vb.split(/[ ,]+/).map(Number)
    // La CTM mide desde el origen del documento: se le suma el origen del viewBox.
    const pad = 0.4
    const [x0, y0, w, h] = c.fija || [c.x0 + vb[0] - pad, c.y0 + vb[1] - pad, c.x1 - c.x0 + 2 * pad, c.y1 - c.y0 + 2 * pad]
    const W = Math.round(w * px), H = Math.round(h * px)
    await cmd('Runtime.evaluate', { expression: `(() => { const s = document.documentElement; s.setAttribute('viewBox', '${x0} ${y0} ${w} ${h}'); s.setAttribute('width', ${W}); s.setAttribute('height', ${H}) })()` })
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
    await esperar(900)
    const shot = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } })
    writeFileSync(join(SALIDA, nombre + '.png'), Buffer.from(shot.result.data, 'base64'))
    console.log('✓', nombre, W + '×' + H)
  }
} finally { cerrar() }
