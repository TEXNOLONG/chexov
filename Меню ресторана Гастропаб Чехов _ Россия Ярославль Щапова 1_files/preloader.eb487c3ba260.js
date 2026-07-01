function hidePreloader() {
    const preloader = document.getElementById("preloader");
    const wrapper = document.querySelector(".wrapper");
    if (!preloader) return;
    preloader.style.opacity = "0";
    setTimeout(() => preloader.style.display = "none", 500);

    if (wrapper) {
        wrapper.style.display = "flex";
    }

}

document.addEventListener("DOMContentLoaded", hidePreloader);
window.addEventListener("load", hidePreloader);
window.addEventListener("pageshow", (e) => {

    if (e.persisted) hidePreloader();
});

setTimeout(hidePreloader, 3000);
