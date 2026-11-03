document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("year");
    const lastModifiedElement = document.getElementById("lastModified");
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.getElementById("primary-navigation");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    if (lastModifiedElement) {
        lastModifiedElement.textContent = document.lastModified;
    }

    if (menuButton && navigation) {
        menuButton.addEventListener("click", () => {
            const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
            menuButton.setAttribute("aria-expanded", String(!isExpanded));
            menuButton.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
            menuButton.querySelector("span").textContent = isExpanded ? "☰" : "×";
            navigation.classList.toggle("is-open", !isExpanded);
        });
    }
});
