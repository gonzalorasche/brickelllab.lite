/**
 * BRICKELL LAB - Script Principal
 * Gestión de Idiomas (i18n), SEO Dinámico y Animaciones
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURACIÓN DE IDIOMAS ---

    const langBtn = document.getElementById('lang-switch');
    const langTexts = document.querySelectorAll('.lang-text');
    
    const browserLang = navigator.language.split('-')[0]; 
    let currentLang = localStorage.getItem('language') || (translations[browserLang] ? browserLang : 'es');

    /**
     * Aplica los textos, placeholders, alts, metas y enlaces según el idioma seleccionado
     */
    const applyTranslations = (lang) => {
        const t = translations[lang];

        // A. Traducir contenido estándar (innerHTML)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t && t[key]) {
                el.innerHTML = t[key];
            }
        });

        // B. Traducir PLACEHOLDERS de formularios
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (t && t[key]) {
                el.placeholder = t[key];
            }
        });

        // C. Traducir TEXTOS ALTERNATIVOS (alt) de imágenes
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (t && t[key]) {
                el.alt = t[key];
            }
        });

        // D. ACTUALIZAR SEO Y REDES SOCIALES (Meta Tags)
        if (t["seo-title"]) {
            document.title = t["seo-title"];
        }
        
        const metaDesc = document.getElementById('meta-desc');
        if (metaDesc && t["seo-desc"]) {
            metaDesc.setAttribute('content', t["seo-desc"]);
        }

        const ogTitle = document.getElementById('og-title');
        const ogDesc = document.getElementById('og-desc');
        const ogAlt = document.getElementById('og-img-alt');
        const ogLocale = document.getElementById('og-locale');

        if (ogTitle && t["og-title"]) ogTitle.setAttribute('content', t["og-title"]);
        if (ogDesc && t["og-desc"]) ogDesc.setAttribute('content', t["og-desc"]);
        if (ogAlt && t["og-img-alt"]) ogAlt.setAttribute('content', t["og-img-alt"]);
        
        // Actualizamos el locale para coherencia en redes sociales
        if (ogLocale) {
            ogLocale.setAttribute('content', lang === 'es' ? 'es_AR' : 'en_US');
        }

        // E. Traducir ENLACES DINÁMICOS (WhatsApp)
        document.querySelectorAll('[data-i18n-link]').forEach(el => {
            const key = el.getAttribute('data-i18n-link');
            if (t && t[key]) {
                el.href = t[key];
            }
        });

        // F. Atributos de idioma y estética del switch
        langTexts.forEach(text => {
            text.classList.toggle('active', text.dataset.lang === lang);
        });

        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
    };

    applyTranslations(currentLang);

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'es' ? 'en' : 'es';
            applyTranslations(currentLang);
        });
    }

    // --- 2. ANIMACIONES DE PROYECTOS (Intersection Observer) ---

    const observerOptions = {
        root: null,
        threshold: 0.3 
    };

    const projectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (window.innerWidth <= 1024) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    entry.target.classList.remove('is-visible');
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card').forEach(card => {
        projectObserver.observe(card);
    });

});