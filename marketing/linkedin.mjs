// ============================================================
// linkedin.mjs — las piezas de LinkedIn de Brickell Lab
// ============================================================
//
// CÓMO FUNCIONA. Igual que `generar.mjs`: cada placa es una página HTML con el
// sistema de la web (Geist + Geist Mono, blanco y tinta, el rótulo mono con la
// rayita de marca) y Chrome headless la captura. Acá el formato es CUADRADO
// 1200 × 1200, que es lo que LinkedIn muestra completo en el feed y es el
// estándar de los documentos.
//
//   node marketing/linkedin.mjs            → todas
//   node marketing/linkedin.mjs firmar     → sólo las que empiezan así
//
// Salida: marketing/salida/linkedin/<serie>/<nn>.png
//         marketing/salida/linkedin/<serie>.pdf  (sólo los carruseles)
//
// ⚠️ LOS CARRUSELES SALEN TAMBIÉN EN PDF porque en LinkedIn se suben como
// DOCUMENTO, no como varias imágenes: el documento se pasa con el dedo dentro
// del propio feed y es el formato que más alcance tiene. El PNG queda igual
// por si alguna vez se publica como carrusel de imágenes.
//
// ⚠️ ACÁ NO SE HABLA DE PROYECTOS NI SE LOS NOMBRA (Gonzalo). En LinkedIn no
// está el novio mirando invitaciones: está el que tiene que contratar y
// responder por la decisión adentro de su empresa. Entonces las piezas no
// dicen "hicimos el sitio de un planetario" —a ese lector no le mueve nada—:
// le hablan de lo que necesita para estar tranquilo cuando firma. Las pantallas
// se pueden MOSTRAR; lo que no se hace es contar de quién son.
//
// ⚠️ Y NO HAY NÚMEROS INVENTADOS. Los plazos de la serie "cuánto tarda" son los
// que ya están escritos en el artículo del blog (`data/v4/articulos.ts`), que
// es lo que el estudio sostiene en público. Si alguna vez cambian, cambian en
// los dos lugares.
// ============================================================

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

const AQUI = dirname(fileURLToPath(import.meta.url))
const WEB = join(AQUI, '..', 'public', 'v4')
const SALIDA = join(AQUI, 'salida', 'linkedin')
const img = (ruta) => pathToFileURL(join(WEB, ruta)).href

const LADO = 1200
const M = 96 // margen

