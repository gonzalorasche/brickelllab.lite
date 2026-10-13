// ⚠️ LA ANALÍTICA SE PRENDE DESDE ACÁ, Y NO DESDE OTRO LADO.
//
// Con `GA_ID` vacío, la web no carga NADA de Google Analytics, no escribe
// ninguna cookie y no muestra el cartel de cookies: no hay nada que consentir.
// Al poner el identificador, se prenden las tres cosas a la vez —el cartel, el
// consentimiento y la carga de gtag— y la política de privacidad cambia sola
// el apartado de cookies (ver `pages/v4/privacidad.astro`).
//
// El identificador del sitio viejo es G-3F68P5RYX2. Si se quiere una propiedad
// nueva para esta web, se pega acá la que corresponda.
export const GA_ID = 'G-3F68P5RYX2'

// Nada se carga hasta que el visitante acepta. La respuesta queda guardada en
// el navegador con esta clave ('si' o 'no') y se puede cambiar desde el enlace
// "Cookies" del pie.
export const CLAVE_COOKIES = 'bl_cookies'
