// ============================================================
// LOS PROYECTOS DE LA HOME
// ============================================================
// ⚠️ PARA SUMAR UN PROYECTO SE AGREGA UN OBJETO ACÁ Y NADA MÁS. La sección
// dibuja lo que haya en este arreglo, en este orden, y el visor abre `sitio`
// adentro del iPad o del iPhone. Cada uno necesita dos portadas: 1440×900
// (escritorio) y 390×844 (teléfono), en `public/v4/proyectos/`.
//
// ⚠️ `sitio` ES UNA RUTA LOCAL: los proyectos se miran adentro del visor, en
// un iframe del mismo origen, así que hay que copiarlos a
// `public/v4/proyectos/`. Cuando un proyecto tenga dominio propio, `sitio`
// puede ser su URL y `externo: true` hace que el botón lo abra en otra
// pestaña en vez de en el visor.
//
// ⚠️ `acento` es el color del proyecto: pinta el filete de su tarjeta y el
// marco del visor. Sale de la paleta de cada sitio.

export type Proyecto = {
  slug: string
  nombre: string
  tipo: string
  ano: string
  sector: string
  resumen: string
  sitio: string
  externo?: boolean
  acento: string
  // ⚠️ Cuando el hero del sitio es más alto que el iPad del visor, se lo mira
  // un poco alejado para que entre entero (y la portada se captura igual).
  zoom?: number
}

export const PROYECTOS: Proyecto[] = [
  {
    slug: 'pilates',
    nombre: 'Pilates Power Fit',
    tipo: 'Sitio web',
    ano: '2026',
    sector: 'Estudio de pilates · Rosario',
    resumen: 'Un estudio de pilates que necesitaba dejar de vivir en Instagram. Sitio en una sola página: método, clases, horarios, opiniones y reserva por WhatsApp.',
    sitio: '/v4/proyectos/pilates/index.html',
    acento: '#B8D9C4',
    zoom: 0.85,
  },
  {
    slug: 'cenit',
    nombre: 'Cenit',
    tipo: 'Sitio web',
    ano: '2026',
    sector: 'Planetario · Tenerife',
    resumen: 'La cartelera de un planetario tratada como un instrumento: video de la Tierra en bucle, corte técnico del domo, carta del cielo de esta noche y entradas.',
    sitio: '/v4/proyectos/cenit.html',
    acento: '#7FD4E8',
  },
  {
    slug: 'meridiano',
    nombre: 'Meridiano',
    tipo: 'Sitio web · Buscador',
    ano: '2026',
    sector: 'Agencia de viajes a medida',
    resumen: 'Una agencia que no vende paquetes. Buscador de itinerarios con filtros propios, un viaje de doce días abierto como documento, y reseñas.',
    sitio: '/v4/proyectos/meridiano.html',
    acento: '#2540D8',
  },
  {
    slug: 'gadir',
    nombre: 'Biblioteca Gadir',
    tipo: 'Sitio institucional',
    ano: '2026',
    sector: 'Biblioteca pública · Cádiz',
    resumen: 'Doscientos cuarenta años de biblioteca sin una sola serif. Catálogo con signaturas, línea de tiempo que se dibuja, calendario de actos y el carné en tres pasos.',
    sitio: '/v4/proyectos/gadir.html',
    acento: '#7A2230',
  },
]