// ── El sistema de la web, en px de placa cuadrada ──
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
  html, body { width: ${LADO}px; height: ${LADO}px; overflow: hidden; }
  body { font-family: 'Geist', system-ui, sans-serif; color: var(--tinta); background: var(--papel); -webkit-font-smoothing: antialiased; }
  .placa { position: relative; width: ${LADO}px; height: ${LADO}px; overflow: hidden; padding: ${M}px; display: flex; flex-direction: column; }
  .rotulo { display: grid; gap: 14px; justify-items: start; font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: var(--gris); }
  .rotulo::after { content: ''; width: 48px; height: 3px; border-radius: 2px; background: var(--marca); }
  h1, h2 { font-weight: 600; letter-spacing: -.035em; line-height: 1.04; text-wrap: balance; }
  .color { background: var(--marca-txt); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .bajada { color: var(--gris); font-size: 30px; line-height: 1.45; text-wrap: pretty; }
  /* El cuerpo centrado, y el pie siempre abajo. */
  .cuerpo { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 34px; }
  .pie { display: flex; align-items: center; gap: 24px; }
  .pie img { height: 30px; }
  .pie i { flex: 1; height: 2px; background: var(--linea); }
  .pie span { font-family: 'Geist Mono', monospace; font-size: 21px; letter-spacing: .1em; text-transform: uppercase; color: var(--gris); }
  .conteo { font-family: 'Geist Mono', monospace; font-size: 21px; letter-spacing: .14em; color: var(--gris-2); font-variant-numeric: tabular-nums; }
  .cab { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
  /* El número grande de cada pregunta: ordena sin decorar. */
  .num { font-family: 'Geist Mono', monospace; font-weight: 500; font-size: 26px; letter-spacing: .1em; color: transparent; background: var(--marca); -webkit-background-clip: text; background-clip: text; }
  .oscura { background: var(--noche); color: #fff; }
  .oscura .rotulo { color: rgba(255,255,255,.6); }
  .oscura .bajada { color: rgba(255,255,255,.74); }
  .oscura .pie i { background: rgba(255,255,255,.16); }
  .oscura .pie span { color: rgba(255,255,255,.6); }
  .oscura .conteo { color: rgba(255,255,255,.5); }
  /* La lista de filetes: la anatomía de la web, acá adentro. */
  .filas { display: grid; border-top: 2px solid var(--linea); }
  .filas > div { display: grid; gap: 8px; padding: 26px 0; border-bottom: 2px solid var(--linea); }
  .filas b { font-size: 34px; font-weight: 600; letter-spacing: -.02em; }
  .filas span { font-size: 26px; line-height: 1.4; color: var(--gris); }
  .oscura .filas { border-color: rgba(255,255,255,.14); }
  .oscura .filas > div { border-color: rgba(255,255,255,.14); }
  .oscura .filas span { color: rgba(255,255,255,.66); }
  /* ── Los aparatos ──
     ⚠️ EL CANTO DEL MARCO ES UN BORDE, NO UNA SOMBRA DE SPREAD, y la sombra
     blanda va por clase. Al imprimir el PDF, Chrome dibuja los box-shadow SIN
     respetar el border-radius: quedaba un rectángulo gris detrás de cada
     teléfono (se veía en el documento, no en los PNG). Con box-sizing
     border-box el borde no cambia el tamaño de afuera, así que se ve igual; y
     en impresión la sombra se apaga.
     ⚠️ Y OJO CON LOS BACKTICKS: este bloque entero es un template literal.
     Un backtick acá adentro rompe el archivo. */
  .aparato { box-shadow: var(--sombra); }
  @media print { .aparato { box-shadow: none; } }
</style>`

const pie = (oscura = false, k = 0, n = 0) => `<div class="pie">
  <img src="${img(oscura ? 'logo-brickell-blanco.png' : 'logo-brickell.png')}" alt=""><i></i>
  <span>labbrickell.com.ar</span>${n > 1 ? `<span class="conteo">${k}/${n}</span>` : ''}
</div>`
const pagina = (cuerpo, clase = '') => `<!doctype html><html lang="es"><head><meta charset="utf-8">${BASE}</head><body><div class="placa ${clase}">${cuerpo}</div></body></html>`

// ── El iPad y el iPhone, en px de placa cuadrada ──
// Las mismas proporciones que la web: iPad 11" apaisado atrás, iPhone 15
// adelante con su centro en el borde derecho del iPad.
function aparatos({ esc, tel, ancla = 'left top', alto = 400 }) {
  const h = alto / 100
  return `
  <div style="position:relative;width:${155 * h}px;height:${114 * h}px;margin:0 auto">
    <div class="aparato" style="position:absolute;left:0;top:${12 * h}px;width:${136.6 * h}px;padding:${2.56 * h}px;border:${0.53 * h}px solid #3a3a44;border-radius:${6.4 * h}px;background:#16161b;--sombra:0 ${6.4 * h}px ${12.8 * h}px -${4.27 * h}px rgba(11,11,15,.35)">
      <div style="position:relative;aspect-ratio:2360/1640;overflow:hidden;border-radius:${3.84 * h}px;background:#fff">
        <img src="${esc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${ancla}">
      </div>
    </div>
    <div class="aparato" style="position:absolute;left:${(136.6 - 18.65) * h}px;top:${35.6 * h}px;width:${37.3 * h}px;padding:${1.2 * h}px;border:${0.53 * h}px solid #4a4a55;border-radius:${6.19 * h}px;background:#0b0b0f;--sombra:0 ${6.4 * h}px ${10.7 * h}px -${3.2 * h}px rgba(11,11,15,.45)">
      <div style="position:relative;aspect-ratio:1179/2556;overflow:hidden;border-radius:${5.04 * h}px;background:#fff">
        <img src="${tel}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top">
      </div>
      <i style="position:absolute;top:${2.24 * h}px;left:50%;width:${10 * h}px;height:${3 * h}px;border-radius:99px;background:#000;transform:translateX(-50%)"></i>
    </div>
  </div>`
}

/**
 * Un iPhone solo, con una captura adentro.
 *
 * ⚠️ SE MIDE POR EL ALTO, no por el ancho: estas piezas apoyan el teléfono
 * contra el borde de la placa o lo dejan asomar, así que lo que se elige es
 * cuánto alto ocupa. Las proporciones son las mismas que en `aparatos()`
 * (iPhone 15: pantalla 1179 × 2556, marco 1.2 y radio 6.19 sobre 37.3 de
 * ancho), de ahí sale el 2.0927 del alto total sobre el ancho.
 */
function fono({ src, alto, ancla = 'top' }) {
  const w = alto / 2.0927
  return `
  <div class="aparato" style="position:relative;width:${w}px;padding:${w * 0.0322}px;border:${w * 0.0142}px solid #4a4a55;border-radius:${w * 0.166}px;background:#0b0b0f;--sombra:0 ${w * 0.17}px ${w * 0.29}px -${w * 0.086}px rgba(11,11,15,.45)">
    <div style="position:relative;aspect-ratio:1179/2556;overflow:hidden;border-radius:${w * 0.135}px;background:#fff">
      <img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${ancla}">
    </div>
    <i style="position:absolute;top:${w * 0.06}px;left:50%;width:${w * 0.268}px;height:${w * 0.08}px;border-radius:99px;background:#000;transform:translateX(-50%)"></i>
  </div>`
}

// ============================================================
// LAS SERIES
// ============================================================
const SERIES = {}

// ── A. Carrusel: las preguntas antes de firmar ──
// El lector de LinkedIn no quiere ver trabajos: quiere no equivocarse. Esta
// serie le da el listado con el que puede evaluar a CUALQUIER estudio,
// nosotros incluidos. Eso es lo que la hace creíble.
const PREGUNTAS = [
  {
    t: '¿El dominio, el código y los accesos quedan a mi nombre?',
    d: 'Tu sitio es un activo de la empresa. Si algún día cambiás de proveedor, te lo tenés que poder llevar completo.',
  },
  {
    t: '¿Qué incluye el precio y qué no?',
    d: 'Cuántas secciones, quién escribe los textos, si las fotos van incluidas, cuántas rondas de cambios y qué pasa con el dominio y el hosting.',
  },
  {
    t: '¿Cuánto tarda y de qué depende?',
    d: 'Un plazo que no depende de nada es un plazo que no se va a cumplir. Casi siempre depende del contenido, y eso tiene que estar dicho.',
  },
  {
    t: '¿Quién responde cuando algo se rompe?',
    d: 'Un nombre y un tiempo de respuesta, no un área. Publicar no es terminar.',
  },
  {
    t: '¿Lo diseñan y lo programan ustedes?',
    d: 'Cuando el diseño y el código viven en lugares distintos, lo que se pierde en el traspaso lo termina pagando el cliente.',
  },
]
{
  const N = PREGUNTAS.length + 2
  SERIES['li-antes-de-firmar'] = [
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Para quien está por contratar</p>
        <h1 style="font-size:86px">Cinco preguntas antes de firmar con un estudio.</h1>
        <p class="bajada" style="max-width:30ch">Si no las contesta por escrito, todavía no tenés un presupuesto.</p>
      </div>
      ${pie(false, 1, N)}`),
    ...PREGUNTAS.map((p, i) => pagina(`
      <div class="cuerpo">
        <p class="num">${String(i + 1).padStart(2, '0')}</p>
        <h2 style="font-size:70px">${p.t}</h2>
        <p class="bajada" style="max-width:34ch">${p.d}</p>
      </div>
      ${pie(false, i + 2, N)}`)),
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Lo que hacemos nosotros</p>
        <h2 style="font-size:78px">Un presupuesto es un documento, no un número.</h2>
        <p class="bajada" style="max-width:32ch">Antes de empezar dejamos por escrito el alcance, los plazos, de qué dependen y qué queda a tu nombre. Después se trabaja.</p>
      </div>
      ${pie(true, N, N)}`, 'oscura'),
  ]
}

// ── B. Carrusel: cuánto tarda ──
// ⚠️ LOS PLAZOS SON LOS DEL BLOG, no estimaciones nuevas.
const PLAZOS = [
  { b: 'Una sola página', s: 'Dos a cuatro semanas. Alcanza cuando hay una oferta clara y un solo llamado a la acción.' },
  { b: 'Un sitio institucional', s: 'Cuatro a ocho semanas, según cuántas secciones tenga y cuánto contenido haya que producir.' },
  { b: 'Una plataforma con usuarios y datos', s: 'Meses. Hay lógica, permisos y casos de error: no se estima como un sitio.' },
]
{
  const N = PLAZOS.length + 3
  SERIES['li-cuanto-tarda'] = [
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Plazos</p>
        <h1 style="font-size:92px">¿Cuánto tarda un sitio?</h1>
        <p class="bajada" style="max-width:30ch">Depende de qué estés pidiendo. Estos son los rangos con los que trabajamos.</p>
      </div>
      ${pie(false, 1, N)}`),
    ...PLAZOS.map((p, i) => pagina(`
      <div class="cuerpo">
        <p class="num">${String(i + 1).padStart(2, '0')}</p>
        <h2 style="font-size:74px">${p.b}</h2>
        <p class="bajada" style="max-width:34ch">${p.s}</p>
      </div>
      ${pie(false, i + 2, N)}`)),
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Lo que atrasa de verdad</p>
        <h2 style="font-size:78px">Casi nunca es el código. Es el contenido.</h2>
        <p class="bajada" style="max-width:32ch">Los textos, las fotos y las aprobaciones internas. El proyecto que llega con el contenido resuelto se publica semanas antes.</p>
      </div>
      ${pie(false, N - 1, N)}`),
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Una señal de alerta</p>
        <h2 style="font-size:80px">Si te prometen un sitio completo en una semana, te van a entregar una plantilla.</h2>
      </div>
      ${pie(true, N, N)}`, 'oscura'),
  ]
}

