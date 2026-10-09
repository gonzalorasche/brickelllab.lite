// ============================================================
// portadaWeb.mjs — la tapa del reel "Una web igual a otras mil"
// ============================================================
//
//   node marketing/portadaWeb.mjs           → salida/reel-web/portada-brickell-web.jpg
//   node marketing/portadaWeb.mjs --guias   → con la franja de la grilla dibujada
//
// La noche de la web con su aurora, el gancho en Geist y, abajo, el titular de
// la web RECORTADO NÍTIDO del cuadro filmado (no una captura desenfocada de
// fondo: la pieza al frente, entera).
//
// ⚠️ TODO EN EL CUADRADO DE LA GRILLA: Instagram muestra de y = 420 a 1440 y
// los costados de 140 a 940. Abajo de 1440 no hay nada que importe.
//
//   150          el logo
//   440 –  667   TU MARCA, / COMO NINGUNA.
//   699 –  794   la bajada
//   846 – 1424   el titular de la web: "Diseñamos lo que tu marca todavía no tiene."
// ============================================================
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const LUMINA = 'file:///C:/Dev/lumina/marketing/'
const { default: puppeteer } = await import(LUMINA + 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js')
const { CHROME } = await import(LUMINA + 'panelEnVivo.mjs')

const SALIDA = join(AQUI, 'salida', 'reel-web')
const CUADRO = pathToFileURL(join(AQUI, 'salida', 'reel-web', 'clips', 'web', '00090.jpg')).href
const LOGO = pathToFileURL(join(AQUI, '..', 'public', 'v4', 'logo-brickell-blanco.png')).href

/* El recorte: [x, y, ancho, alto] en píxeles del cuadro filmado (880 de ancho). */
const R = [0, 440, 880, 636]
const K = 800 / R[2]

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1080px; height:1920px; overflow:hidden; }
  .tapa { position:relative; width:1080px; height:1920px; overflow:hidden; background:
    radial-gradient(90% 55% at 15% 4%, rgba(225,0,255,.55) 0%, transparent 58%),
    radial-gradient(80% 50% at 95% 40%, rgba(124,77,255,.5) 0%, transparent 60%),
    radial-gradient(110% 60% at 50% 108%, rgba(236,30,121,.55) 0%, transparent 62%),
    #0f0c1c; }
  .logo { position:absolute; left:140px; top:150px; width:300px; height:54px;
          background:url('${LOGO}') left center/contain no-repeat; }
  .bloque { position:absolute; left:140px; width:800px; top:440px; }
  .gancho { font-family:'Geist',sans-serif; font-weight:800; font-size:100px; line-height:.95; white-space:nowrap;
            letter-spacing:-.05em; color:#fff; text-transform:uppercase; }
  .gancho span { display:block; }
  .gancho em { font-style:normal; color:#FF5FA8; }
  .bajada { font-family:'Geist',sans-serif; font-weight:500; font-size:36px; line-height:1.32;
            letter-spacing:-.015em; margin-top:32px; color:rgba(255,255,255,.8); }
  .recorte { position:absolute; left:140px; top:846px; width:800px; height:${Math.round(R[3] * K)}px;
             overflow:hidden; border-radius:34px; box-shadow:0 40px 100px rgba(0,0,0,.5); }
  .recorte img { position:absolute; display:block; max-width:none; width:${Math.round(880 * K)}px;
                 left:${-Math.round(R[0] * K)}px; top:${-Math.round(R[1] * K)}px; }
  .guia { position:absolute; left:0; right:0; height:2px; background:rgba(0,255,180,.8); display:none; }
  body.guias .guia { display:block; }
</style></head><body>
<div class="tapa">
  <div class="logo"></div>
  <div class="bloque">
    <div class="gancho"><span>Tu marca,</span><span>como <em>ninguna.</em></span></div>
    <p class="bajada">Webs hechas desde cero.<br>Ni una plantilla.</p>
  </div>
  <div class="recorte"><img src="${CUADRO}"></div>
  <div class="guia" style="top:420px"></div><div class="guia" style="top:1440px"></div>
</div></body></html>`

mkdirSync(SALIDA, { recursive: true })
const archivo = join(SALIDA, '_portada.html')
writeFileSync(archivo, html, 'utf8')
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files'], defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 } })
try {
  const page = await nav.newPage()
  await page.goto(pathToFileURL(archivo).href, { waitUntil: 'networkidle0' })
  const guias = process.argv.includes('--guias')
  await page.evaluate(async (g) => { await document.fonts.ready; if (g) document.body.classList.add('guias') }, guias)
  console.log('  renglones del gancho:', (await page.evaluate(() => [...document.querySelectorAll('.gancho span')].map((s) => { const r = document.createRange(); r.selectNodeContents(s); return Math.round(r.getBoundingClientRect().width) }))).join(', '))
  const salida = join(SALIDA, `portada-brickell-web${guias ? '-guias' : ''}.jpg`)
  await page.screenshot({ path: salida, type: 'jpeg', quality: 95 })
  console.log('✓', salida)
} finally { await nav.close() }
