// ⚠️ LOS CINCO SERVICIOS, EN UN SOLO LUGAR: los dibuja la sección "Qué hacemos"
// (Hacemos.astro) y los repite la marquesina del hero en el teléfono
// (Hero.astro). Si se suma o se saca uno, se cambia acá y las dos lo siguen.
// `d` marca los dos destacados (Desarrollo web y Productos digitales), que en
// la sección van con el lavado del degradé.
export interface Servicio {
  n: string
  t: string
  d?: boolean
}

export const SERVICIOS: Servicio[] = [
  { d: true, n: 'Desarrollo web', t: 'Sitios corporativos, landing pages y experiencias web desarrolladas desde cero: rápidos, responsive, escalables y fáciles de encontrar. Sin plantillas.' },
  { d: true, n: 'Productos digitales', t: 'Plataformas y aplicaciones web con lógica, usuarios y datos reales: paneles, sistemas internos, herramientas a medida y MVPs para salir a probar.' },
  { n: 'Experiencias digitales', t: 'Contenido, movimiento e interacción para convertir una visita en algo memorable. Micrositios, lanzamientos, piezas que se recuerdan.' },
  { n: 'Identidad y diseño', t: 'Una identidad no termina en un logo: un sistema visual capaz de vivir en una web, una presentación, un packaging o una pantalla.' },
  { n: 'Presentaciones digitales', t: 'Una presentación no es un PDF con el logo arriba. El relato, la jerarquía de la información y una estética que sostiene la marca.' },
]
