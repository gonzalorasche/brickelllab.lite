document.addEventListener('DOMContentLoaded', function () {
    const swiperTestimonios = new Swiper('.testimonial-carousel', {
        loop: true,
        centeredSlides: true,
        speed: 800,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        
        // CONFIGURACIÓN PARA MOBILE
        slidesPerView: 1.1, 
        spaceBetween: 20,   // Espacio positivo para que NO se encimen
        
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        breakpoints: {
            // Escritorio (Efecto Lab 60%)
            1024: {
                slidesPerView: 3,
                spaceBetween: -100, // Negativo solo aquí para el efecto 60%
                centeredSlides: true,
            },
            // Tablet
            768: {
                slidesPerView: 2,
                spaceBetween: 10,
                centeredSlides: false,
            }
        }
    });
});


document.querySelector('.btn-primary').addEventListener('click', function() {
    document.getElementById('contacto').scrollIntoView({ 
        behavior: 'smooth' 
    });
});