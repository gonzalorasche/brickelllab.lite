// ============================================================
// capturarSitios.mjs — los sitios del portfolio, enteros, en ancho de iPhone
// ============================================================
// Sale una imagen larga por sitio (393 px de ancho × 2,5 = 983 px) en
// marketing/salida/reel/sitios/<slug>.png, más la sección Proyectos de la web
// en escritorio (proyectos.png). El reel las scrollea adentro del teléfono.
//
// ⚠️ ANTES DE CAPTURAR SE BAJA LA PÁGINA ENTERA DE A POCO: los sitios tienen
// entradas por scroll, y sin recorrerlos la captura larga sale con secciones
// en blanco.
//
//   node marketing/capturarSitios.mjs
// ============================================================
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIST = join(AQUI, '..', 'dist')
const SALIDA = join(AQUI, 'salida', 'reel', 'sitios')
export const SITIOS = ['cenit', 'meridiano', 'gadir']
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

async function chrome() {
  const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
  const perfil = mkdtempSync(join(tmpdir(), 'bl-sitios-'))
  const puerto = 9800 + Math.floor(Math.random() * 100)
  const p = spawn(exe, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let l
  for (let i = 0; i < 60; i++) { try { l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (l.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(l.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0; const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Page.enable')
  return { cmd, cerrar: () => { ws.close(); p.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}
const ev = async (cmd, expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.result.value

// Recorre la página para disparar las entradas, vuelve arriba y congela todo.
const RECORRER = `(async()=>{
  await document.fonts.ready
  for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)) }
  scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 600))
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 600))
  const st = document.createElement('style')
  st.textContent = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'
  document.head.appendChild(st)
  document.querySelectorAll('video').forEach(v => { try { v.pause() } catch (e) {} })
  return document.documentElement.scrollHeight
})()`

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(SALIDA, { recursive: true })
  const { cmd, cerrar } = await chrome()
  try {
    for (const slug of SITIOS) {
      await cmd('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2.5, mobile: true })
      await cmd('Page.navigate', { url: pathToFileURL(join(DIST, 'v4', 'proyectos', slug + '.html')).href })
      await esperar(2500)
      const alto = await ev(cmd, RECORRER)
      const s = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 393, height: Math.min(alto, 9000), scale: 1 } })
      writeFileSync(join(SALIDA, slug + '.png'), Buffer.from(s.result.data, 'base64'))
      console.log('✓', slug, alto)
    }
  } finally { cerrar() }
}
