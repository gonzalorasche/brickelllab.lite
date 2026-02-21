document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('plan-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const closeBtn = modal.querySelector('.modal__close');
    const overlay = modal.querySelector('.modal__overlay');
    const ctaBtn = modal.querySelector('.modal__cta');

    const closeModal = () => modal.classList.remove('modal--active');

    // Abrir modal
    document.querySelectorAll('.plan-card__btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // IMPORTANTE: Leemos los atributos en el momento del click
            // Estos ya habrán sido cambiados por el script de traducción
            const title = btn.getAttribute('data-title');
            const info = btn.getAttribute('data-info');

            modalTitle.textContent = title;
            modalText.innerHTML = info; // Usamos innerHTML por si pusiste <br> en las traducciones
            modal.classList.add('modal--active');
        });
    });

    ctaBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});