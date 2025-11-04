/* ----------------------------
   Scroll para a próxima seção
------------------------------*/

document.getElementById("scrollArrow").addEventListener("click", function () {
    document.querySelector(".sobre").scrollIntoView({
        behavior: "smooth"
    });
});


