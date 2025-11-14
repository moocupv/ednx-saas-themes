(function () {
    const container = document.getElementById("course-catalog");
    if (!container) {
        console.error('No se encontró el contenedor con id "course-catalog".');
        return;
    }

    // --- 1. LECTURA DE DATOS DEL HTML ---
    let hideCourseIds = [];
    let hideCourseOrgs = [];

    const hideIdsAttr = container.getAttribute("data-hide-course-ids");
    const hideOrgsAttr = container.getAttribute("data-hide-course-orgs");

    if (hideIdsAttr) {
        try {
            // Se asume que hideCourseIds contiene IDs completas (ej: "course-v1:poc+derivadas+2015-01")
            hideCourseIds = JSON.parse(hideIdsAttr);
        } catch (e) {
            console.error("Error al parsear data-hide-course-ids:", e);
        }
    }

    if (hideOrgsAttr) {
        try {
            // Se asume que hideCourseOrgs contiene solo los nombres de las organizaciones (ej: "poc")
            hideCourseOrgs = JSON.parse(hideOrgsAttr);
        } catch (e) {
            console.error("Error al parsear data-hide-course-orgs:", e);
        }
    }

    // --- 2. PROCESAMIENTO DE CURSOS ---
    // Buscar todos los cursos renderizados (el <article> está dentro de un <li>)
    const courseItems = document.querySelectorAll("li.courses-listing-item article.course");

    courseItems.forEach((article) => {
        // Buscar el enlace <a> para obtener la ID del curso de la URL
        const courseLink = article.querySelector("a");
        if (!courseLink) return;

        const href = courseLink.getAttribute("href");
        
        // Expresión Regular 1: Extraer la ID completa del curso de la URL
        // Captura: "course-v1:Org+Curso+Año"
        const courseIdMatch = href ? href.match(/\/courses\/(course-v1:[^\/]+)\/about/) : null;
        const courseId = courseIdMatch ? courseIdMatch[1] : null; 

        if (!courseId) return; // No se pudo obtener la ID, pasamos al siguiente curso

        // --- Lógica de Filtrado ---

        // A. Ocultar por COURSE ID completa
        // Compara si la ID completa extraída (courseId) está en la lista de IDs a ocultar (hideCourseIds)
        const shouldHideById = hideCourseIds.includes(courseId);

        // B. Ocultar por ORGANIZACIÓN (ORG)
        // Expresión Regular 2: Extraer el nombre de la organización de la courseId
        const orgMatch = courseId.match(/^course-v1:([^+]+)\+([^+]+)\+([^\/]+)$/);
        const org = orgMatch ? orgMatch[1] : null;
        
        // Comprueba si la organización está en la lista de organizaciones a ocultar (hideCourseOrgs)
        const shouldHideByOrg = org && hideCourseOrgs.includes(org);

        // --- 3. ELIMINACIÓN ---
        if (shouldHideById || shouldHideByOrg) {
            // Si debe ocultarse por ID o por Organización, se elimina el ancestro <li>
            const li = article.closest("li.courses-listing-item");
            if (li) {
                li.remove();
            }
        }
    });
})();
