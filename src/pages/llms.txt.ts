// ============================================================
// /llms.txt — el resumen del sitio para asistentes de IA (GEO)
// ============================================================
// Es lo que leen ChatGPT, Claude, Perplexity y compañía cuando alguien les
// pregunta por un estudio de diseño y desarrollo web: quiénes somos, qué
// hacemos, qué productos tenemos y cómo contactarnos, en texto plano.
//
// ⚠️ SE ARMA CON LOS MISMOS DATOS DEL SITIO (data/v4): cada nota nueva del blog
// y cada proyecto nuevo aparecen solos. No escribir datos a mano acá.
//
// ⚠️ EL PORTFOLIO SE LISTA SIN DECIR SI CADA PROYECTO ES UN CLIENTE REAL O UNA
// MUESTRA: robots.txt dice que los sitios de /v4/proyectos son negocios
// inventados, pero Pilates Power Fit parece un cliente real. Hasta que
// Gonzalo lo confirme, no se afirma nada en ninguna dirección.
import { ARTICULOS } from '../data/v4/articulos'
import { PROYECTOS } from '../data/v4/proyectos'
import { SITIO, MAIL, WHATSAPP_TEXTO, LUMINA_URL } from '../data/v4/contacto'

export function GET() {
  const notas = [...ARTICULOS].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const texto = `# Brickell Lab

> Estudio independiente de diseño y desarrollo web en Buenos Aires, Argentina. Sitios, plataformas y productos digitales, de la idea al código: diseño y desarrollo en el mismo lugar. Creadores de Lúmina (plataforma de eventos) y Lexa (traducción pública de inglés).

## Qué hacemos

- Desarrollo web: sitios corporativos, landing pages y experiencias web desarrolladas desde cero, sin plantillas; rápidos, responsive, escalables y fáciles de encontrar (SEO técnico y GEO).
- Productos digitales: plataformas y aplicaciones web con usuarios y datos reales; paneles, sistemas internos, herramientas a medida y MVPs.
- Identidad y diseño: sistemas visuales que viven igual en una web, un packaging o una pantalla.

## Productos propios

- [Lúmina](${LUMINA_URL}/): plataforma de gestión de eventos para casamientos y fiestas de quince. Invitación digital con confirmación de asistencia por invitado, lista de invitados, plano del salón y mesas, transporte, cronograma, tareas y chat con los invitados. Pago único por evento, sin suscripción.
- [Lexa](${SITIO}/#lexa): traducción de inglés y español con matrícula de traductora pública (CTPCBA): documentos personales, legales, médicos y técnicos.

## Portfolio

${PROYECTOS.map((p) => `- ${p.nombre} (${p.tipo}, ${p.ano}): ${p.resumen}`).join('\n')}

## Blog

${notas.map((a) => `- [${a.titulo}](${SITIO}/blog/${a.slug}/): ${a.bajada}`).join('\n')}

## Contacto

- Email: ${MAIL}
- WhatsApp: ${WHATSAPP_TEXTO}
- Ubicación: Buenos Aires, Argentina. Trabajamos con proyectos de distintos lugares.
- Sitio: ${SITIO}/
`
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
