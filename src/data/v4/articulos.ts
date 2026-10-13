// ============================================================
// LOS ARTÍCULOS
// ============================================================
// ⚠️ PARA SUMAR UNO SE AGREGA UN OBJETO ACÁ. La home dibuja las tarjetas y
// `pages/v4/blog/[slug].astro` genera una página por cada uno. El cuerpo
// va en HTML (párrafos, subtítulos, listas) y se inserta tal cual.
//
// ⚠️ EL TERCERO ES EL QUE POSICIONA. Está escrito para contestar lo que alguien
// pregunta en Google o en un motor de respuesta cuando busca un estudio: qué
// mirar, cuánto tarda, qué incluye. Por eso lleva preguntas y respuestas al
// final: se publican como FAQPage en datos estructurados.

export type Articulo = {
  slug: string
  titulo: string
  bajada: string
  fecha: string       // ISO
  fechaTexto: string
  lectura: string
  // Qué tipo de nota es, como la sección de un diario: la home la muestra
  // arriba del título. El blog junta temas para posicionar y novedades.
  seccion: 'Noticia' | 'Opinión' | 'Proyecto' | 'Guía'
  // Van en public/v4/articulos/, 1600×1000 (16:10), en webp. Los originales
  // que pasó Gonzalo están en docs/blog/. Al lado, cada una tiene su
  // `-og.jpg` (1200×750): es la que se comparte en WhatsApp y redes, que no
  // siempre leen webp.
  imagen: string
  imagenAlt: string
  cuerpo: string
  faq?: { p: string; r: string }[]
}

