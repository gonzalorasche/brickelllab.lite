// ============================================================
// EL MOTOR DE PARALLAX · home nueva
// ============================================================
//
// Portado del que mueve la landing de Lúmina. Allá vive como hook de React;
// acá es un módulo suelto que la página arranca con un `<script>`, porque en
// Astro no hay ciclo de vida de componente del que colgarse. La lógica es la
// misma línea por línea: lo único que cambió es cómo se enciende.
//
// Un solo `requestAnimationFrame` para TODA la página. Cada elemento que lleva
// `data-px` queda registrado y en cada cuadro recibe dos custom properties:
//
//   --p   0 → 1, cuánto avanzó el elemento por la pantalla
//   --pc  −1 → 1, lo mismo centrado (0 justo en el medio del viewport)
//
// y con eso el CSS decide qué mover. El JavaScript no toca ni un `transform`:
// escribe dos números y se va. Es lo que hace que se pueda cambiar todo el
// gesto de una sección editando una regla, sin volver acá.
//
// ────────────────────────────────────────────────────────────
// POR QUÉ NO `animation-timeline: view()`
// ────────────────────────────────────────────────────────────
//
// Porque es exactamente esto, en CSS, sin JavaScript, y sería mejor. Pero el
// soporte en Safari de iOS todavía no está parejo, y una parte grande de las
// visitas entra desde un teléfono: se quedarían sin el efecto que es la razón
// de ser del rediseño. Cuando iOS lo tenga, esto se reemplaza por CSS y los
// nombres de las variables no cambian — las reglas de las secciones siguen
// sirviendo tal cual.
//
// ────────────────────────────────────────────────────────────
// LAS TRES REGLAS QUE LO MANTIENEN A 60 CUADROS
// ────────────────────────────────────────────────────────────
//
//   1. UN SOLO rAF, y sólo mientras haya algo visible. Los elementos fuera de
//      pantalla no se calculan: un IntersectionObserver los da de baja del lazo
//      y los vuelve a dar de alta al asomar.
//   2. NADA DE `getBoundingClientRect()` POR CUADRO. Medir fuerza al navegador
//      a recalcular el layout, y hacerlo por elemento y por cuadro es la forma
//      clásica de convertir un parallax en un jank. Se mide UNA vez al
//      registrar, y de nuevo sólo si cambia el tamaño de la ventana.
//   3. LO QUE EL CSS ANIME TIENE QUE SER `transform` U `opacity`. Cualquier
//      otra cosa vuelve a pasar por layout o por pintura y se nota en un
//      teléfono. Es una regla para la hoja de estilos, no para este archivo,
//      pero se cumple o no sirve de nada lo de acá arriba.
//
// ────────────────────────────────────────────────────────────
// SE APAGA ENTERO CON `prefers-reduced-motion`
// ────────────────────────────────────────────────────────────
//
// Y apagarlo NO puede dejar la página rota: si el motor no arranca, nadie
// escribe `--p`, así que el valor que vale es el que cada regla declara por
// defecto en su `:root`. Esos valores por defecto son SIEMPRE el estado final
// —todo en su lugar, opacidad 1—, nunca el inicial. Una página sin JavaScript,
// o con el movimiento apagado, se ve entera y quieta.
// ============================================================

/** Lo que se guarda de cada pieza registrada. Se mide una vez. */
interface Pieza {
  el: HTMLElement;
  /** Distancia desde el tope del documento hasta el tope del elemento. */
  top: number;
  alto: number;
  /**
   * El TRAMO en el que la pieza se anima. Sale de `data-px` y decide cuándo
   * empieza y termina el gesto:
   *
   *   'entra'  de que asoma por abajo hasta que se acomodó (default)
   *   'cruza'  todo el paso del elemento por la pantalla, de borde a borde
   *   'fija'   mientras la sección ocupa la pantalla
   *   'sale'   de su propio tope hasta que terminó de irse — es el del HERO,
   *            que ya está en pantalla cuando la página carga y por eso tiene
   *            que arrancar en 0 con el scroll en 0. Con 'cruza' arrancaría por
   *            la mitad, porque medio recorrido ya pasó antes de que nadie
   *            tocara nada.
   */
  modo: 'entra' | 'cruza' | 'fija' | 'sale';
}

