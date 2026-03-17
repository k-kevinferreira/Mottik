/* ------------ SCROLL para a próxima seção banner -------------------
   ----------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
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

/* ------------- Logica de Navegação do Portfólio --------------------
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
const lightbox = document.getElementById("lightbox-carousel");
const mainImage = document.getElementById("lightbox-main-img");

if (lightbox && mainImage) {
    function updateLightboxImage() {
        mainImage.src = portfolioImages[currentImageIndex];
    }

    window.openLightbox = function (index) {
        currentImageIndex = index;

        updateLightboxImage();
        lightbox.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    };

    window.closeLightbox = function (event) {
        if (event && event.target.id !== "lightbox-carousel" && event.target.id !== "lightbox-close-btn") {
            return;
        }

        if (lightbox.classList.contains("hidden")) return;

        lightbox.classList.add("hidden");
        document.body.style.overflow = "";
    };

    window.navigateLightbox = function (direction, event) {
        if (event) event.stopPropagation();

        currentImageIndex += direction;

        if (currentImageIndex < 0) {
            currentImageIndex = portfolioImages.length - 1;
        } else if (currentImageIndex >= portfolioImages.length) {
            currentImageIndex = 0;
        }

        updateLightboxImage();
    };

    document.addEventListener("keydown", function (e) {
        if (lightbox.classList.contains("hidden")) return;

        if (e.key === "Escape") {
            closeLightbox();
        } else if (e.key === "ArrowLeft") {
            navigateLightbox(-1);
        } else if (e.key === "ArrowRight") {
            navigateLightbox(1);
        }
    });
}

/* ----------- Responsividade mobile -------------------------------- */
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const closeMenu = document.getElementById("closeMenu");

if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
        mobileNav.classList.add("open");
    });
}

if (closeMenu && mobileNav) {
    closeMenu.addEventListener("click", () => {
        mobileNav.classList.remove("open");
    });
}

document.querySelectorAll(".mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
        if (mobileNav) {
            mobileNav.classList.remove("open");
        }
    });
});

/* ------------- Lógica de Envio do Formulário ----------------------
   ----------------------------------------------------------------- */
const form = document.getElementById("form-orcamento");
const submitButton = form ? form.querySelector(".btn-mottik-enviar") : null;

function showFormAlert({ icon, title, text }) {
    Swal.fire({
        icon,
        title,
        text,
        confirmButtonText: "Fechar",
        background: "#f7f3ee",
        color: "#2A3338",
        customClass: {
            popup: "mottik-alert",
            confirmButton: "mottik-alert-confirm"
        },
        buttonsStyling: false
    });
}

if (form && submitButton) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const endpoint = form.dataset.formspreeEndpoint;
        const submitText = form.dataset.submitText || "Enviar Pedido";
        const loadingText = form.dataset.loadingText || "Enviando...";

        if (!endpoint || endpoint.includes("SEU_FORM_ID")) {
            showFormAlert({
                icon: "error",
                title: "Formspree não configurado",
                text: "Substitua o endpoint do Formspree no formulário de orçamento para ativar o envio."
            });
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = loadingText;
        submitButton.classList.add("loading");

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Accept: "application/json"
                },
                body: new FormData(form)
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorText = responseData?.errors?.map((item) => item.message).join(" ") ||
                    "Não foi possível enviar agora. Tente novamente em instantes.";

                showFormAlert({
                    icon: "error",
                    title: "Falha no envio",
                    text: errorText
                });
                return;
            }

            const modalElement = document.getElementById("modalOrcamento");
            const modalInstance = modalElement ? bootstrap.Modal.getInstance(modalElement) : null;

            form.reset();

            if (modalInstance) {
                modalInstance.hide();
            }

            showFormAlert({
                icon: "success",
                title: form.dataset.successTitle || "Orçamento enviado!",
                text: form.dataset.successText || "Recebemos seu pedido e entraremos em contato em breve."
            });
        } catch (error) {
            console.error("Erro ao enviar formulário:", error);

            showFormAlert({
                icon: "error",
                title: "Erro de rede",
                text: "Não foi possível concluir o envio. Verifique sua conexão e tente novamente."
            });
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = submitText;
            submitButton.classList.remove("loading");
        }
    });
}