// ── C a F. Posteos de una sola placa ──
SERIES['li-presupuesto'] = [
  pagina(`
    <div class="cuerpo">
      <p class="rotulo">Cómo se cotiza</p>
      <h1 style="font-size:92px">"Sitio web institucional: $X" <span class="color">no es un presupuesto.</span></h1>
      <p class="bajada" style="max-width:32ch">Es un número. Un presupuesto dice qué incluye, qué no, cuánto tarda y de qué depende ese plazo.</p>
    </div>
    ${pie()}`),
]

SERIES['li-un-responsable'] = [
  pagina(`
    <div class="cuerpo">
      <p class="rotulo">Cómo trabajamos</p>
      <h1 style="font-size:88px">Diseño y desarrollo en el mismo lugar.</h1>
      <p class="bajada" style="max-width:34ch">Sin traspasos entre un estudio que diseña y otro que programa: un solo responsable de que lo que aprobaste sea lo que se publica.</p>
      <div class="filas" style="margin-top:10px">
        <div><b>Un solo interlocutor</b><span>No hay que explicar dos veces lo mismo.</span></div>
        <div><b>Lo aprobado es lo que se publica</b><span>Nada se pierde en el camino al código.</span></div>
      </div>
    </div>
    ${pie()}`),
]

SERIES['li-publicar-no-es-terminar'] = [
  pagina(`
    <div class="cuerpo">
      <p class="rotulo">Después de publicar</p>
      <h1 style="font-size:92px">Publicar no es terminar.</h1>
      <p class="bajada" style="max-width:32ch">Un sitio que nadie mira después de la primera semana se desactualiza, se rompe y deja de aparecer. Preguntá quién lo sostiene, y cada cuánto.</p>
    </div>
    ${pie(true)}`, 'oscura'),
]

