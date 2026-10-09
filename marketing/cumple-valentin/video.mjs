// ============================================================
// video.mjs — la invitación de cumple de Valentín (la granja)
// ============================================================
// No es de Lúmina ni de Brickell: es la invitación del sobrino de Gonzalo,
// para mandar por WhatsApp. Video vertical 1080 × 1920 a 30 cuadros.
//
//   1. la granja en paralaje: el cielo casi quieto, las colinas, el molino y el
//      manzano atrás, la cerca, y los animales que aparecen con un saltito a
//      medida que pasa la cámara; termina frente al granero
//   2. las puertas del granero se abren (3D), sale la luz de adentro y la
//      cámara entra por la puerta
//   3. adentro, la tarjeta: Valentín cumple 2, la hora y la dirección, con los
//      animales alrededor
//
//   node marketing/cumple-valentin/piezas.mjs   → (una vez) separa los SVG
//   node marketing/cumple-valentin/video.mjs    → las dos versiones (12:30 y 16:00)
//   node marketing/cumple-valentin/video.mjs --mirar → cuadros sueltos
//
// Los dibujos son los SVG de docs/zenon, separados en piezas.
// ============================================================
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SALIDA = join(AQUI, '..', 'salida', 'cumple-valentin')
const PIEZAS = join(SALIDA, 'piezas')
const pieza = (n) => pathToFileURL(join(PIEZAS, n + '.png')).href
const FPS = 30
const DUR = 19
// ⚠️ LA APERTURA: el cartel de madera. Dura `O` segundos y todo lo demás
// (la granja, las puertas, la tarjeta) corre O segundos más tarde: adentro de
// pintar() se trabaja con t − O, así los tiempos de abajo siguen siendo los
// de la granja sola.
const O = 2.0

// ── Los datos del cumple ──
const DATOS = {
  nombre: 'Valentín',
  fecha: 'Sábado 17 de octubre',
  edad: 2,
  direccion: 'San Juan 626',
  entre: 'entre Quintana y Andrés Baranda',
  ciudad: 'Quilmes',
}
const VERSIONES = [
  { archivo: 'invitacion-valentin-12-30', hora: '12:30 hs' },
  { archivo: 'invitacion-valentin-16-00', hora: '16:00 hs' },
]

// ── Los momentos (segundos) ──
const T = {
  panIni: 0.4, panFin: 6.0,
  puertas: 6.3, puertasFin: 7.5,
  // El zoom arranca con las puertas ya abiertas.
  zoom: 7.55, zoomFin: 9.0,
  tarjeta: 9.0,
}
// Cuándo aparece cada animal de la granja (y suena su saltito).
// ⚠️ LOS ANIMALES SON LOS DEL GRANJERO (27287721…svg). Los de stuff.svg se
// sacaron por tétricos, y el chancho de este archivo tampoco va ("quedó mal",
// Gonzalo). El murciélago no está acá: cruza el cielo volando.
const ANIMALES = [
  // [pieza, x en el mundo, alto en px, aparece]
  ['granjero', 680, 540, 1.3],
  ['perro', 960, 330, 2.1],
  ['gallina', 1230, 270, 2.9],
  ['vaca-casita', 1400, 470, 3.7],
]
const EVENTOS = [
  ['boing', 0.42], ['barrido', 1.72],
  ...ANIMALES.map(([, , , t]) => ['pop', t + O]),
  ...[
    ['puerta', T.puertas], ['barrido', T.zoom + 0.2],
    ['brillo', T.tarjeta + 0.4], ['pop', T.tarjeta + 0.95], ['pop', T.tarjeta + 1.45],
    ['pop', T.tarjeta + 2.0], ['pop', T.tarjeta + 2.4], ['pop', T.tarjeta + 2.8], ['pop', T.tarjeta + 3.2],
  ].map(([n, t]) => [n, t + O]),
]

// ── La escena ──
// Granero: 620 de ancho, centrado en x = 2040 del mundo (la cámara termina en
// 1500), apoyado en el piso en y = 1300.
const GRANERO = { ancho: 620, alto: Math.round(620 * 1427 / 1517), cx: 2040, piso: 1300 }
const K = GRANERO.ancho / 1517
// Las puertas, en px del granero exportado (ver piezas.mjs y el recorte).
const PUERTA = { x: 330, y: 886, w: 860, h: 506 }

