document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.querySelector("#year");
    const lastModifiedElement = document.querySelector("#lastModified");
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector("#primary-navigation");
    const templeGrid = document.querySelector("#temple-grid");

    const temples = [
        {
            templeName: "Aba Nigeria",
            location: "Aba, Nigeria",
            dedicated: "2005, August, 7",
            area: 11500,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/aba-nigeria/400x250/aba-nigeria-temple-lds-273999-wallpaper.jpg"
        },
        {
            templeName: "Manti Utah",
            location: "Manti, Utah, United States",
            dedicated: "1888, May, 21",
            area: 74792,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/manti-utah/400x250/manti-temple-768192-wallpaper.jpg"
        },
        {
            templeName: "Payson Utah",
            location: "Payson, Utah, United States",
            dedicated: "2015, June, 7",
            area: 96630,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/payson-utah/400x225/payson-utah-temple-exterior-1416671-wallpaper.jpg"
        },
        {
            templeName: "Yigo Guam",
            location: "Yigo, Guam",
            dedicated: "2020, May, 2",
            area: 6861,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/yigo-guam/400x250/yigo_guam_temple_2.jpg"
        },
        {
            templeName: "Washington D.C.",
            location: "Kensington, Maryland, United States",
            dedicated: "1974, November, 19",
            area: 156558,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/washington-dc/400x250/washington_dc_temple-exterior-2.jpeg"
        },
        {
            templeName: "Lima Perú",
            location: "Lima, Perú",
            dedicated: "1986, January, 10",
            area: 9600,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/lima-peru/400x250/lima-peru-temple-evening-1075606-wallpaper.jpg"
        },
        {
            templeName: "Mexico City Mexico",
            location: "Mexico City, Mexico",
            dedicated: "1983, December, 2",
            area: 116642,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/mexico-city-mexico/400x250/mexico-city-temple-exterior-1518361-wallpaper.jpg"
        },
        {
            templeName: "Salt Lake Utah",
            location: "Salt Lake City, Utah, United States",
            dedicated: "1893, April, 6",
            area: 382207,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/salt-lake-city-utah/2018/800x500/Salt-Lake-Temple2-2018.jpg"
        },
        {
            templeName: "Jordan River Utah",
            location: "South Jordan, Utah, United States",
            dedicated: "1981, November, 16",
            area: 148236,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/jordan-river-utah/400x250/jordan-river-temple-lds-960565-wallpaper.jpg"
        },
        {
            templeName: "Colonia Juárez Chihuahua Mexico",
            location: "Colonia Juárez, Chihuahua, Mexico",
            dedicated: "1999, March, 6",
            area: 6900,
            imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/colonia-juarez-chihuahua-mexico/400x250/colonia-juarez-temple-lds-354785-wallpaper.jpg"
        }
    ];

    function getDedicationYear(dedicated) {
        return Number(dedicated.split(",")[0]);
    }

    function createTempleCard(temple) {
        return `
            <figure>
                <img src="${temple.imageUrl}" alt="The ${temple.templeName} Temple" width="400" height="250" loading="lazy">
                <figcaption>
                    <span class="temple-name">${temple.templeName}</span>
                    <span>Location: ${temple.location}</span>
                    <span>Dedicated: ${temple.dedicated}</span>
                    <span>Area: ${temple.area.toLocaleString()} sq ft</span>
                </figcaption>
            </figure>`;
    }

    function displayTemples(templeList) {
        templeGrid.innerHTML = templeList.map(createTempleCard).join("");
    }

    function filterTemples(filter) {
        let filteredTemples = temples;

        if (filter === "old") {
            filteredTemples = temples.filter((temple) => getDedicationYear(temple.dedicated) < 1900);
        } else if (filter === "new") {
            filteredTemples = temples.filter((temple) => getDedicationYear(temple.dedicated) > 2000);
        } else if (filter === "large") {
            filteredTemples = temples.filter((temple) => temple.area > 90000);
        } else if (filter === "small") {
            filteredTemples = temples.filter((temple) => temple.area < 10000);
        }

        displayTemples(filteredTemples);
    }

    if (yearElement) {
        yearElement.textContent = `${new Date().getFullYear()}`;
    }

    if (lastModifiedElement) {
        lastModifiedElement.textContent = `Last modified: ${document.lastModified}`;
    }

    if (menuButton && navigation) {
        menuButton.addEventListener("click", () => {
            const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
            menuButton.setAttribute("aria-expanded", `${!isExpanded}`);
            menuButton.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
            menuButton.querySelector("span").textContent = isExpanded ? "☰" : "×";
            navigation.classList.toggle("is-open", !isExpanded);
        });
    }

    document.querySelectorAll("[data-filter]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const filter = link.dataset.filter;

            document.querySelectorAll("[data-filter]").forEach((item) => item.removeAttribute("aria-current"));
            link.setAttribute("aria-current", "page");
            filterTemples(filter);

            if (navigation.classList.contains("is-open")) {
                navigation.classList.remove("is-open");
                menuButton.setAttribute("aria-expanded", "false");
                menuButton.setAttribute("aria-label", "Open navigation menu");
                menuButton.querySelector("span").textContent = "☰";
            }
        });
    });

    filterTemples("home");
});