// ⚠️ ACÁ SE MUESTRA UNA PANTALLA PERO NO SE CUENTA DE QUIÉN ES: la pieza habla
// de cómo se trabaja, y la pantalla sólo prueba que existe.
SERIES['li-primero-el-telefono'] = [
  pagina(`
    <div style="display:grid;gap:26px">
      <p class="rotulo">Oficio</p>
      <h1 style="font-size:80px">Se diseña primero para el teléfono.</h1>
      <p class="bajada" style="max-width:36ch">Es desde donde te van a buscar. Si hay que hacer zoom para leer, el sitio no está terminado.</p>
    </div>
    <div style="flex:1;display:flex;align-items:center">${aparatos({ esc: img('hacemos/vesna-escritorio.webp'), tel: img('hacemos/vesna-telefono.webp'), ancla: 'right top', alto: 360 })}</div>
    ${pie()}`),
]

// ============================================================
// LAS PIEZAS DONDE MANDA LA IMAGEN
// ============================================================
//
// ⚠️ ESTAS NO SE LEEN, SE MIRAN (Gonzalo): las primeras son muy de texto y en
// el feed un bloque de texto se pasa de largo. Acá la pantalla ocupa media
// placa y el texto es un título y una línea. El argumento lo sostiene la
// imagen: son sitios reales, no mockups de plantilla.
//
// ⚠️ Y SIGUE VALIENDO QUE NO SE NOMBRA A NADIE. Cada línea enuncia un
// principio general; ninguna dice de qué rubro es la pantalla ni que la
// hicimos nosotros. Lo que se ve, se ve.
const CAPTURAS = ['cenit', 'gadir', 'meridiano', 'pilates'].map((n) => img(`proyectos/${n}-fono.webp`))

