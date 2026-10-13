// ============================================================
// TRAER PILATES POWER FIT
// ============================================================
//
// Copia el sitio ya compilado de Pilates Power Fit adentro de `public/v2/ppf/`,
// que es lo que el visor de la sección de proyectos abre en un iframe.
//
// ⚠️ LA COPIA ES UNA FOTO, NO UN ESPEJO. Lo que vive en Brickell es el `dist/`
// de Pilates congelado en el momento en que se corrió esto. Si se toca aquel
// proyecto, acá no cambia nada hasta que se vuelva a correr:
//
//     cd <proyecto de pilates> && npm run build
//     cd <brickell> && npm run ppf
//
// Y no puede ser de otra manera: el sitio de Pilates no está publicado en
// ningún lado, así que no hay una URL de la que Brickell pueda leerlo en vivo.
// El día que se publique, el visor deja de tener sentido: ese día el proyecto
// pasa a tener link como Lúmina y esta carpeta se borra.
//
// ⚠️ Y LA COPIA SE PARCHEA, no se pega tal cual. Dos cosas:
//
//   1. LAS RUTAS. El sitio se compiló para vivir en la raíz de su dominio, así
//      que pide `/media/…` y `/_astro/…`. Servido desde `/v2/ppf/`, eso apunta
//      a la raíz de Brickell, donde no hay nada. Se pasan a relativas.
//
//   2. LA VIDRIERA. Adentro del visor el sitio se mira, no se usa: todo enlace
//      que salga —WhatsApp, Spotify, Instagram, Maps, el dominio real— queda
//      apagado y avisa, igual que en la demo de una invitación de Lúmina. Las
//      anclas internas siguen andando, que son las que hacen que se entienda.
//
//   3. LAS BARRAS DE SCROLL. Dos problemas distintos.
//
//      De costado: el sitio se pasa unos píxeles del ancho —el video de la
//      portada y la cinta del ticker— y en su propio dominio no se nota, pero
//      adentro del visor aparecía una barra horizontal que no tiene nada que
//      ver con el diseño. Se recorta.
//
//      Y la de abajo a arriba: SE ESCONDE, no se apaga. Adentro del marco de un
//      teléfono una barra de scroll de escritorio es lo único que delata que
//      eso es un iframe —ningún teléfono dibuja una—. El scroll sigue
//      funcionando igual, con la rueda y con el dedo: lo único que se va es el
//      dibujo de la barra.
//
//      Las dos cosas se arreglan acá, en la copia, y no se toca el proyecto
//      original.
//
// Uso:  npm run ppf            (con la ruta de abajo)
//       npm run ppf -- "D:/otra/ruta/dist"
// ============================================================

import { cp, readFile, writeFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ORIGEN =
  process.argv[2] ||
  process.env.PPF_DIST ||
  'C:/Users/gonza/OneDrive/Desktop/BRICKELL LAB STUDIOS/PILATES POWER FIT/WEB NUEVA/web-v2/dist'

const DESTINO = 'public/v2/ppf'

const VIDRIERA = `
<style>
  /* Ver la nota 3 arriba. */
  html, body { overflow-x: hidden; max-width: 100%; }

  /* La barra de scroll se esconde; el scroll sigue andando. */
  html { scrollbar-width: none; -ms-overflow-style: none; }
  html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0; height: 0; display: none; }

  /* El aviso de la vidriera. Lo pone \`scripts/traer-ppf.mjs\`: no está en el
     proyecto de Pilates, sólo en la copia que vive adentro de Brickell. */
  /* ⚠️ NO ES UNA PASTILLA. Era un radio de 999 y en el ancho de un
     teléfono el texto entra en dos o tres renglones: una pastilla de tres
     renglones se ve aplastada y no se lee. Rectángulo redondeado, cuerpo más
     grande y más aire adentro —y ojo: todo esto se ve DESPUÉS de que el visor
     achica el iframe a ~0,9, así que hay que dibujarlo un toque más grande de
     lo que parece necesario—. */
  .ppf-vidriera {
    position: fixed;
    /* ⚠️ LOS DOS COSTADOS, NO \`left: 50%\`. Con sólo la izquierda al 50%, el
       ancho disponible para el texto es lo que queda de ahí al borde —la mitad
       de la pantalla—, así que en un teléfono el cartel salía de 195 píxeles y
       la frase caía en cuatro renglones. Con los dos costados fijos y
       \`margin-inline: auto\` queda centrado y con la pantalla entera para
       repartir. */
    left: 14px;
    right: 14px;
    bottom: 20px;
    z-index: 2147483647;
    margin-inline: auto;
    width: fit-content;
    transform: translateY(18px);
    padding: 15px 20px;
    border-radius: 18px;
    background: rgba(12, 10, 16, .96);
    border: 1px solid rgba(255, 255, 255, .18);
    color: #fff;
    font: 500 15px/1.45 Inter, system-ui, sans-serif;
    text-align: center;
    text-wrap: balance;
    opacity: 0;
    pointer-events: none;
    transition: opacity .22s ease-out, transform .22s cubic-bezier(.2, .7, .3, 1);
  }
  .ppf-vidriera--si { opacity: 1; transform: translateY(0); }
</style>
<script>
  (() => {
    const aviso = document.createElement('div')
    aviso.className = 'ppf-vidriera'
    aviso.setAttribute('role', 'status')
    aviso.textContent = 'Es una demo: los enlaces externos están apagados.'
    document.body.appendChild(aviso)

    let reloj
    const avisar = () => {
      aviso.classList.add('ppf-vidriera--si')
      clearTimeout(reloj)
      reloj = setTimeout(() => aviso.classList.remove('ppf-vidriera--si'), 2800)
    }

    // En captura: se atrapa el clic ANTES de que llegue al enlace. Las anclas
    // internas (#metodo, #clases) siguen funcionando.
    addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (href.startsWith('#')) return
      const afuera = /^(https?:|mailto:|tel:|whatsapp:|sms:)/i.test(href)
        && !href.startsWith(location.origin)
      if (!afuera) return
      e.preventDefault()
      e.stopPropagation()
      avisar()
    }, true)
  })()
</script>
`

const existe = async (p) => { try { await stat(p); return true } catch { return false } }

if (!(await existe(join(ORIGEN, 'index.html')))) {
  console.error(`\nNo encontré un sitio compilado en:\n  ${ORIGEN}\n`)
  console.error('Corré `npm run build` en el proyecto de Pilates, o pasá la ruta:')
  console.error('  npm run ppf -- "C:/ruta/al/dist"\n')
  process.exit(1)
}

await rm(DESTINO, { recursive: true, force: true })
await cp(ORIGEN, DESTINO, { recursive: true })

const html = join(DESTINO, 'index.html')
let s = await readFile(html, 'utf8')

for (const [a, b] of [
  ['"/media/', '"media/'], ["'/media/", "'media/"], ['(/media/', '(media/'],
  ['"/_astro/', '"_astro/'], ["'/_astro/", "'_astro/"],
]) s = s.split(a).join(b)

if (!s.includes('ppf-vidriera')) s = s.replace('</body>', VIDRIERA + '</body>')

await writeFile(html, s)
console.log(`Pilates Power Fit copiado a ${DESTINO}/ y puesto en modo vidriera.`)