/** Redondeo a tres decimales: más precisión no la ve nadie y ensucia el estilo. */
function r3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function medir(el: HTMLElement, scrollY: number): { top: number; alto: number } {
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, alto: r.height };
}

/** Monta el motor sobre `raiz` y devuelve la función que lo desmonta. */
export function montarParallax(raiz: HTMLElement): () => void {
  const piezas = new Map<HTMLElement, Pieza>();
  /** Las que están en pantalla ahora. Es sobre estas que corre el lazo. */
  const activas = new Set<HTMLElement>();
  let cuadro = 0;
  let corriendo = false;

  const alta = (el: HTMLElement) => {
    const { top, alto } = medir(el, window.scrollY);
    const modo = (el.dataset.px || 'entra') as Pieza['modo'];
    piezas.set(el, { el, top, alto, modo });
  };

  /**
   * Escribe `--p` y `--pc` en todas las piezas activas, UNA vez.
   *
   * Está separada del lazo a propósito: así el observador puede calcular al
   * instante cuando una sección entra, sin depender de que llegue un cuadro.
   */
  const calcular = () => {
    const vh = window.innerHeight;
    const y = window.scrollY;

    for (const el of activas) {
      const p = piezas.get(el);
      if (!p) continue;

      /* De dónde a dónde va el gesto, en píxeles de scroll. Los cuatro modos
         son el mismo cálculo con distinto principio y fin. */
      let desde: number;
      let hasta: number;
      if (p.modo === 'cruza') {
        // Desde que el borde de arriba asoma por abajo hasta que el de abajo
        // sale por arriba. Es el recorrido completo, para fondos y capas.
        desde = p.top - vh;
        hasta = p.top + p.alto;
      } else if (p.modo === 'sale') {
        // Del tope del elemento hasta que se fue entero. Para el hero: 0 con la
        // página sin scrollear, 1 cuando pasó de largo.
        desde = p.top;
        hasta = p.top + p.alto;
      } else if (p.modo === 'fija') {
        // Mientras la sección ocupa la pantalla: para los bloques que se quedan
        // quietos y cambian por dentro.
        desde = p.top;
        hasta = p.top + p.alto - vh;
      } else {
        // 'entra': el gesto ocurre en el último tercio de la subida, que es
        // donde se mira.
        desde = p.top - vh;
        hasta = p.top - vh * 0.35;
      }

      const tramo = hasta - desde;
      const bruto = tramo > 0 ? (y - desde) / tramo : 0;
      const v = bruto < 0 ? 0 : bruto > 1 ? 1 : bruto;

      el.style.setProperty('--p', String(r3(v)));
      el.style.setProperty('--pc', String(r3(v * 2 - 1)));
    }
  };

  const pintar = () => {
    cuadro = 0;
    calcular();
    if (corriendo && activas.size > 0) cuadro = requestAnimationFrame(pintar);
    else corriendo = false;
  };

  const arrancar = () => {
    if (corriendo || activas.size === 0) return;
    corriendo = true;
    cuadro = requestAnimationFrame(pintar);
  };

  /* EL OBSERVADOR DA DE ALTA Y DE BAJA EN EL LAZO. El margen es generoso a
     propósito: una pieza tiene que estar calculada ANTES de asomar, o entra a
     la pantalla con el valor viejo y pega un salto en el primer cuadro. */
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        const el = e.target as HTMLElement;

        /* LA MEDIDA SE REFRESCA ACÁ, GRATIS. `e.boundingClientRect` ya viene
           calculado adentro del aviso: leerlo no fuerza un layout, a diferencia
           de llamar a `getBoundingClientRect()` nosotros. Y hace falta, porque
           el alta se toma antes de que carguen las fotos. */
        const pieza = piezas.get(el);
        if (pieza) {
          pieza.top = e.boundingClientRect.top + window.scrollY;
          pieza.alto = e.boundingClientRect.height;
        }

        if (e.isIntersecting) activas.add(el);
        else {
          activas.delete(el);
          /* Al salir se deja el valor del extremo por el que salió, no el
             último calculado: si se va por arriba queda en 1 y si se va por
             abajo en 0. Sin esto, una pieza que se saltea de un scrollazo queda
             congelada a mitad de camino. */
          if (pieza) {
            const fin = e.boundingClientRect.top < 0 ? 1 : 0;
            el.style.setProperty('--p', String(fin));
            el.style.setProperty('--pc', String(fin * 2 - 1));
          }
        }
      }
      /* ⚠️ SE CALCULA ACÁ MISMO, ADEMÁS DE ARRANCAR EL LAZO. Y no es redundante:
         `arrancar()` sólo agenda un `requestAnimationFrame`, y si por lo que sea
         ese cuadro no llega, los valores que quedan escritos son los que puso el
         `else` de acá arriba —ceros— y las secciones se quedan INVISIBLES, porque
         el CSS las revela justamente con `--p`.

         Pasa de verdad: en una pestaña de fondo el navegador no entrega cuadros,
         y hay entornos automatizados donde directamente no los hay. Calculando de
         una, cada sección que entra ya tiene su valor correcto aunque el lazo
         nunca llegue a correr; el lazo sólo suaviza lo que ya está bien. */
      calcular();
      arrancar();
    },
    { rootMargin: '25% 0px 25% 0px', threshold: 0 }
  );

  /* TODAS ARRANCAN ACTIVAS, y el observador las va podando. Al revés —esperar
     a que el observador diga quién está en pantalla— el parallax queda muerto
     hasta su primer aviso, y ese aviso no llega en el cuadro siguiente: el
     navegador los entrega cuando el hilo principal se desocupa. Lo que se ve
     mientras tanto es una página que no reacciona al scroll. */
  for (const el of raiz.querySelectorAll<HTMLElement>('[data-px]')) {
    alta(el);
    activas.add(el);
    obs.observe(el);
  }

  /* AL CAMBIAR EL TAMAÑO SE VUELVE A MEDIR TODO. En un teléfono, la barra de
     Safari que aparece y desaparece dispara `resize`, y si no se re-mide, todas
     las posiciones quedan corridas por lo que mide esa barra. */
  let remedir = 0;
  const alRedimensionar = () => {
    clearTimeout(remedir);
    remedir = window.setTimeout(() => {
      const y = window.scrollY;
      for (const p of piezas.values()) {
        const m = medir(p.el, y);
        p.top = m.top;
        p.alto = m.alto;
      }
      arrancar();
    }, 120);
  };

  window.addEventListener('resize', alRedimensionar);
  window.addEventListener('orientationchange', alRedimensionar);
  /* Y cuando terminan de cargar las fotos: una imagen que llega tarde empuja
     todo lo que tiene debajo, y las posiciones medidas antes quedan corridas. */
  window.addEventListener('load', alRedimensionar);
  /* El scroll no calcula NADA: sólo despierta el lazo, que se apaga solo cuando
     no queda nada visible. Pasivo para no bloquear el gesto. */
  window.addEventListener('scroll', arrancar, { passive: true });
  arrancar();

  return () => {
    obs.disconnect();
    corriendo = false;
    cancelAnimationFrame(cuadro);
    clearTimeout(remedir);
    window.removeEventListener('resize', alRedimensionar);
    window.removeEventListener('orientationchange', alRedimensionar);
    window.removeEventListener('load', alRedimensionar);
    window.removeEventListener('scroll', arrancar);
  };
}

/**
 * Lo enciende, si corresponde.
 *
 * `data-px-listo` en el `<html>` es la llave del CSS: sin ese atributo, ninguna
 * regla de parallax se aplica. Es lo que garantiza que la página se vea entera
 * cuando el motor no arranca —sin JavaScript, o con el movimiento reducido—
 * en vez de quedarse con todo en su estado inicial, invisible.
 */
export function encenderParallax(): void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.setAttribute('data-px-listo', '');
  montarParallax(document.body);
}