// ── G. Documento: lo que se decide en la primera pantalla ──
// ⚠️ CADA PRINCIPIO ESTÁ VISIBLE EN LA PANTALLA QUE LO ACOMPAÑA (se miraron
// las cuatro capturas una por una): la franja de datos, los dos botones con
// jerarquía distinta, el buscador metido en el hero y el título que se lee de
// lejos con el contacto flotando. Si alguna captura se reemplaza, hay que
// volver a mirar que la línea siga siendo cierta.
const PRIMERA = [
  {
    t: 'El dato que vino a buscar, arriba.',
    d: 'El horario, el precio, si está abierto. Si hay que buscarlo, se va antes de encontrarlo.',
    f: CAPTURAS[0],
  },
  {
    t: 'Un botón principal. Uno secundario.',
    d: 'Seis botones del mismo tamaño es ninguno. La jerarquía le dice al visitante qué queremos que haga.',
    f: CAPTURAS[1],
  },
  {
    t: 'Lo que vino a hacer, ya empezado.',
    d: 'El buscador, el turnero o el formulario en la primera pantalla, no escondidos en otra página.',
    f: CAPTURAS[2],
  },
  {
    t: 'Se lee de corrido, sin hacer zoom.',
    d: 'Y el contacto siempre a la vista, no al final del todo.',
    f: CAPTURAS[3],
  },
]
{
  const N = PRIMERA.length + 2
  SERIES['li-primera-pantalla'] = [
    // La portada también es imagen: una hilera de teléfonos que se va de la
    // placa por los dos lados —una fila que sigue—, y el logo arriba, porque
    // abajo no queda lugar para el pie.
    pagina(`
      <div style="position:absolute;left:-60px;right:-60px;bottom:-200px;display:flex;gap:16px">
        ${CAPTURAS.map((f) => fono({ src: f, alto: 665 })).join('')}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
        <p class="rotulo">Oficio</p>
        <img src="${img('logo-brickell.png')}" style="height:30px" alt="">
      </div>
      <div style="display:grid;gap:26px;margin-top:52px">
        <h1 style="font-size:84px;max-width:17ch">Cuatro cosas que se deciden en la primera pantalla.</h1>
        <p class="bajada" style="max-width:34ch">El visitante llega desde el teléfono y decide en segundos si sigue o se va. No lee: mira.</p>
      </div>`),
    // Las interiores: el teléfono grande, cortado por el borde derecho y por
    // abajo.
    // ⚠️ VA CORTADO A PROPÓSITO (Gonzalo): se probó entero, apoyado adentro de
    // la placa, y pierde fuerza —queda un teléfono de catálogo—. Cortado, la
    // pantalla se lee como una pantalla de verdad que sigue más allá del
    // cuadro, y ocupa más.
    ...PRIMERA.map((p, i) => pagina(`
      <div style="position:absolute;right:-60px;bottom:-140px">${fono({ src: p.f, alto: 1080 })}</div>
      <div class="cuerpo" style="max-width:560px;position:relative;gap:28px">
        <p class="num">${String(i + 1).padStart(2, '0')}</p>
        <h2 style="font-size:62px">${p.t}</h2>
        <p class="bajada" style="font-size:28px">${p.d}</p>
      </div>
      <div style="width:560px">${pie(false, i + 2, N)}</div>`)),
    pagina(`
      <div class="cuerpo">
        <p class="rotulo">Cuándo se decide</p>
        <h2 style="font-size:82px">Nada de esto se arregla después.</h2>
        <p class="bajada" style="max-width:32ch">Se decide antes de escribir la primera línea de código. Por eso diseñamos y programamos en el mismo lugar.</p>
      </div>
      ${pie(true, N, N)}`, 'oscura'),
  ]
}

