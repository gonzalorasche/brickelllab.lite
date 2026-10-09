// ============================================================
// banner-linkedin.mjs — las portadas de LinkedIn de Brickell Lab
// ============================================================
//
//   node marketing/banner-linkedin.mjs
//
// Salida: marketing/salida/linkedin/banner/
//   empresa.png  → la portada de la PÁGINA de empresa (1128 × 191, al doble)
//   perfil.png   → el fondo del PERFIL personal (1584 × 396, al doble)
//
// ⚠️ LA ESQUINA DE ABAJO A LA IZQUIERDA NO SE USA. Ahí LinkedIn monta encima
// el logo de la página o la foto del perfil, y en el teléfono todavía más
// grande. Por eso el texto arranca cerca de un tercio del ancho y queda
// arriba de esa zona.
//
// ⚠️ SE EXPORTA AL DOBLE (deviceScaleFactor 2): LinkedIn recomprime todo y
// una portada a 1x se ve lavada en una pantalla retina.
//
// ⚠️ LO MISMO QUE EN LAS PIEZAS: las pantallas se muestran, no se dice de
// quién son. Los teléfonos van cortados por el borde, como en el documento
// de "La primera pantalla".
// ============================================================

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const WEB = join(AQUI, '..', 'public', 'v4')
const SALIDA = join(AQUI, 'salida', 'linkedin', 'banner')
const img = (ruta) => pathToFileURL(join(WEB, ruta)).href
const CAPTURAS = ['cenit', 'gadir', 'meridiano', 'pilates'].map((n) => img(`proyectos/${n}-fono.webp`))

// El mismo iPhone que en linkedin.mjs (borde en vez de sombra de spread).
function fono(src, alto) {
  const w = alto / 2.0927
  return `
  <div style="position:relative;flex:none;width:${w}px;padding:${w * 0.0322}px;border:${w * 0.0142}px solid #4a4a55;border-radius:${w * 0.166}px;background:#0b0b0f;box-shadow:0 ${w * 0.12}px ${w * 0.26}px -${w * 0.08}px rgba(11,11,15,.4)">
    <div style="position:relative;aspect-ratio:1179/2556;overflow:hidden;border-radius:${w * 0.135}px;background:#fff">
      <img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top">
    </div>
    <i style="position:absolute;top:${w * 0.06}px;left:50%;width:${w * 0.268}px;height:${w * 0.08}px;border-radius:99px;background:#000;transform:translateX(-50%)"></i>
  </div>`
}

// ── Las dos medidas, con la misma pieza ──
// t: medidas del texto · f: alto de cada teléfono, dónde arranca la fila y
// cuánto baja cada uno (escalonados, para que no parezca una grilla).
const MEDIDAS = {
  empresa: { w: 1128, h: 191, texto: { izq: 300, ancho: 380, h1: 27, ceja: 9, baja: 12, gap: 10 }, fila: { izq: 700, alto: 300, gap: 14, tops: [26, 58, 14, 46] } },
  perfil:  { w: 1584, h: 396, texto: { izq: 470, ancho: 520, h1: 46, ceja: 12, baja: 18, gap: 18 }, fila: { izq: 1030, alto: 520, gap: 22, tops: [44, 104, 20, 84] } },
}

function pagina({ w, h, texto: t, fila: f }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body { position: relative; font-family: 'Geist', system-ui, sans-serif; color: #0B0B0F; background: #fff; -webkit-font-smoothing: antialiased; }
  /* Un velo de marca, apenas: el degradé de la rayita, muy diluido, detrás de los teléfonos. */
  .velo { position: absolute; inset: 0; background:
    radial-gradient(40% 90% at 78% 40%, rgba(178,60,255,.10), transparent 70%),
    radial-gradient(30% 80% at 96% 80%, rgba(255,46,143,.08), transparent 70%); }
  .texto { position: absolute; left: ${t.izq}px; top: 50%; width: ${t.ancho}px; transform: translateY(-50%); display: grid; gap: ${t.gap}px; justify-items: start; }
  .ceja { display: grid; gap: ${t.ceja}px; justify-items: start; font: 500 ${t.ceja}px 'Geist Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: #5E606B; }
  .ceja::after { content: ''; width: ${t.ceja * 3}px; height: ${Math.max(2, t.ceja / 4)}px; border-radius: 2px; background: linear-gradient(90deg, #FF2E8F, #B23CFF 55%, #7C4DFF); }
  h1 { font-weight: 600; font-size: ${t.h1}px; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
  .baja { font-size: ${t.baja}px; line-height: 1.4; color: #5E606B; }
  .baja b { font-weight: 500; color: #0B0B0F; }
  .fila { position: absolute; left: ${f.izq}px; top: 0; display: flex; gap: ${f.gap}px; }
</style></head><body>
  <div class="velo"></div>
  <div class="fila">${CAPTURAS.map((c, i) => `<div style="margin-top:${f.tops[i]}px">${fono(c, f.alto)}</div>`).join('')}</div>
  <div class="texto">
    <p class="ceja">Brickell Lab · Buenos Aires</p>
    <h1>Diseño y desarrollo, en el mismo lugar.</h1>
    <p class="baja">Sitios, plataformas y productos digitales · <b>labbrickell.com.ar</b></p>
  </div>
</body></html>`
}

// ── La captura ──
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const perfil = mkdtempSync(join(tmpdir(), 'bl-banner-'))
const puerto = 9400 + Math.floor(Math.random() * 90)
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
let lista
for (let i = 0; i < 60; i++) { try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (lista.length) break } catch {} await esperar(250) }
const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pend = {}
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
await cmd('Page.enable')

mkdirSync(SALIDA, { recursive: true })
try {
  for (const [nombre, m] of Object.entries(MEDIDAS)) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: m.w, height: m.h, deviceScaleFactor: 2, mobile: false })
    const tmp = join(tmpdir(), `bl-banner-${nombre}.html`)
    writeFileSync(tmp, pagina(m))
    await cmd('Page.navigate', { url: pathToFileURL(tmp).href })
    await cmd('Runtime.evaluate', { awaitPromise: true, expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await new Promise(r=>setTimeout(r,300))})()` })
    const s = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: m.w, height: m.h, scale: 1 } })
    writeFileSync(join(SALIDA, nombre + '.png'), Buffer.from(s.result.data, 'base64'))
    console.log('✓', nombre, `${m.w}×${m.h} (exportado a ${m.w * 2}×${m.h * 2})`)
  }
} finally {
  ws.close(); chrome.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {}
}
