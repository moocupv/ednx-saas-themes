(function () {
    const container = document.getElementById("course-catalog");
    if (!container) {
        console.error('No se encontrÃ³ el contenedor con id "course-catalog".');
        return;
    }

    // Leer data del HTML
    let hideCourseIds = [];
    let hideCourseOrgs = [];

    const hideIdsAttr = container.getAttribute("data-hide-course-ids");
    const hideOrgsAttr = container.getAttribute("data-hide-course-orgs");

    if (hideIdsAttr) {
        try {
            hideCourseIds = JSON.parse(hideIdsAttr);
        } catch (e) {
            console.error("Error al parsear data-hide-course-ids:", e);
        }
    }

    if (hideOrgsAttr) {
        try {
            hideCourseOrgs = JSON.parse(hideOrgsAttr);
        } catch (e) {
            console.error("Error al parsear data-hide-course-orgs:", e);
        }
    }

    // Buscar todos los cursos renderizados
    const courseItems = document.querySelectorAll("li.courses-listing-item article.course");

    courseItems.forEach((article) => {
        const courseId = article.id; // ej: course-v1:poc+derivadas+2015-01

        // Ocultar por course-id
        const shouldHideById = hideCourseIds.includes(courseId);

        // Ocultar por org
        const match = courseId.match(/^course-v1:([^+]+)\+([^+]+)\+([^\/]+)$/);
        const org = match ? match[1] : null;
        const shouldHideByOrg = org && hideCourseOrgs.includes(org);

        if (shouldHideById || shouldHideByOrg) {
            const li = article.closest("li.courses-listing-item");
            if (li) {
                li.remove();
            }
        }
    });
})();