// ── H. Cuatro sistemas, ninguna plantilla ──
SERIES['li-sin-plantilla'] = [
  pagina(`
    <div style="display:grid;gap:26px">
      <p class="rotulo">Diseño</p>
      <h1 style="font-size:82px;max-width:20ch">Cuatro proyectos. Cuatro sistemas. <span class="color">Ninguna plantilla.</span></h1>
      <p class="bajada" style="max-width:40ch">Tipografía, color, ritmo y jerarquía elegidos para cada negocio. Si ves el mismo diseño con otro logo, no te diseñaron nada.</p>
    </div>
    <div style="flex:1;display:flex;align-items:center;gap:16px">
      ${CAPTURAS.map((f) => fono({ src: f, alto: 502 })).join('')}
    </div>
    ${pie()}`),
]

// ── I. El estudio, a foto completa ──
// ⚠️ EL TEXTO ES EL DE LA WEB, no uno nuevo: la oficina ya tiene su párrafo en
// la sección "El estudio" y acá se dice lo mismo. La foto es muy clara, así
// que lleva el velo oscuro de abajo para que el título se lea.
SERIES['li-el-estudio'] = [
  pagina(`
    <img src="${img('estudio-oficina.webp')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 60%">
    <i style="position:absolute;inset:0;background:linear-gradient(rgba(11,11,15,.1) 14%,rgba(11,11,15,.66) 46%,rgba(11,11,15,.96))"></i>
    <div style="position:relative;margin-top:auto;display:grid;gap:26px">
      <p class="rotulo">El estudio</p>
      <h1 style="font-size:86px;max-width:20ch">Un nombre que es una forma de trabajar.</h1>
      <p class="bajada" style="max-width:38ch">Nos interesan los proyectos que todavía no están del todo definidos. Las ideas que necesitan convertirse en algo concreto.</p>
      ${pie(true)}
    </div>`, 'oscura'),
]

// ============================================================
// LAS PIEZAS DE LÚMINA, CONTADAS POR EL ESTUDIO
// ============================================================
//
// ⚠️ ACÁ NO SE VENDE LÚMINA: se vende el estudio. En LinkedIn no está la novia
// eligiendo invitación; está el que tiene que contratar. A ese lector Lúmina le
// prueba una cosa sola —que el estudio mantiene un producto propio, con
// usuarios, soporte y consecuencias— y de ahí salen las lecciones que después
// se aplican en el proyecto del cliente. Todo lo de "contá tu evento como se
// merece" es de la cuenta de Lúmina, no de ésta.
//
// ⚠️ Y SE DICE SIEMPRE "CASAMIENTOS Y FIESTAS DE QUINCE". Nada de "eventos" a
// secas ni de "la fiesta que estés armando": Lúmina vende esos dos tipos y
// nada más, y una promesa de más termina en un reembolso.
//
// ⚠️ EL REGISTRO ES LA NOCHE DE LÚMINA (el fondo con el aura) pero la
// tipografía y el pie siguen siendo los de Brickell: la página es del estudio.
const aura = () => `<div style="position:absolute;inset:-10%;background:
  radial-gradient(70% 55% at 18% 32%, rgba(122,59,240,.30), transparent 70%),
  radial-gradient(60% 50% at 78% 22%, rgba(196,79,224,.20), transparent 68%),
  radial-gradient(55% 45% at 62% 78%, rgba(255,122,89,.09), transparent 72%)"></div>`

// La firma de Lúmina: el logo es negro, así que va por máscara, igual que en
// la web (ver `.lumina__logo` en Lumina.astro).
const firmaLumina = (alto = 34) => `<i style="display:block;width:${alto * 541 / 164}px;height:${alto}px;background:rgba(255,255,255,.85);-webkit-mask:url('${img('logo-lumina.png')}') left center/contain no-repeat;mask:url('${img('logo-lumina.png')}') left center/contain no-repeat"></i>`

const FONOS = img('lumina-fonos.webp')
const PANEL_TEL = img('hacemos/lumina-dashboard-telefono.webp')
const PANEL_ESC = img('hacemos/lumina-dashboard-escritorio.webp')

