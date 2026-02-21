/**
 * BRICKELL LAB - Script Principal
 * Gestión de Idiomas (i18n), SEO Dinámico y Modales
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURACIÓN DE IDIOMAS ---

    const langBtn = document.getElementById('lang-switch');
    const langTexts = document.querySelectorAll('.lang-text');
    
    const browserLang = navigator.language.split('-')[0]; 
    let currentLang = localStorage.getItem('language') || (translations[browserLang] ? browserLang : 'es');

    /**
     * Aplica los textos, placeholders, alts, metas y datos de modales
     */
    const applyTranslations = (lang) => {
        const t = translations[lang];
        if (!t) return;

        // A. Contenido estándar (innerHTML)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.innerHTML = t[key];
        });

        // B. PLACEHOLDERS
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const key = el.getAttribute('data-i18n-ph');
            if (t[key]) el.placeholder = t[key];
        });

        // C. TEXTOS ALTERNATIVOS (alt)
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (t[key]) el.alt = t[key];
        });

        // D. SEO Y REDES SOCIALES
        if (t["seo-title"]) document.title = t["seo-title"];
        
        const metaDesc = document.getElementById('meta-desc');
        if (metaDesc && t["seo-desc"]) metaDesc.setAttribute('content', t["seo-desc"]);

        const ogTitle = document.getElementById('og-title');
        const ogDesc = document.getElementById('og-desc');
        const ogAlt = document.getElementById('og-img-alt');
        const ogLocale = document.getElementById('og-locale');

        if (ogTitle && t["og-title"]) ogTitle.setAttribute('content', t["og-title"]);
        if (ogDesc && t["og-desc"]) ogDesc.setAttribute('content', t["og-desc"]);
        if (ogAlt && t["og-img-alt"]) ogAlt.setAttribute('content', t["og-img-alt"]);
        if (ogLocale) ogLocale.setAttribute('content', lang === 'es' ? 'es_AR' : 'en_US');

        // E. ENLACES DINÁMICOS (WhatsApp)
        document.querySelectorAll('[data-i18n-link]').forEach(el => {
            const key = el.getAttribute('data-i18n-link');
            if (t[key]) el.href = t[key];
        });

        // G. TRADUCIR ATRIBUTOS DEL MODAL (Lo que lee el modal al abrirse)
        document.querySelectorAll('[data-i18n-title]').forEach(btn => {
            const titleKey = btn.getAttribute('data-i18n-title');
            const infoKey = btn.getAttribute('data-i18n-info');
            if (t[titleKey]) btn.setAttribute('data-title', t[titleKey]);
            if (t[infoKey]) btn.setAttribute('data-info', t[infoKey]);
        });

        // H. TRADUCIR ELEMENTOS FIJOS DEL MODAL (Botón y Label)
        const modalLabel = document.querySelector('.modal__label');
        const modalCta = document.querySelector('.modal__cta');
        if (modalLabel && t["modal-label"]) modalLabel.innerHTML = t["modal-label"];
        if (modalCta && t["modal-cta"]) modalCta.innerHTML = t["modal-cta"];

        // F. Estética del switch
        langTexts.forEach(text => {
            text.classList.toggle('active', text.dataset.lang === lang);
        });

        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
    };

    // --- 2. GESTIÓN DEL MODAL ---
    const modal = document.getElementById('plan-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');

    if (modal) {
        const closeBtn = modal.querySelector('.modal__close');
        const overlay = modal.querySelector('.modal__overlay');
        const ctaBtn = modal.querySelector('.modal__cta');

        const closeModal = () => modal.classList.remove('modal--active');

        // Abrir modal capturando los datos traducidos en el momento
        document.querySelectorAll('.plan-card__btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modalTitle.innerHTML = btn.getAttribute('data-title');
                modalText.innerHTML = btn.getAttribute('data-info');
                modal.classList.add('modal--active');
            });
        });

        if (ctaBtn) ctaBtn.addEventListener('click', closeModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
    }

    // --- 3. INICIALIZACIÓN ---
    applyTranslations(currentLang);

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'es' ? 'en' : 'es';
            applyTranslations(currentLang);
        });
    }
});

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

