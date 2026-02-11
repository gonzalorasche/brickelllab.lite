const observerOptions = {
    root: null,
    // Empezamos el efecto cuando el 30% del elemento entra en pantalla
    threshold: 0.3 
};

const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (window.innerWidth <= 1024) {
            if (entry.isIntersecting) {
                // El navegador añade la clase y el CSS se encarga de la lentitud
                entry.target.classList.add('is-visible');
            } else {
                // Opcional: quitarlo al salir para que se repita la magia
                entry.target.classList.remove('is-visible');
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
    projectObserver.observe(card);
});