// ── J. El estudio tiene producto propio ──
SERIES['li-producto-propio'] = [
  pagina(`
    ${aura()}
    <img src="${FONOS}" style="position:absolute;right:-110px;bottom:-70px;height:940px">
    <div class="cuerpo" style="max-width:560px;position:relative;gap:30px">
      <p class="rotulo">Producto propio</p>
      <h1 style="font-size:68px">Un estudio que también atiende su propio producto.</h1>
      <p class="bajada" style="max-width:30ch">Lúmina es la plataforma de casamientos y fiestas de quince que diseñamos, programamos y sostenemos nosotros. Todos los días.</p>
      ${firmaLumina(32)}
    </div>
    <div style="width:560px;position:relative">${pie(true)}</div>`, 'oscura'),
]

// ── K. La función que se sacó ──
// ⚠️ ES UNA DECISIÓN QUE PASÓ DE VERDAD: el check-in del día del evento estaba
// hecho y se eliminó por el riesgo de conectividad en el salón (está anotado
// como descartado en el CLAUDE.md de Lúmina). No inventar otras.
SERIES['li-sacamos-una-funcion'] = [
  pagina(`
    <div style="position:absolute;right:-60px;bottom:-140px">${fono({ src: PANEL_TEL, alto: 1080 })}</div>
    <div class="cuerpo" style="max-width:560px;position:relative;gap:30px">
      <p class="rotulo">Una decisión</p>
      <h1 style="font-size:88px">Estaba hecha. <span class="color">La sacamos.</span></h1>
      <p class="bajada" style="max-width:32ch">En nuestro producto teníamos el control de ingreso para el día del evento. En un salón no siempre hay señal, y un error en la puerta no se puede deshacer.</p>
    </div>
    <div style="width:560px">${pie()}</div>`),
]

// ── L. Documento: lo que aprendimos manteniendo un producto ──
const APRENDIMOS = [
  {
    t: 'El caso raro es la mitad del trabajo.',
    d: 'Un invitado avisa que no va. No se borra: queda en el historial, se libera su lugar en la mesa, se cancela su traslado y baja el cupo del salón. Es una línea en la propuesta y semanas de trabajo.',
    foto: 'fono',
  },
  {
    t: 'Un dato, un solo lugar donde se calcula.',
    d: 'El mismo número aparece en el panel, en la mesa y en el resumen. Si se calcula en tres lugares, algún día no van a coincidir, y lo ve el cliente antes que vos.',
    foto: 'aparatos',
  },
  {
    t: 'Se diseña para el teléfono porque ahí se mira.',
    d: 'La invitación no tiene versión de escritorio: se la mira siempre en un teléfono. Diseñar para la demo de la reunión es diseñar para la pantalla equivocada.',
    foto: 'fonos',
  },
  {
    t: 'Lo que no está cargado, no se dibuja.',
    d: 'Un bloque vacío o un guión donde iba un dato no es "pendiente de completar": es un error a la vista del invitado. Si no hay dato, la sección no existe.',
    foto: null,
  },
]
{
  const N = APRENDIMOS.length + 2
  const ilustrar = (clase) =>
    clase === 'fono' ? `<div style="position:absolute;right:-60px;bottom:-140px">${fono({ src: PANEL_TEL, alto: 1080 })}</div>`
    : clase === 'fonos' ? `<img src="${FONOS}" style="position:absolute;right:-120px;bottom:-80px;height:900px">`
    : clase === 'aparatos' ? `<div style="position:absolute;right:-300px;bottom:70px">${aparatos({ esc: PANEL_ESC, tel: PANEL_TEL, alto: 580 })}</div>`
    : ''
  SERIES['li-aprendimos'] = [
    pagina(`
      ${aura()}
      <img src="${FONOS}" style="position:absolute;right:-150px;bottom:-120px;height:900px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;position:relative">
        <p class="rotulo">Producto propio</p>
        <img src="${img('logo-brickell-blanco.png')}" style="height:30px" alt="">
      </div>
      <div class="cuerpo" style="max-width:600px;position:relative;gap:28px">
        <h1 style="font-size:70px">Cuatro cosas que aprendimos manteniendo un producto nuestro.</h1>
        <p class="bajada" style="max-width:30ch">No son teoría: las pagamos nosotros primero.</p>
      </div>`, 'oscura'),
    ...APRENDIMOS.map((p, i) => pagina(`
      ${ilustrar(p.foto)}
      <div class="cuerpo" style="max-width:${p.foto === 'aparatos' ? 500 : p.foto ? 540 : 760}px;position:relative;gap:28px">
        <p class="num">${String(i + 1).padStart(2, '0')}</p>
        <h2 style="font-size:${p.foto ? 62 : 76}px">${p.t}</h2>
        <p class="bajada" style="font-size:28px">${p.d}</p>
      </div>
      <div style="width:${p.foto === 'aparatos' ? 500 : p.foto ? 540 : 760}px">${pie(false, i + 2, N)}</div>`)),
    pagina(`
      ${aura()}
      <div class="cuerpo" style="max-width:620px;position:relative;gap:30px">
        <p class="rotulo">Para qué sirve</p>
        <h2 style="font-size:82px">La escuela más cara que tenemos.</h2>
        <p class="bajada" style="max-width:32ch">Cada decisión de nuestro producto la pagamos nosotros. Después la aplicamos en los proyectos de los clientes.</p>
        ${firmaLumina(30)}
      </div>
      ${pie(true, N, N)}`, 'oscura'),
  ]
}

