(function () {
    const container = document.getElementById("course-catalog");
    if (!container) {
        console.error('No se encontró el contenedor con id "course-catalog".');
        return;
    }

    // --- 1. LECTURA DE DATOS DE CONFIGURACIÓN ---
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

    // El contador de cursos eliminados debe ser acumulativo
    let totalRemovedCount = 0;

    // --- 2. FUNCIÓN DE FILTRADO REUTILIZABLE ---

    /**
     * Filtra una lista de elementos <article.course> y elimina su ancestro <li>
     * si cumplen las reglas de ocultación.
     * @param {NodeList|Array<Element>} elements - La lista de elementos <article.course> a procesar.
     * @returns {number} El número de cursos eliminados en este lote.
     */
    function filterAndRemoveCourses(elements) {
        let batchRemovedCount = 0;
        
        elements.forEach((article) => {
            // Asegurarse de que el elemento es un <article> y tiene la clase 'course'
            if (!article || !article.matches('article.course')) return; 

            // Buscar el enlace <a> para obtener la ID del curso de la URL
            const courseLink = article.querySelector("a");
            if (!courseLink) return;

            const href = courseLink.getAttribute("href");
            
            // Expresión Regular 1: Extraer la ID completa del curso de la URL
            const courseIdMatch = href ? href.match(/\/courses\/(course-v1:[^\/]+)\/about/) : null;
            const courseId = courseIdMatch ? courseIdMatch[1] : null; 

            if (!courseId) return;

            // A. Ocultar por COURSE ID completa
            const shouldHideById = hideCourseIds.includes(courseId);

            // B. Ocultar por ORGANIZACIÓN (ORG)
            // Expresión Regular 2: Extraer el nombre de la organización de la courseId
            const orgMatch = courseId.match(/^course-v1:([^+]+)\+([^+]+)\+([^\/]+)$/);
            const org = orgMatch ? orgMatch[1] : null;
            const shouldHideByOrg = org && hideCourseOrgs.includes(org);

            // --- ELIMINACIÓN ---
            if (shouldHideById || shouldHideByOrg) {
                // Se elimina el ancestro <li>
                const li = article.closest("li.courses-listing-item");
                if (li) {
                    li.remove();
                    batchRemovedCount++;
                }
            }
        });

        return batchRemovedCount;
    }
    
    // --- 3. FUNCIÓN DE ACTUALIZACIÓN DEL CONTEO ---
    
    /**
     * Actualiza el texto del elemento #discovery-message restando el número de cursos eliminados.
     * @param {number} removedCount - El número total acumulado de cursos eliminados.
     */
    function updateCourseMessage(removedCount) {
        if (removedCount === 0) return;
        
        const messageElement = document.getElementById("discovery-message");
        if (messageElement) {
            const originalText = messageElement.textContent;
            
            // Regex robusta para capturar el texto antes del número (prefix),
            // el número (count) y el texto después (suffix).
            const match = originalText.match(/(?<prefix>[\D]*?)(?<count>\d+)(?<suffix>[\D]*)/);

            if (match && match.groups && match.groups.count) {
                const currentCount = parseInt(match.groups.count, 10);
                const prefix = match.groups.prefix;
                const suffix = match.groups.suffix;

                // Calculamos el nuevo conteo, restando el total acumulado
                const newCount = Math.max(0, currentCount - removedCount);
                
                // Reconstruir el texto con el nuevo número
                messageElement.textContent = `${prefix}${newCount}${suffix}`;
            } else {
                // Fallback si la regex de grupos con nombre falla
                const newText = originalText.replace(/(\d+)/, (match) => {
                    const currentCount = parseInt(match, 10);
                    // Solo actualizamos el conteo una vez con el total acumulado
                    return Math.max(0, currentCount - removedCount);
                });
                messageElement.textContent = newText;
            }
        }
    }

    // --- 4. CONFIGURACIÓN DEL MUTATION OBSERVER PARA CARGA DINÁMICA ---
    
    // El contenedor de los cursos que se actualiza dinámicamente
    const courseListContainer = document.querySelector(".courses-listing");
    
    if (courseListContainer) {
        /**
         * Callback del MutationObserver. Se ejecuta cuando se añaden nuevos nodos.
         */
        const observerCallback = (mutationsList, observer) => {
            let batchRemovedCount = 0;
            
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        // El nodo añadido es un <li>. Buscamos el <article> dentro.
                        if (node.nodeType === 1 && node.matches('li.courses-listing-item')) {
                            const article = node.querySelector('article.course');
                            if (article) {
                               batchRemovedCount += filterAndRemoveCourses([article]);
                            }
                        }
                    });
                }
            }

            if (batchRemovedCount > 0) {
                totalRemovedCount += batchRemovedCount;
                // Actualizamos el mensaje con el conteo total
                updateCourseMessage(totalRemovedCount);
            }
        };

        // Opciones del observador: observar solo la adición de hijos directos
        const observerConfig = { childList: true };

        // Crear y arrancar el observador
        const observer = new MutationObserver(observerCallback);
        observer.observe(courseListContainer, observerConfig);
    }

    // --- 5. EJECUCIÓN INICIAL (Cursos ya cargados) ---
    const initialItems = document.querySelectorAll("li.courses-listing-item article.course");
    const initialRemovedCount = filterAndRemoveCourses(initialItems);
    totalRemovedCount += initialRemovedCount;
    updateCourseMessage(totalRemovedCount);
    
    // El observer ahora continuará gestionando cualquier curso cargado dinámicamente.

})();
