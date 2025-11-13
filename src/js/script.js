
/* ------------ SCROLL para a próxima seção banner-------------------
   ----------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function() {
    const scrollArrow = document.getElementById("scrollArrow");

    if (scrollArrow) {
        scrollArrow.addEventListener("click", function () {
            const sobreSection = document.querySelector(".sobre");
            if (sobreSection) {
                sobreSection.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    }
});


/* -------------Logica de Navegação do Portfólio-----------------------
   ----------------------------------------------------------------- */

const portfolioImages = [
    "/src/assets/Portfólio/ambiente 1.jpg",
    "/src/assets/Portfólio/ambiente 2.png",
    "/src/assets/Portfólio/ambiente 3.png",
    "/src/assets/Portfólio/ambiente 4.png",
    "/src/assets/Portfólio/ambiente 5.png",
    "/src/assets/Portfólio/ambiente 7.png"
];

let currentImageIndex = 0;
const lightbox = document.getElementById('lightbox-carousel');
const mainImage = document.getElementById('lightbox-main-img');

if (lightbox && mainImage) {

    function updateLightboxImage() {
        mainImage.src = portfolioImages[currentImageIndex];
    }

    window.openLightbox = function(index) {
        currentImageIndex = index;
        
        updateLightboxImage();
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    window.closeLightbox = function(event) {
        
        if (event && event.target.id !== 'lightbox-carousel' && event.target.id !== 'lightbox-close-btn') {
            return;
        }

        if (lightbox.classList.contains('hidden')) return;
        
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    window.navigateLightbox = function(direction, event) {
        if (event) event.stopPropagation();

        currentImageIndex += direction;

        if (currentImageIndex < 0) {
            currentImageIndex = portfolioImages.length - 1;
        } else if (currentImageIndex >= portfolioImages.length) {
            currentImageIndex = 0;
        }
        
        updateLightboxImage();
    }

    // ------------Navegação via teclado----------------
    //------------------------------------------------// 

    document.addEventListener('keydown', function(e) {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    });

} else {
}


// -----------Responsividade mobile------------
//----------------------------------------------// 

const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const closeMenu = document.getElementById("closeMenu");

menuToggle.addEventListener("click", () => {
    mobileNav.classList.add("open");
});

closeMenu.addEventListener("click", () => {
    mobileNav.classList.remove("open");
});

document.querySelectorAll(".mobile-nav a").forEach(link => {
    link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
    });
});

/* ------------- Lógica de Envio do Formulário -------------------
   ----------------------------------------------------------------- */
const form = document.getElementById('form-orcamento'); 
const submitButton = form ? form.querySelector('.btn-mottik-enviar') : null; 

if (form && submitButton) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const data = {
            nome: document.getElementById('nome').value,         
            email: document.getElementById('email').value,       
            telefone: document.getElementById('telefone').value, 
            servico: document.getElementById('servico').value,   
            mensagem: document.getElementById('mensagem').value  
        };
        
        submitButton.disabled = true; 
        submitButton.textContent = 'Enviando...';
        submitButton.classList.add('loading'); 

        try {
            const response = await fetch('/api/sendform', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {

                Swal.fire({
                    icon: 'success',
                    title: 'Enviado!',
                    text: 'Orçamento enviado com sucesso! Obrigado pelo contato.'
                });

                const modalElement = document.getElementById('modalOrcamento');
                if (window.bootstrap && modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();
                }

                form.reset(); 

            } else {
                const errorData = await response.json();

                Swal.fire({
                    icon: 'error',
                    title: 'Falha no envio',
                    text: errorData.error || 'Erro desconhecido.'
                });
            }

        } catch (error) {
            console.error('Erro de conexão ou requisição:', error);

            Swal.fire({
                icon: 'error',
                title: 'Erro de Rede',
                text: 'Erro de rede. Verifique o terminal para o erro exato.'
            });

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Pedido';
            submitButton.classList.remove('loading');
        }
    });
}