// ============================================================
// LA CAPTURA
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
  const perfil = mkdtempSync(join(tmpdir(), 'bl-li-'))
  const puerto = 9300 + Math.floor(Math.random() * 90)
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
  await cmd('Emulation.setDeviceMetricsOverride', { width: LADO, height: LADO, deviceScaleFactor: 1, mobile: false })
  await cmd('Page.enable')
  return { cmd, cerrar: () => { ws.close(); chrome.kill(); try { rmSync(perfil, { recursive: true, force: true }) } catch {} } }
}

const listo = (cmd) => cmd('Runtime.evaluate', {
  awaitPromise: true,
  expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));await new Promise(r=>setTimeout(r,250))})()`,
})

async function capturar(cmd, html, destino) {
  const tmp = join(tmpdir(), `bl-li-${process.pid}.html`)
  writeFileSync(tmp, html)
  await cmd('Page.navigate', { url: pathToFileURL(tmp).href })
  await listo(cmd)
  const s = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: LADO, height: LADO, scale: 1 } })
  writeFileSync(destino, Buffer.from(s.result.data, 'base64'))
}

/**
 * El PDF del carrusel: una página cuadrada por placa.
 *
 * ⚠️ SE ARMA CON UN SOLO HTML Y `printToPDF`, no juntando PNG: así el texto
 * queda como texto —se puede seleccionar y LinkedIn lo indexa— y pesa diez
 * veces menos que cinco capturas.
 */
async function armarPDF(cmd, placas, destino) {
  const cuerpos = placas.map((h) => h.slice(h.indexOf('<body>') + 6, h.lastIndexOf('</body>')))
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">${BASE}
<style>
  html, body { width: auto; height: auto; overflow: visible; }
  .placa { break-after: page; }
  .placa:last-child { break-after: auto; }
  @page { size: ${LADO}px ${LADO}px; margin: 0; }
</style></head><body>${cuerpos.join('')}</body></html>`
  const tmp = join(tmpdir(), `bl-li-doc-${process.pid}.html`)
  writeFileSync(tmp, html)
  await cmd('Page.navigate', { url: pathToFileURL(tmp).href })
  await listo(cmd)
  const r = await cmd('Page.printToPDF', {
    printBackground: true,
    paperWidth: LADO / 96,
    paperHeight: LADO / 96,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    preferCSSPageSize: true,
  })
  writeFileSync(destino, Buffer.from(r.result.data, 'base64'))
}

const filtro = process.argv[2]
mkdirSync(SALIDA, { recursive: true })
const { cmd, cerrar } = await abrirChrome()
try {
  for (const [serie, placas] of Object.entries(SERIES)) {
    const corto = serie.replace(/^li-/, '')
    if (filtro && !corto.startsWith(filtro) && !serie.startsWith(filtro)) continue
    const dir = join(SALIDA, serie)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (let k = 0; k < placas.length; k++) {
      await capturar(cmd, placas[k], join(dir, `${String(k + 1).padStart(2, '0')}.png`))
    }
    if (placas.length > 1) await armarPDF(cmd, placas, join(SALIDA, serie + '.pdf'))
    console.log('✓', serie, placas.length + ' placa(s)' + (placas.length > 1 ? ' + pdf' : ''))
  }
} finally {
  cerrar()
}
