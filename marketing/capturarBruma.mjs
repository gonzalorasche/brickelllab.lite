// ============================================================
// capturarBruma.mjs — pantallas de la tienda Bruma, en el teléfono
// ============================================================
//
//   node marketing/capturarBruma.mjs
//
// Salida: marketing/salida/bruma/pantallas/<nombre>.jpg (1170 × 2532, un
// iPhone a 3x). Las usa el carrusel "edu-carrito" de generar.mjs.
//
// ⚠️ SON PANTALLAS DE LA TIENDA USADA DE VERDAD: cada captura llega a su
// estado haciendo lo que haría una persona (abrir la ficha, elegir tamaño,
// agregar, abrir el estante), no armando el HTML a mano. Si la tienda cambia,
// se vuelve a correr y las placas se actualizan solas.
// ============================================================

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const TIENDA = join(AQUI, '..', 'docs', 'proyectos', 'perfumeria.html')
const SALIDA = join(AQUI, 'salida', 'bruma', 'pantallas')
const W = 390, H = 844, DPR = 3

// Los pasos, en la página. `agregar` hace lo mismo que una persona.
const AYUDA = `
  window.__z = (ms) => new Promise((r) => setTimeout(r, ms))
  window.__agregar = async (id, talla, cant = 1) => {
    document.querySelector('[data-ver="' + id + '"]').click(); await __z(700)
    document.querySelector('#tallas [data-talla="' + talla + '"]').click()
    for (let i = 1; i < cant; i++) document.querySelector('#mas').click()
    document.querySelector('#agregar').click(); await __z(1300)
  }
  window.__llenar = async () => {
    await __agregar('la-vie-est-belle', 0); await __agregar('baccarat-rouge', 2)
    await __agregar('sauvage', 1, 2); await __agregar('mon-paris', 2)
    document.querySelector('#aviso').classList.remove('ver')
  }
  document.documentElement.style.scrollBehavior = 'auto'
`

const PANTALLAS = {
  portada: ``,
  estante: `await __llenar(); document.querySelector('#abrir-estante').click(); await __z(900)`,
  total: `await __llenar(); document.querySelector('#abrir-estante').click(); await __z(900); document.querySelector('#estante').scrollTop = 9999; await __z(300)`,
  ficha: `document.querySelector('[data-ver="baccarat-rouge"]').click(); await __z(800); document.querySelector('#tallas [data-talla="2"]').click(); await __z(300)`,
  // El momento de agregar: la grilla a la vista, la bolsa con su número y el aviso.
  agregado: `scrollTo(0, document.querySelector('#grilla').getBoundingClientRect().top + scrollY - 70); await __z(400);
             await __agregar('mon-paris', 1); await __z(200)`,
}

const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

mkdirSync(SALIDA, { recursive: true })
for (const [nombre, pasos] of Object.entries(PANTALLAS)) {
  // Un Chrome limpio por pantalla: el estante se guarda en el navegador y no
  // tiene que arrastrar lo que cargó la captura anterior.
  const perfil = mkdtempSync(join(tmpdir(), 'bl-bruma-'))
  const puerto = 9200 + Math.floor(Math.random() * 90)
  const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let lista
  for (let i = 0; i < 60; i++) { try { lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (lista.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(lista.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  try {
    await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: true })
    await cmd('Page.enable')
    await cmd('Page.navigate', { url: pathToFileURL(TIENDA).href })
    await esperar(800)
    const r = await cmd('Runtime.evaluate', { awaitPromise: true, expression: `(async()=>{
      await document.fonts.ready
      document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'))
      await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((ok) => { i.onload = i.onerror = ok })))
      ${AYUDA}
      ${pasos}
      await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((ok) => { i.onload = i.onerror = ok })))
      await __z(200)
    })()` })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description)
    const y = (await cmd('Runtime.evaluate', { expression: 'scrollY', returnByValue: true })).result.result.value
    const s = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y, width: W, height: H, scale: 1 } })
    writeFileSync(join(SALIDA, nombre + '.jpg'), Buffer.from(s.result.data, 'base64'))
    console.log('✓', nombre)
  } finally {
    ws.close(); chrome.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {}
  }
}