function escena(hora) {
  const gLeft = GRANERO.cx - GRANERO.ancho / 2
  const gTop = GRANERO.piso - GRANERO.alto
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; background: #8FD3FF; font-family: 'Fredoka', sans-serif; }
  .cielo { position: absolute; inset: 0; background: linear-gradient(180deg, #5EB8F5 0%, #9DDAFF 45%, #D8F2FF 70%, #E8F7E0 100%); }
  .sol { position: absolute; left: 760px; top: 170px; width: 190px; height: 190px; border-radius: 50%; background: radial-gradient(circle, #FFF6B0 0%, #FFD84A 55%, #FFC21A 100%); box-shadow: 0 0 0 26px rgba(255,220,80,.25), 0 0 0 60px rgba(255,220,80,.12); }
  .nube { position: absolute; background: #fff; border-radius: 99px; filter: drop-shadow(0 10px 0 rgba(170,210,240,.5)); }
  .nube::before, .nube::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
  .nube::before { width: 55%; height: 170%; left: 12%; bottom: 20%; }
  .nube::after { width: 42%; height: 140%; right: 12%; bottom: 25%; }
  #mundo { position: absolute; inset: 0; transform-origin: 540px 1100px; }
  .capa { position: absolute; left: 0; top: 0; width: 1px; height: 1px; }
  .capa img, .capa .obj { position: absolute; }
  .colina { position: absolute; border-radius: 50%; }
  .suelo { position: absolute; left: -4000px; width: 12000px; top: 1230px; height: 1400px; background: linear-gradient(180deg, #8BD35A 0%, #6CBF45 30%, #58A83A 100%); }
  /* ⚠️ CADA HOJA TIENE DOS CARAS: el dibujo adelante y madera en sombra
     atrás. Con una sola imagen, al pasar los 90° se veía la misma puerta
     espejada (lo vio Gonzalo); lo que se tiene que ver es el revés oscuro. */
  .puerta { position: absolute; top: 0; height: 100%; transform-style: preserve-3d; }
  .puerta img, .puerta i { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; }
  .puerta i { transform: rotateY(180deg); background: linear-gradient(90deg, #2A1810, #3B2416 50%, #2A1810); box-shadow: inset 0 0 0 6px #1C0F09; }
  /* El interior arranca oscuro; la luz cálida crece recién cuando la cámara entra.
     ⚠️ El granero va con el hueco de las puertas transparente (granero-hueco.png,
     ver piezas.mjs): el dibujo original trae las puertas pintadas y, con las
     hojas abiertas, se seguían viendo detrás. */
  #adentro { position: absolute; background: #140C08; }
  #adentro::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 60%, #FFF6CF 0%, #FFD86A 45%, #F2A93A 100%); opacity: var(--luz, 0); }
  #luz { position: absolute; inset: 0; background: radial-gradient(circle at 540px 1182px, #FFF9D9 0%, #FFE58A 60%, #F7B43A 100%); opacity: 0; }
  /* ── La tarjeta ── */
  #tarjeta { position: absolute; inset: 0; opacity: 0; }
  #tarjeta .fondo { position: absolute; inset: 0; background: linear-gradient(180deg, #7CCBFF 0%, #BFE8FF 52%, #E9F8E2 66%, #8BD35A 66.2%, #5FAE3C 100%); }
  .caja { position: absolute; left: 90px; right: 90px; top: 230px; padding: 70px 60px 64px; border-radius: 56px; background: #FFFDF6; box-shadow: 0 0 0 14px #E23B2E, 0 0 0 26px #fff, 0 40px 60px -20px rgba(40,70,20,.45); text-align: center; color: #3A2A1A; }
  .caja .t1 { font-size: 60px; font-weight: 600; color: #2E7D32; }
  .caja .nombre { font-size: 170px; font-weight: 700; line-height: 1; color: #E23B2E; margin-top: 18px; letter-spacing: -.01em; text-shadow: 0 7px 0 #F7C948; }
  .caja .cumple { display: flex; align-items: center; justify-content: center; gap: 26px; margin-top: 30px; font-size: 64px; font-weight: 600; }
  .caja .dos { display: grid; place-items: center; width: 190px; height: 190px; border-radius: 50%; background: #FFC21A; color: #fff; font-size: 150px; font-weight: 700; line-height: 1; box-shadow: inset 0 -12px 0 #E8A300, 0 10px 0 rgba(0,0,0,.08); text-shadow: 0 5px 0 #D98E00; }
  .caja .filete { height: 6px; margin: 34px 40px 28px; border-radius: 3px; background: repeating-linear-gradient(90deg, #E23B2E 0 28px, transparent 28px 44px); }
  .dato { display: flex; align-items: center; justify-content: center; gap: 22px; }
  .dato svg { width: 72px; height: 72px; flex: none; }
  .hora { font-size: 84px; font-weight: 700; color: #3A2A1A; }
  .dir { margin-top: 18px; }
  .fecha { font-size: 62px; font-weight: 700; color: #E23B2E; }
  #hora { margin-top: 10px; }
  .dir .calle { font-size: 64px; font-weight: 700; }
  .dir .entre { font-size: 42px; font-weight: 500; color: #6B5A45; margin-top: 6px; }
  .dir .ciudad { font-size: 52px; font-weight: 600; color: #2E7D32; margin-top: 6px; }
  .bicho { position: absolute; transform-origin: 50% 100%; }
  /* ── El cartel de la apertura ── */
  #cartel { position: absolute; left: 110px; top: 0; width: 860px; transform-origin: 430px -520px; }
  #cartel .soga { position: absolute; top: -560px; width: 10px; height: 600px; border-radius: 5px; background: repeating-linear-gradient(160deg, #C9A46A 0 10px, #A9824A 10px 20px); }
  #cartel .tabla { position: relative; margin-top: 20px; padding: 58px 40px 64px; border-radius: 34px; text-align: center;
    background:
      repeating-linear-gradient(180deg, transparent 0 118px, rgba(90,50,20,.35) 118px 124px),
      linear-gradient(180deg, #D39A58 0%, #BF8243 55%, #A86A32 100%);
    box-shadow: inset 0 0 0 10px #8A5226, inset 0 0 0 16px rgba(255,255,255,.18), 0 30px 50px -18px rgba(60,35,10,.55); }
  #cartel .clavo { position: absolute; top: 30px; width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #E8E2D8, #8E877D); }
  #cartel .l1 { font-size: 70px; font-weight: 600; color: #FFF4D6; text-shadow: 0 5px 0 #7A461E; line-height: 1.1; }
  #cartel .l2 { font-size: 118px; font-weight: 700; color: #FFD34D; text-shadow: 0 7px 0 #7A461E; line-height: 1.05; margin-top: 8px; }
  #cartel .gallina { position: absolute; right: 70px; top: -205px; height: 230px; }
</style></head><body>
<div class="cielo"></div>
<div id="mundo">
  <!-- El cielo con nubes y las lomas lejanas (0,12) -->
  <div class="capa" data-f="0.12">
    <img src="${pieza('cielo')}" style="left:-300px;top:-150px;height:2100px">
    <div class="sol" id="sol" style="left:840px;top:120px"></div>
  </div>
  <!-- Las lomas de cerca (0,35), con las vacas pastando a lo lejos -->
  <div class="capa" data-f="0.35">
    <img src="${pieza('lomas')}" style="left:-300px;top:-150px;height:2100px">
    <img src="${pieza('vaca-pradera-1')}" style="left:520px;top:1010px;height:150px">
    <img src="${pieza('vaca-pradera-3')}" style="left:1260px;top:960px;height:170px">
  </div>
  <!-- Medio (0,55): molino y manzano -->
  <div class="capa" data-f="0.55">
    <img src="${pieza('molino')}" style="left:760px;top:600px;height:660px">
    <img src="${pieza('manzano')}" style="left:1500px;top:760px;width:500px">
  </div>
  <!-- Suelo y cerca (0,8) -->
  <div class="capa" data-f="0.8">
    <div class="suelo"></div>
    ${Array.from({ length: 9 }, (_, k) => `<img src="${pieza('cerca')}" style="left:${-100 + k * 470}px;top:1110px;width:480px">`).join('')}
  </div>
  <!-- El árbol con la casita, el granero y los animales (1) -->
  <div class="capa" data-f="1" id="frente">
    <img src="${pieza('casita')}" style="left:-60px;top:${GRANERO.piso + 70 - 900}px;height:900px">
    <div id="adentro" style="left:${gLeft + PUERTA.x * K}px;top:${gTop + PUERTA.y * K}px;width:${PUERTA.w * K}px;height:${PUERTA.h * K}px"></div>
    <img src="${pieza('granero-hueco')}" id="granero" style="left:${gLeft}px;top:${gTop}px;width:${GRANERO.ancho}px">
    <div id="puertas" style="position:absolute;left:${gLeft + PUERTA.x * K}px;top:${gTop + PUERTA.y * K}px;width:${PUERTA.w * K}px;height:${PUERTA.h * K}px;perspective:1400px">
      <div class="puerta" id="pIzq" style="left:0;width:${428 * K}px;transform-origin:0 50%"><img src="${pieza('puerta-izq')}"><i></i></div>
      <div class="puerta" id="pDer" style="right:0;width:${432 * K}px;transform-origin:100% 50%"><img src="${pieza('puerta-der')}"><i></i></div>
    </div>
    ${ANIMALES.map(([n, x, h], i) => `<img class="bicho" id="a${i}" src="${pieza(n)}" style="left:${x}px;top:${GRANERO.piso + 90 - h}px;height:${h}px">`).join('')}
  </div>
  <!-- Adelante de todo (1,3): las flores y el pastizal -->
  <div class="capa" data-f="1.3">
    <!-- ⚠️ SÓLO EL CANTERO: el dibujo de las flores trae flores sueltas más
         arriba, y una quedaba justo delante de la puerta del granero. -->
    <img src="${pieza('flores-cantero')}" style="left:-300px;top:-60px;height:2100px">
    <img src="${pieza('flores-cantero')}" style="left:1900px;top:-60px;height:2100px">
    ${Array.from({ length: 4 }, (_, k) => `<img src="${pieza('pastizal')}" style="left:${-150 + k * 1150}px;top:1470px;width:1200px">`).join('')}
  </div>
</div>
<!-- El murciélago cruza el cielo, aleteando (fuera del mundo: vuela solo) -->
<img id="murcielago" src="${pieza('murcielago')}" style="position:absolute;left:0;top:0;width:230px;opacity:0">
<div id="luz"></div>

<div id="tarjeta">
  <div class="fondo"></div>
  <div style="position:absolute;left:-40px;right:-40px;top:1195px;display:flex;justify-content:center">${Array.from({ length: 3 }, () => `<img src="${pieza('cerca')}" style="width:420px">`).join('')}</div>
  <div class="caja" id="caja">
    <p class="t1" id="t1">¡Te invito a mi cumple!</p>
    <p class="nombre" id="nombre">${DATOS.nombre}</p>
    <div class="cumple" id="cumple"><span>cumplo</span><span class="dos" id="dos">${DATOS.edad}</span><span>años</span></div>
    <div class="filete"></div>
    <div class="dato" id="fecha">
      <svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="18" rx="3.5" fill="#E23B2E"/><rect x="2.5" y="4" width="19" height="5.5" rx="3.5" fill="#B8261B"/><rect x="2.5" y="7" width="19" height="2.5" fill="#B8261B"/><rect x="6.6" y="2" width="2.6" height="5" rx="1.3" fill="#3A2A1A"/><rect x="14.8" y="2" width="2.6" height="5" rx="1.3" fill="#3A2A1A"/><g fill="#fff"><rect x="5.5" y="11.5" width="3" height="2.6" rx=".7"/><rect x="10.5" y="11.5" width="3" height="2.6" rx=".7"/><rect x="15.5" y="11.5" width="3" height="2.6" rx=".7"/><rect x="5.5" y="16" width="3" height="2.6" rx=".7"/><rect x="10.5" y="16" width="3" height="2.6" rx=".7" fill="#FFC21A"/><rect x="15.5" y="16" width="3" height="2.6" rx=".7"/></g></svg>
      <span class="fecha">${DATOS.fecha}</span>
    </div>
    <div class="dato" id="hora">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFC21A"/><circle cx="12" cy="12" r="7.6" fill="#fff"/><path d="M12 7.5V12l3 2" stroke="#3A2A1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
      <span class="hora">${hora}</span>
    </div>
    <div class="dir" id="dir">
      <div class="dato"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="#E23B2E"/><circle cx="12" cy="10" r="2.8" fill="#fff"/></svg><span class="calle">${DATOS.direccion}</span></div>
      <p class="entre">${DATOS.entre}</p>
      <p class="ciudad">${DATOS.ciudad}</p>
    </div>
  </div>
  <img class="bicho" id="b0" src="${pieza('granjero')}" style="left:10px;top:1320px;height:560px">
  <img class="bicho" id="b1" src="${pieza('gallina')}" style="left:430px;top:1590px;height:280px">
  <img class="bicho" id="b2" src="${pieza('perro')}" style="left:690px;top:1520px;height:360px">
</div>

<div id="cartel">
  <i class="soga" style="left:150px"></i><i class="soga" style="right:150px"></i>
  <img class="gallina" src="${pieza('gallina')}">
  <div class="tabla">
    <i class="clavo" style="left:40px"></i><i class="clavo" style="right:40px"></i>
    <p class="l1">¡Vamos a la granja</p>
    <p class="l2">de ${DATOS.nombre}!</p>
  </div>
</div>

<script>
  const T = ${JSON.stringify(T)}, ANIMALES = ${JSON.stringify(ANIMALES)}
  const $ = (s) => document.querySelector(s)
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
  const tramo = (t, a, b) => cl((t - a) / (b - a))
  const inout = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const salida = (x) => 1 - Math.pow(1 - x, 3)
  const entrada = (x) => x * x * x
  // Resorte: pasa un poco de largo y vuelve (el saltito).
  const rebote = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2))
  const aparecer = (el, t, t0, dur = .55) => {
    const x = tramo(t, t0, t0 + dur)
    const s = rebote(x)
    el.style.opacity = x > 0 ? 1 : 0
    el.style.transform = 'translateY(' + (1 - s) * 60 + 'px) scale(' + Math.max(0, s) + ')'
  }
  const capas = [...document.querySelectorAll('.capa')]

  const O = ${O}
  window.pintar = function (tReal) {
    // ── La apertura: el cartel baja rebotando, se mece y se va para arriba ──
    const c = document.getElementById('cartel')
    const baja = tramo(tReal, 0.05, 0.75)
    const y = -900 + (520 + 900) * rebote(baja)
    const hamaca = Math.sin((tReal - 0.4) * 5.2) * 5 * Math.exp(-Math.max(0, tReal - 0.4) * 2.2) * (tReal > 0.4 ? 1 : 0)
    const sube = entrada(tramo(tReal, 1.7, 2.15))
    c.style.transform = 'translateY(' + (y - sube * 1500) + 'px) rotate(' + hamaca + 'deg)'
    c.style.display = sube >= 1 ? 'none' : 'block'
    const t = tReal - O
    // Cámara: recorre la granja y se frena frente al granero.
    const cam = 1500 * inout(tramo(t, T.panIni, T.panFin))
    capas.forEach((c) => { c.style.transform = 'translateX(' + (-cam * +c.dataset.f) + 'px)' })
    $('#sol').style.transform = 'translateY(' + Math.sin(t * .8) * 6 + 'px)'
    // El murciélago: cruza de derecha a izquierda con un vaivén y aleteando.
    const mv = tramo(t, 1.6, 5.2)
    const mu = $('#murcielago')
    mu.style.opacity = mv > 0 && mv < 1 ? 1 : 0
    mu.style.transform = 'translate(' + (1150 - mv * 1500) + 'px,' + (560 + Math.sin(mv * 9) * 60) + 'px) scaleY(' + (0.75 + Math.abs(Math.sin(t * 14)) * .3) + ') rotate(' + Math.sin(mv * 9) * -8 + 'deg)'

    // Los animales, con su saltito; después respiran apenas.
    ANIMALES.forEach(([, , , t0], i) => {
      const el = $('#a' + i)
      if (t < t0 + .55) aparecer(el, t, t0)
      else { el.style.opacity = 1; el.style.transform = 'scaleY(' + (1 + Math.sin((t - t0) * 3.2 + i) * .012) + ')' }
    })

    // Acercamiento al granero, las puertas y el zoom a través de la puerta.
    const acerca = inout(tramo(t, T.panFin - .4, T.puertas))
    const zoom = tramo(t, T.zoom, T.zoomFin)
    // ⚠️ LA GRANJA VA 1,35 VECES MÁS GRANDE que el dibujo del mundo: en el
    // formato vertical quedaba una franja chica entre mucho cielo y mucho piso.
    // El zoom se hace sobre el centro de la puerta con la cámara ya frenada:
    // x = 1730 + (330 + 430) × K − 1500 = 540, y = 717 + (886 + 253) × K = 1182.
    const s = 1.35 * (1 + acerca * .12) * Math.pow(14, inout(zoom))
    const m = $('#mundo')
    m.style.transformOrigin = '540px 1182px'
    m.style.transform = 'scale(' + s + ')'
    const ab = inout(tramo(t, T.puertas, T.puertasFin))
    $('#pIzq').style.transform = 'rotateY(' + (-112 * ab) + 'deg)'
    $('#pDer').style.transform = 'rotateY(' + (112 * ab) + 'deg)'
    $('#adentro').style.setProperty('--luz', String(tramo(t, T.zoom, T.zoom + .9)))
    $('#luz').style.opacity = tramo(t, T.zoomFin - .55, T.zoomFin) * (1 - tramo(t, T.tarjeta + .1, T.tarjeta + .7))

    // ── La tarjeta ──
    const ta = tramo(t, T.tarjeta, T.tarjeta + .5)
    $('#tarjeta').style.opacity = ta
    const caja = $('#caja')
    const cx = salida(tramo(t, T.tarjeta + .1, T.tarjeta + .8))
    caja.style.transform = 'translateY(' + (1 - cx) * 120 + 'px) scale(' + (.92 + cx * .08) + ')'
    aparecer($('#t1'), t, T.tarjeta + .4)
    aparecer($('#nombre'), t, T.tarjeta + .95, .6)
    aparecer($('#cumple'), t, T.tarjeta + 1.45)
    const d = tramo(t, T.tarjeta + 1.6, T.tarjeta + 2.4)
    $('#dos').style.transform = 'rotate(' + (1 - salida(d)) * -360 + 'deg) scale(' + (d > 0 ? rebote(d) : 0) + ')'
    aparecer($('#fecha'), t, T.tarjeta + 1.85)
    aparecer($('#hora'), t, T.tarjeta + 2.1)
    aparecer($('#dir'), t, T.tarjeta + 2.4)
    aparecer($('#b0'), t, T.tarjeta + 2.8)
    aparecer($('#b1'), t, T.tarjeta + 3.2)
    aparecer($('#b2'), t, T.tarjeta + 3.6)
    // Un leve latido del nombre mientras se lee.
    if (t > T.tarjeta + 1.6) $('#nombre').style.transform = 'scale(' + (1 + Math.sin((t - T.tarjeta) * 3) * .015) + ')'
  }
  window.pintar(0)
</script></body></html>`
}

// ── Sonido: efectos suaves, sin música ──
const FFMPEG = [process.env.FFMPEG_PATH, join(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Links/ffmpeg.exe'), 'C:/ProgramData/chocolatey/bin/ffmpeg.exe', '/usr/bin/ffmpeg'].filter(Boolean).find((p) => existsSync(p)) || 'ffmpeg'
const correr = (args) => new Promise((ok, mal) => {
  const p = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] })
  let e = ''; p.stderr.on('data', (d) => (e += d)); p.on('close', (c) => (c === 0 ? ok() : mal(new Error(e))))
})
const SONIDOS = {
  // El cartel que cae y rebota: un tono que baja con un temblor.
  boing: "aevalsrc='0.5*sin(2*PI*(520-300*t+18*sin(2*PI*14*t))*t)*exp(-t*5)':d=0.6",
  // El saltito: un "blup" que sube.
  pop: "aevalsrc='0.6*sin(2*PI*(420+900*t)*t)*exp(-t*18)':d=0.18",
  // La puerta: un crujido grave que se arrastra.
  puerta: "anoisesrc=color=brown:d=1.1:a=0.7,bandpass=f=320:w=180,tremolo=f=9:d=0.6,afade=t=in:d=0.1,afade=t=out:st=0.6:d=0.5,volume=1.4",
  barrido: 'anoisesrc=color=pink:d=1.2:a=0.5,bandpass=f=1100:w=900,afade=t=in:d=0.5,afade=t=out:st=0.6:d=0.6,volume=0.9',
  // El brillo de la tarjeta: tres notas que suben.
  brillo: "aevalsrc='0.35*(sin(2*PI*1047*t)*between(t,0,0.25)+sin(2*PI*1319*t)*between(t,0.1,0.35)+sin(2*PI*1568*t)*between(t,0.2,0.6))*exp(-(t)*4)':d=0.8",
}
async function armarSonido(destino) {
  const dir = join(SALIDA, 'sonidos'); mkdirSync(dir, { recursive: true })
  for (const [n, f] of Object.entries(SONIDOS)) await correr(['-f', 'lavfi', '-i', f, '-ar', '48000', '-ac', '2', join(dir, n + '.wav')])
  const ins = [], fil = []
  EVENTOS.forEach(([n, t], k) => { ins.push('-i', join(dir, n + '.wav')); const ms = Math.round(t * 1000); fil.push(`[${k}]adelay=${ms}|${ms}[a${k}]`) })
  fil.push(EVENTOS.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${EVENTOS.length}:normalize=0,volume=1.1,alimiter=limit=0.5:level=disabled,apad=whole_dur=${DUR}[s]`)
  await correr([...ins, '-filter_complex', fil.join(';'), '-map', '[s]', '-t', String(DUR), destino])
}

// ── Captura cuadro por cuadro ──
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
async function chrome() {
  const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(existsSync)
  const perfil = mkdtempSync(join(tmpdir(), 'valentin-'))
  const puerto = 9600 + Math.floor(Math.random() * 90)
  const p = spawn(exe, ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'])
  let l
  for (let i = 0; i < 60; i++) { try { l = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json(); if (l.length) break } catch {} await esperar(250) }
  const ws = new WebSocket(l.find((x) => x.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0; const pend = {}
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id] } }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false })
  await cmd('Page.enable')
  return { cmd, cerrar: () => { ws.close(); p.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

const mirar = process.argv.includes('--mirar')
if (!existsSync(join(PIEZAS, 'granero.png'))) { console.error('Falta correr antes: node marketing/cumple-valentin/piezas.mjs'); process.exit(1) }
const { cmd, cerrar } = await chrome()
try {
  const audio = join(SALIDA, 'sonido.wav')
  if (!mirar) await armarSonido(audio)
  for (const v of mirar ? VERSIONES.slice(0, 1) : VERSIONES) {
    const cuadros = join(SALIDA, 'cuadros-' + v.archivo)
    rmSync(cuadros, { recursive: true, force: true }); mkdirSync(cuadros, { recursive: true })
    const html = join(SALIDA, v.archivo + '.html'); writeFileSync(html, escena(v.hora))
    await cmd('Page.navigate', { url: pathToFileURL(html).href })
    await cmd('Runtime.evaluate', { awaitPromise: true, expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?i.decode().catch(()=>0):new Promise(r=>{i.onload=i.onerror=r})))})()` })
    const tiempos = mirar ? [0.3, 0.75, 1.4, 1.9, 3.5, 5.5, 7.5, 8.8, 9.9, 11.5, 13.5, 18.5] : Array.from({ length: DUR * FPS }, (_, n) => n / FPS)
    for (let n = 0; n < tiempos.length; n++) {
      await cmd('Runtime.evaluate', { awaitPromise: true, expression: `new Promise(r=>{pintar(${tiempos[n]});requestAnimationFrame(()=>requestAnimationFrame(r))})` })
      const s = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } })
      writeFileSync(join(cuadros, `${String(n).padStart(4, '0')}.jpg`), Buffer.from(s.result.data, 'base64'))
      if (n % 90 === 0) console.log(' ', v.archivo, n, '/', tiempos.length)
    }
    if (!mirar) {
      // Liviano para WhatsApp: H.264, CRF 23.
      const mp4 = join(SALIDA, v.archivo + '.mp4')
      await correr(['-framerate', String(FPS), '-i', join(cuadros, '%04d.jpg'), '-i', audio, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', mp4])
      console.log('✓', mp4)
    }
  }
} finally { cerrar() }
