/** @type {Record<string, Record<string, {t:string, x:string}>>} */
export const COPY = {
  solemne: {
    cerrado:  { t:'el domingo<br><b>permanecemos cerrados</b>',
                x:'hay días en que el país se detiene. este es uno de ellos.' },
    reducido: { t:'el domingo atendemos<br>hasta las <em>{h}</em>',
                x:'hasta esa hora estamos. después, el país nos necesita en otro lado.' },
    abierto:  { t:'el domingo <b>abrimos</b><br>con normalidad',
                x:'el deber también se honra un domingo.' }
  },
  gracioso: {
    cerrado:  { t:'el domingo <b>cerramos</b> por<br><em>riesgo de infarto</em>',
                x:'es una medida preventiva' },
    reducido: { t:'atendemos hasta las <b>{h}</b>.<br><em>después entramos en riesgo</em>',
                x:'a las 16 el cuerpo ya no nos pertenece' },
    abierto:  { t:'<b>abrimos igual</b>.<br><em>contamos con desfibrilador</em>',
                x:'alguien tiene que sostener el país. traé paciencia.' }
  },
  neutral: {
    cerrado:  { t:'<b>cerramos</b><br>el domingo',                    x:'' },
    reducido: { t:'atendemos hasta<br>las <b>{h}</b>',                x:'' },
    abierto:  { t:'<b>abrimos</b> el domingo<br>con horario normal',  x:'' }
  }
};

/** @type {Record<string, {a:string, v:string}>} */
export const EPICO = {
  solemne:  { a:'hoy un país entero mira hacia el mismo lugar', v:'juntos' },
  gracioso: { a:'ahora en serio',                               v:'vamos' },
  neutral:  { a:'',                                             v:'vamos' }
};

export const SB_URL  = 'https://zjkkwmkdtgvqaacyxjji.supabase.co';
export const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqa2t3bWtkdGd2cWFhY3l4amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDQzNDEsImV4cCI6MjA5OTcyMDM0MX0.l8A2rGAu0xFBzDTzVsW6HzyJAZuo6JWCpc_CuIl5dV8';

export function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** normaliza un @usuario o url de instagram → usuario pelado */
export function igUser(v){
  return String(v || '').trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '').replace(/\/.*$/, '').replace(/[^A-Za-z0-9._]/g, '');
}

var I_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
var I_IG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';

var CONF = (function(){
  var col = ['#75AADB','#75AADB','#9CC4E4','#E1E1E6','#C9C9D1'];
  var s = '';
  for(var i = 0; i < 26; i++){
    var l = (i * 3.9 + (i % 5) * 2.3) % 100;
    var dur = 7 + (i % 6) * 1.6;
    var del = -(i % 9) * 1.4;
    var w = 5 + (i % 3) * 2;
    s += '<i style="left:'+l.toFixed(1)+'%;width:'+w+'px;'
       + 'background:'+col[i % col.length]+';'
       + 'animation-duration:'+dur.toFixed(1)+'s;'
       + 'animation-delay:'+del.toFixed(1)+'s"></i>';
  }
  return '<div class="lf-conf" aria-hidden="true">'+s+'</div>';
})();

/**
 * Render único de la página. Lo usan ver.astro y el preview de index.astro.
 * @param {any} d fila de la tabla
 * @param {{inerte?:boolean}} [o] inerte = los links no navegan (preview)
 */
export function render(d, o){
  o = o || {};
  var c = (COPY[d.tono] || COPY.neutral)[d.estado] || COPY.neutral.cerrado;
  var e = EPICO[d.tono] || EPICO.neutral;
  var n = esc(String(d.nombre || '').toLowerCase()) || 'nuestro comercio';
  var h = esc(d.hasta);

  var tit = c.t.replace(/\{n\}/g, n).replace(/\{h\}/g, h);

  var wa = String(d.whatsapp || '').replace(/\D/g,'');
  var ig = igUser(d.instagram);

  function ico(href, svg, label){
    return o.inerte
      ? '<span class="lf-p-ico">'+svg+'</span>'
      : '<a class="lf-p-ico" href="'+href+'" target="_blank" rel="noopener" aria-label="'+label+'">'+svg+'</a>';
  }
  var ctas = '';
  if(wa) ctas += ico('https://wa.me/'+wa, I_WA, 'WhatsApp');
  if(ig) ctas += ico('https://instagram.com/'+ig, I_IG, 'Instagram');
  if(ctas) ctas = '<div class="lf-p-ctas">'+ctas+'</div>';

  var logo = '<img src="/logobrickell.png" alt="Brickell Lab" />';
  var firma = o.inerte
    ? '<span class="lf-p-marca">'+logo+'</span>'
    : '<a class="lf-p-marca" href="/lafinal/">'+logo+'</a>';

  return '<header class="lf-p-head">'
       + '<p class="lf-p-ov">la final</p>'
       + '<p class="lf-p-dom">domingo 19</p>'
       + '</header>'
       + '<main class="lf-p-main">' + CONF
       + '<p class="lf-p-nom">'+n+'</p>'
       + '<h1 class="lf-p-tit">'+tit+'</h1>'
       + (c.x ? '<p class="lf-p-chiste">'+c.x+'</p>' : '')
       + ctas + '</main>'
       + '<section class="lf-p-epico">'
       + (e.a ? '<p class="lf-p-ahora">'+e.a+'</p>' : '')
       + '<p class="lf-p-vamos"><span>¡</span>'+e.v+'<span>!</span></p></section>'
       + '<footer class="lf-p-firma">hecho en 30 segundos con '+firma
       + (o.inerte ? '' : '<span class="lf-p-sep">|</span><a class="lf-p-hace" href="/lafinal/">hacé la tuya gratis</a>')
       + '</footer>';
}