export const ARTICULOS: Articulo[] = [
  {
    slug: 'lumina-la-plataforma-de-eventos',
    titulo: 'Lúmina: por qué un estudio de diseño construyó una plataforma de eventos',
    bajada: 'Lo que aprendimos organizando un casamiento se convirtió en nuestro primer producto. Qué es, para quién, y cómo está hecho por dentro.',
    fecha: '2026-09-15',
    fechaTexto: '15 de septiembre de 2026',
    lectura: '6 min',
    seccion: 'Proyecto',
    imagen: '/v4/articulos/lumina.webp',
    imagenAlt: 'Una pareja festejando en el piso entre globos dorados, papel picado y un cartel que dice party',
    cuerpo: `
      <p>Un casamiento se organiza en una planilla, tres grupos de WhatsApp, un PDF con el plano de las mesas y una lista de invitados que nunca está al día. Lo sabemos porque lo vivimos: uno de los primeros proyectos del estudio fue una invitación digital para una pareja, y lo que vino después de la invitación —quién confirmó, quién viene con quién, quién necesita transporte, en qué mesa se sienta— no tenía dónde vivir.</p>
      <p>Lúmina nació para eso. Es una plataforma que junta las dos mitades de un evento en un solo lugar: la <strong>invitación digital</strong> que reciben los invitados y el <strong>panel de gestión</strong> desde el que la pareja —o quien organiza— lo administra todo.</p>

      <h2>Qué hace</h2>
      <p>Del lado del invitado, Lúmina es una invitación que se abre en el teléfono: la historia, el lugar, el cronograma, el dress code, la lista de regalos, y un botón para confirmar asistencia que pregunta exactamente lo que hace falta —si viene, con quién, si tiene alguna restricción alimentaria, si necesita traslado—. Cada invitado tiene su enlace y su nombre escrito en la tarjeta.</p>
      <p>Del lado de quien organiza, todo eso cae en un panel: la lista de invitados con su estado, las confirmaciones en tiempo real, el plano del salón con las mesas armadas arrastrando nombres, el transporte con sus paradas, las tareas, el cronograma del día, y un chat con los invitados para cuando alguien pregunta "¿a qué hora es la ceremonia?" a las once de la noche.</p>
      <p>Lúmina se vende para <strong>casamientos y fiestas de quince</strong>. Son los dos eventos que tienen esta complejidad, y preferimos hacer dos cosas bien que ocho más o menos.</p>

      <h2>Cómo está hecha</h2>
      <p>Es una aplicación web, no una app de tienda: se abre en cualquier teléfono sin instalar nada, que es la única forma de que doscientos invitados la usen. Cada evento tiene sus datos aislados: la pareja ve lo suyo y nadie más, y la invitación carga en segundos aunque el invitado la abra con mala señal en el medio del campo.</p>
      <p>La parte que más trabajo llevó es la que no se ve: las invitaciones no son una plantilla con los nombres cambiados. Hay un <em>kernel</em> de composición que arma cada invitación a partir de secciones —portada, historia, cuándo y dónde, dress code, confirmación— y cinco colecciones de diseño que dibujan esas mismas secciones de formas completamente distintas. Dos parejas con la misma colección no tienen la misma invitación: cambia la paleta, cambia lo que cargaron, cambia el orden.</p>
      <p>Se compra una vez por evento, sin suscripción, en tres planes según cuánto de todo esto hace falta.</p>

      <h2>Por qué la contamos acá</h2>
      <p>Porque es la prueba de lo que hacemos. Un estudio puede decir que diseña y desarrolla productos digitales; Lúmina es uno funcionando, con usuarios, con pagos, con soporte. Todo lo que ofrecemos a un cliente —pensar el producto, diseñar la interfaz, escribir el código, publicarlo y sostenerlo— lo hicimos primero con lo nuestro.</p>
      <p>Lúmina está en <a href="https://lumina.labbrickell.com.ar" target="_blank" rel="noopener">lumina.labbrickell.com.ar</a>, y se la puede seguir en <a href="https://instagram.com/lumina.labbrickell" target="_blank" rel="noopener">Instagram</a> y <a href="https://tiktok.com/@lumina.labbrickell" target="_blank" rel="noopener">TikTok</a>.</p>
    `,
  },
  {
    slug: 'cliente-y-estudio-como-trabajar-juntos',
    titulo: 'Lo que un proyecto necesita de su cliente (y lo que el cliente tiene derecho a pedir)',
    bajada: 'Un sitio no lo hace el estudio solo. Las cinco cosas que hacen que un proyecto salga bien, y las cinco que lo hunden.',
    fecha: '2026-09-22',
    fechaTexto: '22 de septiembre de 2026',
    lectura: '5 min',
    seccion: 'Opinión',
    imagen: '/v4/articulos/cliente-estudio.webp',
    imagenAlt: 'Un equipo trabajando alrededor de una mesa con muestras de color y notas',
    cuerpo: `
      <p>Los proyectos que salen bien no son los que tienen más presupuesto ni los que tienen el brief más largo. Son los que tienen a las dos partes haciendo su trabajo. Esto es lo que, después de unos cuantos, sabemos que hace la diferencia.</p>

      <h2>Lo que necesitamos del cliente</h2>
      <p><strong>Que sepa qué hace su negocio mejor que nadie.</strong> Parece obvio y no lo es. La pregunta "¿qué querés que diga la página?" casi nunca tiene respuesta rápida, y la respuesta es el proyecto entero. Nosotros ayudamos a encontrarla, pero la materia prima es del cliente.</p>
      <p><strong>Una sola persona que decide.</strong> Cuando el sitio lo aprueban tres personas, se aprueba tres veces y cada vez distinto. Puede haber opiniones, pero tiene que haber una voz.</p>
      <p><strong>Contenido a tiempo.</strong> Los textos, las fotos, los precios, el logo en buena calidad. Un sitio diseñado con textos de relleno se rediseña cuando llegan los textos reales, porque un titular de cuatro palabras y uno de doce no entran en la misma caja.</p>
      <p><strong>Respuestas en días, no en semanas.</strong> Un proyecto que se detiene dos semanas esperando un OK pierde el hilo; cuando retoma, hay que volver a entrar en él.</p>
      <p><strong>Confianza en lo que se contrató.</strong> Si se eligió un estudio por su criterio, conviene dejar que lo use. Cambiar un color porque "a mi cuñado le gusta más el azul" es la forma más rápida de pagar por un sitio que después nadie defiende.</p>

      <h2>Lo que el cliente tiene derecho a pedir</h2>
      <p><strong>Saber qué va a recibir y cuándo.</strong> Alcance escrito, plazo, qué incluye y qué no. Si el estudio no puede decirlo antes de empezar, no sabe lo que va a hacer.</p>
      <p><strong>Ver el trabajo mientras se hace.</strong> No una presentación al final: una versión que se pueda abrir en el teléfono a mitad del proyecto, con lo que hay hasta ahí.</p>
      <p><strong>Que le expliquen las decisiones.</strong> Por qué esa tipografía, por qué el botón va ahí, por qué el sitio no tiene carrusel. Un estudio que no puede explicar una decisión probablemente no la tomó: la copió.</p>
      <p><strong>Que el sitio sea suyo.</strong> Dominio a su nombre, acceso a todo, código entregado. Un sitio que sólo puede tocar el estudio que lo hizo no es un activo del cliente: es una suscripción encubierta.</p>
      <p><strong>Que funcione después de publicarlo.</strong> Que se encuentre en Google, que cargue rápido en un teléfono con mala señal, que no se rompa en tres meses. Publicar no es el final del trabajo.</p>

      <h2>La regla que resume todo</h2>
      <p>El cliente sabe de su negocio; el estudio sabe de diseño y de tecnología. Los proyectos se arruinan cuando cualquiera de los dos cree que sabe del otro tema más que el otro. Y salen bien cuando cada uno hace preguntas sobre lo que no sabe.</p>
    `,
  },
  {
    slug: 'como-elegir-un-estudio-de-diseno-y-desarrollo-web',
    titulo: 'Cómo elegir un estudio de diseño y desarrollo web en Buenos Aires',
    bajada: 'Qué mirar antes de contratar, cuánto tarda un sitio, qué tiene que incluir y por qué "que se encuentre en Google" ya no alcanza.',
    fecha: '2026-09-27',
    fechaTexto: '27 de septiembre de 2026',
    lectura: '7 min',
    seccion: 'Guía',
    imagen: '/v4/articulos/elegir-estudio.webp',
    imagenAlt: 'Un monitor con un proyecto de diseño web abierto en un escritorio',
    cuerpo: `
      <p>Buscar "diseño web Buenos Aires" devuelve miles de resultados y casi todos dicen lo mismo: soluciones integrales, diseño responsive, posicionamiento. Esta guía es para leer entre líneas. Está escrita por un estudio, así que tiene un interés; pero los criterios sirven igual para evaluarnos a nosotros o a cualquier otro.</p>

      <h2>1. Mirá los proyectos, no la lista de servicios</h2>
      <p>Cualquier estudio puede escribir "desarrollo web, UX/UI, branding". Lo que no se puede fingir es un sitio publicado que se pueda abrir. Pedí ver tres proyectos reales y abrilos en el teléfono: si se ven bien ahí, si cargan rápido, si se entiende qué vende el negocio en los primeros cinco segundos. Un estudio que sólo muestra capturas de escritorio está mostrando la mitad que mejor le queda.</p>

      <h2>2. Preguntá quién lo hace</h2>
      <p>Hay tres modelos: la agencia grande que subcontrata, el freelance que hace todo, y el estudio chico que diseña y desarrolla adentro. Ninguno es malo en sí, pero conviene saber cuál es. Cuando el diseño lo hace una persona y el código otra que nunca se hablaron, el sitio termina siendo una negociación entre dos archivos. Nosotros trabajamos con el segundo y el tercero: <strong>diseño y desarrollo en el mismo lugar</strong>, y por eso podemos decir en la primera reunión si algo se puede construir y cuánto va a costar.</p>

      <h2>3. Pedí el alcance por escrito</h2>
      <p>Un presupuesto serio dice qué incluye: cuántas páginas o secciones, si los textos los escribe el cliente o el estudio, si las fotos van incluidas, qué pasa con el dominio y el hosting, cuántas rondas de cambios hay, y qué queda del otro lado de la línea. "Sitio web institucional: $X" no es un presupuesto; es un número.</p>

      <h2>4. Plazos reales</h2>
      <p>Un sitio de una página bien hecho lleva entre dos y cuatro semanas. Un sitio institucional de varias secciones, de cuatro a ocho. Una plataforma con usuarios y datos, meses. Si alguien promete un sitio completo en una semana, va a entregar una plantilla con el logo cambiado. Y si el plazo depende del contenido del cliente —que casi siempre—, tiene que estar dicho.</p>

      <h2>5. Que se encuentre: SEO y GEO</h2>
      <p>Hasta hace poco, "posicionamiento" quería decir Google. Hoy una parte creciente de la gente pregunta directamente a un motor de respuesta —ChatGPT, Gemini, Claude, Perplexity— y el sitio tiene que estar preparado para que esos sistemas lo entiendan y lo citen. Eso se llama <strong>GEO</strong> (<em>generative engine optimization</em>) y se hace con contenido claro, datos estructurados, respuestas concretas a preguntas concretas y una arquitectura que una máquina pueda leer. Preguntá si el estudio lo hace. La mayoría todavía no.</p>

      <h2>6. Performance no es un extra</h2>
      <p>Un sitio que tarda cuatro segundos en abrir en un teléfono con 4G pierde a la mitad de las visitas antes de mostrar nada. Pedí que el sitio se mida —Lighthouse, PageSpeed— y que el estudio se comprometa con un número.</p>

      <h2>7. Qué pasa después</h2>
      <p>El día que se publica el sitio empieza otra etapa: cambiar un precio, sumar un proyecto, corregir un texto. Preguntá cómo se hace eso y cuánto cuesta. Un sitio que para cambiar una coma necesita al estudio no es un buen negocio para nadie.</p>

      <h2>Sobre nosotros</h2>
      <p>Brickell Lab es un estudio independiente de diseño y desarrollo web en Buenos Aires. Hacemos sitios, plataformas y productos digitales de la idea al código, en el mismo lugar. Construimos y sostenemos <a href="https://lumina.labbrickell.com.ar" target="_blank" rel="noopener">Lúmina</a>, una plataforma de gestión de eventos, que es la mejor forma que tenemos de demostrar cómo trabajamos. Si querés hablar de un proyecto, escribinos a <a href="mailto:info@labbrickell.com.ar">info@labbrickell.com.ar</a>.</p>
    `,
    faq: [
      { p: '¿Cuánto cuesta un sitio web en Buenos Aires?', r: 'Depende del alcance: un sitio de una página, uno institucional de varias secciones y una plataforma con usuarios son tres proyectos distintos. Lo que importa es que el presupuesto diga qué incluye. Brickell Lab cotiza después de una conversación de media hora, sin compromiso.' },
      { p: '¿Cuánto tarda hacer una página web?', r: 'Un sitio de una página bien hecho, entre dos y cuatro semanas. Un sitio institucional, de cuatro a ocho. Una plataforma o producto digital, varios meses. El plazo depende en gran parte de cuándo llega el contenido del cliente.' },
      { p: '¿Qué es GEO y en qué se diferencia del SEO?', r: 'SEO es preparar un sitio para que lo encuentren los buscadores tradicionales como Google. GEO (generative engine optimization) es prepararlo para que los motores de respuesta basados en inteligencia artificial —ChatGPT, Gemini, Claude, Perplexity— lo entiendan y lo citen. Brickell Lab construye los sitios para las dos cosas.' },
      { p: '¿Qué hace Brickell Lab?', r: 'Diseño y desarrollo web en un mismo estudio: sitios corporativos, landing pages, plataformas y productos digitales, identidad visual y presentaciones. Con sede en Buenos Aires y proyectos de distintos lugares. También desarrolla Lúmina, su plataforma de gestión de eventos, y ofrece Lexa, traducción de inglés con matrícula.' },
      { p: '¿El sitio queda a mi nombre?', r: 'Sí. Dominio, hosting y código quedan a nombre del cliente y con acceso completo. Un sitio que sólo puede tocar el estudio que lo hizo no es un activo del cliente.' },
    ],
  },
  {
    slug: 'creador-de-save-the-date-gratis',
    titulo: 'Hicimos un creador de save the date gratis, y lo regalamos',
    bajada: 'Nueve diseños, sin cuenta y sin costo. Qué es, cómo está hecho por dentro y por qué un estudio regala una herramienta que funciona.',
    fecha: '2026-10-12',
    fechaTexto: '12 de octubre de 2026',
    lectura: '5 min',
    seccion: 'Noticia',
    imagen: '/v4/articulos/save-the-date.webp',
    imagenAlt: 'Una pareja tomada de las manos en un campo de flores al atardecer',
    cuerpo: `
      <p>Desde hoy hay una herramienta nueva en <a href="https://lumina.labbrickell.com.ar/save-the-date" target="_blank" rel="noopener">lumina.labbrickell.com.ar/save-the-date</a>: se eligen un diseño, los nombres y la fecha, se sube una foto, y se descarga la imagen lista para mandar. Es gratis, no pide crear una cuenta y no pide un correo. Y no es una versión recortada de nada: es la herramienta entera.</p>

      <h2>Qué es</h2>
      <p>Un save the date es el aviso que se manda meses antes de la invitación: "guardate esta fecha". Casi siempre termina siendo una captura de pantalla o una placa armada a las apuradas en el teléfono, porque para una sola imagen nadie contrata a un diseñador ni se pone a aprender un editor.</p>
      <p>La herramienta tiene <strong>nueve diseños</strong>, de una participación clásica a un afiche de cine, y cada uno está compuesto como una pieza gráfica de verdad: su tipografía, su paleta, su forma de acomodar dos nombres o uno. Sirve para <strong>casamientos y fiestas de quince</strong>, y funciona igual con foto o sin ella. Lo que se descarga es una imagen de 1080×1920, la medida exacta de una historia de Instagram, que en WhatsApp se manda igual.</p>

      <h2>Cómo está hecha</h2>
      <p>Acá está la parte que nos interesa contar, porque es la que explica por qué podemos regalarla.</p>
      <p><strong>La imagen se arma en el teléfono de quien la hace, no en un servidor nuestro.</strong> Cada pieza se dibuja en un <em>canvas</em> del navegador: la foto que se sube nunca viaja a ninguna parte, y lo que se escribe queda guardado en el propio navegador para que siga ahí si se cierra la pestaña. No hay base de datos, no hay cuentas, no hay nada que resguardar. Eso no es sólo una decisión de privacidad: es lo que hace que la herramienta no tenga costo por uso y pueda quedarse gratis para siempre.</p>
      <p><strong>Lo que se ve es literalmente lo que se descarga.</strong> La vista previa no es una aproximación en HTML: es el mismo <em>canvas</em> que se exporta, escalado por CSS. Existe la tentación de dibujar el preview con la interfaz y exportar con otra cosa; cuando se hace eso, tarde o temprano la descarga sale distinta de lo que la persona vio, y en una herramienta cuyo único producto es la imagen, eso significa que no sirve.</p>
      <p><strong>Y se diseñó para el teléfono primero</strong>, que es donde se va a usar: la pieza arriba, los datos debajo, el selector de diseños al final, y el encuadre de la foto con dos dedos sobre la imagen.</p>

      <h2>Por qué la regalamos</h2>
      <p>Un estudio puede decir que diseña bien y que programa bien. Decirlo no cuesta nada y no lo distingue de nadie. Lo que sí distingue es que alguien pueda abrir una herramienta nuestra, usarla en un minuto, llevarse algo que de verdad va a mandar a sus amigos, y no haber pagado ni dejado un dato.</p>
      <p>Hay un cálculo comercial, y lo decimos: quien está armando un casamiento o unos quince y descubre que la pieza le quedó bien, probablemente quiera ver qué más hay. Lo que hay es <a href="https://lumina.labbrickell.com.ar" target="_blank" rel="noopener">Lúmina</a>, nuestra plataforma de invitaciones web y gestión de eventos. Pero el save the date no es un demo con la mitad apagada ni una prueba que vence: es una herramienta completa, y quien la use y no vuelva nunca más también está bien.</p>

      <h2>Lo que probamos con esto</h2>
      <p>Para un cliente que está evaluando un estudio, esta herramienta contesta tres preguntas mejor que cualquier portafolio:</p>
      <p><strong>Si sabemos diseñar.</strong> Nueve piezas gráficas compuestas una por una, que se sostienen con un nombre de tres letras y con uno de doce, con foto y sin foto. Eso no se resuelve con una plantilla.</p>
      <p><strong>Si sabemos construir.</strong> Dibujar sobre <em>canvas</em>, exportar a imagen, manejar el encuadre con gestos y que todo eso funcione en un teléfono de gama media es trabajo de producto, no de maquetado.</p>
      <p><strong>Si pensamos en quien lo usa.</strong> No pedir un correo cuando no hace falta es una decisión que cuesta plata y se toma igual. Las mismas decisiones las tomamos en los proyectos de clientes.</p>

      <h2>Sobre nosotros</h2>
      <p>Brickell Lab es un estudio independiente de diseño y desarrollo web en Buenos Aires. Hacemos sitios, plataformas y productos digitales de la idea al código, en el mismo lugar. Si querés hablar de un proyecto, escribinos a <a href="mailto:info@labbrickell.com.ar">info@labbrickell.com.ar</a>.</p>
      <p>Y si estás organizando tu casamiento o tus quince, <a href="https://lumina.labbrickell.com.ar/save-the-date" target="_blank" rel="noopener">hacete el save the date</a>. Es nuestro regalo.</p>
    `,
    faq: [
      { p: '¿Cómo hago un save the date gratis?', r: 'En lumina.labbrickell.com.ar/save-the-date: se elige uno de los nueve diseños, se escriben los nombres, la fecha y el lugar, se sube una foto si se quiere, y se descarga la imagen. Lleva alrededor de un minuto y no hace falta crear una cuenta ni dejar un correo.' },
      { p: '¿Hay que crear una cuenta o pagar algo?', r: 'No. La herramienta es gratuita y no pide registro, correo ni tarjeta. Tampoco es una prueba que vence: es la herramienta completa.' },
      { p: '¿Mi foto se sube a algún servidor?', r: 'No. La imagen se arma dentro del navegador de quien la hace, con la tecnología canvas: la foto nunca sale del aparato. Lo que se escribe queda guardado en el propio navegador para poder seguir después.' },
      { p: '¿En qué formato y medida se descarga?', r: 'Una imagen PNG de 1080×1920 píxeles, la medida de una historia de Instagram. Se puede mandar por WhatsApp sin convertir nada.' },
      { p: '¿Sirve para una fiesta de quince?', r: 'Sí. La herramienta está hecha para casamientos y fiestas de quince, y los diseños se adaptan a uno o dos nombres según el caso.' },
      { p: '¿Quién hizo esta herramienta?', r: 'Brickell Lab, un estudio de diseño y desarrollo web de Buenos Aires. Es parte de Lúmina, su plataforma de invitaciones web y gestión de eventos, y se ofrece gratis como muestra de cómo trabaja el estudio.' },
    ],
  },
]
