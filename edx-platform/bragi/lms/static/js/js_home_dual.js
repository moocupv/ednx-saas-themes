// js_home_dual.js - Versión con paginación, filtros desde el HTML, tooltips en hover y caché en localStorage
(function() {
    'use strict';

    console.log('=== INICIANDO js_home_dual.js ===');
    console.log('Timestamp:', new Date().toISOString());

    // ---------- HELPERS GENERALES ----------

    function escapeHtmlAttr(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function safeJsonParse(str, fallback) {
        if (!str) return fallback;
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn('No se pudo hacer JSON.parse de:', str, e);
            return fallback;
        }
    }

    // ---------- FETCH GLOBAL DE TODOS LOS CURSOS (CON PAGINACIÓN + CACHÉ) ----------

    let allCoursesCache = null;
    let allCoursesFetchPromise = null;

    // Caché en localStorage
    const COURSES_CACHE_KEY = 'upvx_courses_cache_v1';
    const COURSES_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

    async function fetchAllCoursesFromAPI() {
        // 1) Caché en memoria (misma carga de página)
        if (allCoursesCache) {
            console.log('[GLOBAL] Usando cursos cacheados en memoria:', allCoursesCache.length);
            return allCoursesCache;
        }

        // 2) Caché en localStorage (entre recargas del mismo usuario)
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const raw = localStorage.getItem(COURSES_CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.courses) && typeof parsed.timestamp === 'number') {
                        const age = Date.now() - parsed.timestamp;
                        if (age >= 0 && age < COURSES_CACHE_TTL_MS) {
                            console.log('[GLOBAL] Usando cursos cacheados en localStorage:', parsed.courses.length, '(edad:', age, 'ms)');
                            allCoursesCache = parsed.courses;
                            return allCoursesCache;
                        } else {
                            console.log('[GLOBAL] Cache localStorage caducada (', age, 'ms ), ignorando...');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[GLOBAL] Error leyendo cache de localStorage:', e);
        }

        // 3) Si ya hay un fetch en marcha en esta pestaña, reutilizarlo
        if (allCoursesFetchPromise) {
            console.log('[GLOBAL] Esperando fetch global existente...');
            return allCoursesFetchPromise;
        }

        // 4) Fetch real al API con paginación
        allCoursesFetchPromise = (async () => {
            console.log('\n[GLOBAL] ========== FETCH TODOS LOS CURSOS (CON PAGINACIÓN) ==========');

            const allCourses = [];
            let url = '/api/courses/v1/courses/?page_size=100';
            let page = 1;

            while (url) {
                console.log(`[GLOBAL] Descargando página ${page}: ${url}`);
                const response = await fetch(url);
                console.log(`[GLOBAL] Status página ${page}:`, response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error en página ${page}! status: ${response.status}`);
                }

                const data = await response.json();
                const results = Array.isArray(data.results) ? data.results : [];
                console.log(`[GLOBAL] Página ${page}: ${results.length} cursos`);

                allCourses.push(...results);

                const pagination = data.pagination || {};
                url = pagination.next || null;
                page += 1;
            }

            console.log(`[GLOBAL] ✅ Total cursos descargados de la API: ${allCourses.length}`);

            // Info por organización
            const orgCount = {};
            allCourses.forEach(c => {
                orgCount[c.org] = (orgCount[c.org] || 0) + 1;
            });
            console.log('[GLOBAL] Cursos por organización:', orgCount);

            allCoursesCache = allCourses;

            // 5) Guardar en localStorage para próximas visitas
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const payload = {
                        timestamp: Date.now(),
                        courses: allCourses
                    };
                    localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(payload));
                    console.log('[GLOBAL] Cache guardada en localStorage:', allCourses.length, 'cursos');
                }
            } catch (e) {
                console.warn('[GLOBAL] No se pudo guardar cache en localStorage:', e);
            }

            return allCourses;
        })();

        return allCoursesFetchPromise;
    }

    // ---------- CLASE CARRUSEL ----------

    class CourseCarousel {
        constructor(containerId) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);
            this.courses = [];
            this.allCoursesFromAPI = [];
            this.currentIndex = 0;        // índice de página (0 = primera página)
            this.coursesPerPage = 4;      // valor por defecto, se recalcula según el ancho
            this.onResizeBound = this.onResize.bind(this);

            console.log(`\n========================================`);
            console.log(`[${this.containerId}] CONSTRUCTOR LLAMADO`);

            if (!this.container) {
                console.error(`[${this.containerId}] ❌ CONTENEDOR NO ENCONTRADO!`);
                console.log('Contenedores disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
                return;
            }

            // Leer configuración desde data-* del div
            const ds = this.container.dataset;

            this.config = {
                title: ds.title || '',
                mode: ds.mode || 'exclude', // 'exclude' o 'include'
                hideCourseIds: safeJsonParse(ds.hideCourseIds, []),
                hideOrgs: safeJsonParse(ds.hideCourseOrgs, []),
                filterOrg: ds.filterOrg || '',
                filterCourseNumbers: safeJsonParse(ds.filterCourseNumbers, [])
            };

            console.log(`[${this.containerId}] Config desde data-*:\n`, JSON.stringify(this.config, null, 2));
            console.log(`[${this.containerId}] ✅ Contenedor encontrado`);

            this.init();
        }

        // Calcula cursos por página en función del ancho (alineado con los media queries del CSS)
        getCoursesPerPage() {
            const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

            if (w <= 480) {
                return 1; // 100%
            } else if (w <= 768) {
                return 2; // 50%
            } else if (w <= 1200) {
                return 3; // 33.3333%
            } else {
                return 4; // 25%
            }
        }

        onResize() {
            // Recalcular cursos por página y reajustar navegación y posición
            this.coursesPerPage = this.getCoursesPerPage();
            this.updateNavigation();
            this.updateCarousel();
        }

        init() {
            console.log(`[${this.containerId}] init() - Creando estructura`);
            this.createStructure();
            // Establecer cursosPerPage inicial según el ancho
            this.coursesPerPage = this.getCoursesPerPage();
            console.log(`[${this.containerId}] init() - coursesPerPage inicial: ${this.coursesPerPage}`);

            console.log(`[${this.containerId}] init() - Obteniendo cursos (fetch global con paginación)`);
            this.fetchCourses();

            // Escuchar cambios de tamaño de ventana
            window.addEventListener('resize', this.onResizeBound);
        }

        createStructure() {
            console.log(`[${this.containerId}] createStructure() - Limpiando contenedor`);

            // Limpiar completamente el contenedor
            this.container.innerHTML = '';

            const wrapper = document.createElement('div');
            wrapper.className = 'course-carousel-wrapper';
            wrapper.setAttribute('data-carousel-id', this.containerId);

            const titleText = this.config.title || '';

            wrapper.innerHTML = `
                <div class="carousel-header">
                    <h2>${escapeHtmlAttr(titleText)}</h2>
                    <small style="color: #666;">(Cargando...)</small>
                </div>
                <div class="carousel-container">
                    <button class="carousel-btn carousel-btn-prev" aria-label="Anterior" disabled>
                        <i class="fa fa-chevron-left"></i>
                    </button>
                    <div class="carousel-track-container">
                        <div class="carousel-track">
                            <div style="padding: 40px; text-align: center; width: 100%;">
                                <i class="fa fa-spinner fa-spin" style="font-size: 40px; color: #c8102e;"></i>
                                <p>Cargando cursos...</p>
                            </div>
                        </div>
                    </div>
                    <button class="carousel-btn carousel-btn-next" aria-label="Siguiente" disabled>
                        <i class="fa fa-chevron-right"></i>
                    </button>
                </div>
            `;

            this.container.appendChild(wrapper);

            // Referencias a elementos
            this.track = wrapper.querySelector('.carousel-track');
            this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
            this.nextBtn = wrapper.querySelector('.carousel-btn-next');
            this.headerSmall = wrapper.querySelector('.carousel-header small');

            // Event listeners
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());

            console.log(`[${this.containerId}] ✅ Estructura creada y añadida al DOM`);
        }

        async fetchCourses() {
            console.log(`\n[${this.containerId}] ========== FETCH COURSES (USANDO FETCH GLOBAL) ==========`);

            try {
                const allCourses = await fetchAllCoursesFromAPI();
                this.allCoursesFromAPI = allCourses.slice(); // copia

                console.log(`[${this.containerId}] ✅ Total cursos disponibles globalmente:`, this.allCoursesFromAPI.length);

                console.log(`\n[${this.containerId}] ========== INICIANDO FILTRADO ==========`);

                this.courses = this.filterCourses(this.allCoursesFromAPI);

                console.log(`[${this.containerId}] ========== FIN FILTRADO ==========\n`);
                console.log(`[${this.containerId}] ✅ Cursos después del filtro (antes de ordenar):`, this.courses.length);

                // Orden alfabético por nombre (aplica a ambos carruseles)
                this.courses.sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                });

                console.log(`[${this.containerId}] ✅ Cursos después de ordenar alfabéticamente:`, this.courses.length);

                this.renderCourses();
                this.updateNavigation();
            } catch (error) {
                console.error(`[${this.containerId}] ❌ ERROR FETCH:`, error);
                this.container.innerHTML = `
                    <div class="carousel-header">
                        <h2>${escapeHtmlAttr(this.config.title || '')}</h2>
                    </div>
                    <p style="text-align: center; padding: 40px; color: red; background: #ffe6e6; border-radius: 8px; margin: 20px;">
                        <i class="fa fa-exclamation-triangle"></i><br><br>
                        Error al cargar los cursos: ${escapeHtmlAttr(error.message)}
                    </p>
                `;
            }
        }

        /**
         * Lógica de filtrado:
         *  1) Para TODOS los carruseles:
         *     - Excluye hidden === true
         *     - Excluye end < hoy
         *     - Excluye enrollment_start > hoy
         *  2) Modo "exclude" (UPVx):
         *     - Excluye org en hideOrgs
         *     - Excluye id / course_id en hideCourseIds
         *  3) Modo "include" (edX):
         *     - Incluye solo org = filterOrg
         *     - Si hay filterCourseNumbers, solo esos courseNumbers
         */
        filterCourses(courses) {
            console.log(`[${this.containerId}] filterCourses() - Modo: ${this.config.mode}`);
            console.log(`[${this.containerId}] Cursos a filtrar:`, courses.length);

            const now = new Date();

            const filtered = courses.filter((course, idx) => {
                const logPrefix = `[${this.containerId}][${idx}]`;

                // 1) Excluir cursos hidden
                if (course.hidden === true || course.hidden === 'true') {
                    return false;
                }

                // 2) Excluir cursos con fecha de fin pasada
                if (course.end && course.end !== 'None') {
                    const endDate = new Date(course.end);
                    if (!isNaN(endDate.getTime()) && endDate < now) {
                        return false;
                    }
                }

                // 3) Excluir cursos cuya enrollment_start esté en el futuro
                if (course.enrollment_start && course.enrollment_start !== 'None') {
                    const enrollStart = new Date(course.enrollment_start);
                    if (!isNaN(enrollStart.getTime()) && enrollStart > now) {
                        return false;
                    }
                }

                // 4) IDs candidatos (id y course_id)
                const candidateIds = [];
                if (course.id) candidateIds.push(course.id);
                if (course.course_id && course.course_id !== course.id) {
                    candidateIds.push(course.course_id);
                }

                // 5) Modo EXCLUDE (UPVx)
                if (this.config.mode === 'exclude') {
                    // Excluir por organización
                    if (this.config.hideOrgs && this.config.hideOrgs.includes(course.org)) {
                        return false;
                    }

                    // Excluir por ID / course_id
                    if (this.config.hideCourseIds && this.config.hideCourseIds.length > 0) {
                        const anyMatch = candidateIds.some(id => this.config.hideCourseIds.includes(id));
                        if (anyMatch) {
                            return false;
                        }
                    }

                    // Si no ha caído en ningún filtro de exclude, se incluye
                    return true;
                }

                // 6) Modo INCLUDE (edX)
                if (this.config.mode === 'include') {
                    // Debe cumplir la org
                    if (this.config.filterOrg && course.org !== this.config.filterOrg) {
                        return false;
                    }

                    // Si hay lista de courseNumbers, filtrar por ahí
                    if (this.config.filterCourseNumbers && this.config.filterCourseNumbers.length > 0) {
                        let courseNumber = '';
                        if (course.course_id) {
                            const plusParts = course.course_id.split('+');
                            const slashParts = course.course_id.split('/');

                            if (plusParts.length >= 2) {
                                courseNumber = plusParts[1];
                            } else if (slashParts.length >= 2) {
                                courseNumber = slashParts[1];
                            }
                        }

                        const included = this.config.filterCourseNumbers.includes(courseNumber);
                        return included;
                    }

                    // Si solo filtramos por org, ya está incluido
                    return true;
                }

                // 7) Si el modo es desconocido, excluimos por seguridad
                console.log(`${logPrefix} EXCLUIDO: modo desconocido (${this.config.mode}) (${course.name})`);
                return false;
            });

            console.log(`[${this.containerId}] Filtrado completado: ${filtered.length} cursos`);
            return filtered;
        }

        renderCourses() {
            console.log(`[${this.containerId}] renderCourses() - Renderizando ${this.courses.length} cursos`);

            if (this.headerSmall) {
                this.headerSmall.textContent = `(${this.courses.length})`;
                this.headerSmall.style.color = '#666';
            }

            if (this.courses.length === 0) {
                this.track.innerHTML = `
                    <div style="text-align: center; padding: 40px; width: 100%;">
                        <i class="fa fa-info-circle" style="font-size: 40px; color: #999;"></i>
                        <p style="margin-top: 20px; color: #666;">No hay cursos disponibles en esta categoría.</p>
                    </div>
                `;
                console.warn(`[${this.containerId}] ⚠️ No hay cursos para mostrar`);
                return;
            }

            this.track.innerHTML = '';

            this.courses.forEach((course, index) => {
                const courseCard = this.createCourseCard(course);
                this.track.appendChild(courseCard);
                if (index < 2) {
                    console.log(`[${this.containerId}] Renderizado curso ${index + 1}: ${course.name}`);
                }
            });

            console.log(`[${this.containerId}] ✅ Todos los cursos renderizados`);

            this.updateCarousel();
        }

        createCourseCard(course) {
            const card = document.createElement('div');
            card.className = 'carousel-course-card';
            card.setAttribute('data-course-org', course.org || '');
            card.setAttribute('data-course-id', course.id || course.course_id || '');

            const imageUrl = (course.media && course.media.image && course.media.image.raw) ||
                             (course.media && course.media.course_image && course.media.course_image.uri) ||
                             '/static/images/course_image_placeholder.png';

            const courseIdForUrl = course.id || course.course_id;
            const courseUrl = courseIdForUrl ? `/courses/${courseIdForUrl}/about` : '#';

            // Textos completos
            const fullTitle = course.name || '';
            const fullDescription = course.short_description || '';

            // Texto que se muestra en la ficha (recortado para la descripción)
            let shortDescription = '';
            if (fullDescription) {
                shortDescription = fullDescription.length > 100
                    ? fullDescription.substring(0, 100) + '...'
                    : fullDescription;
            }

            card.innerHTML = `
                <a href="${courseUrl}" class="course-card-link">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${escapeHtmlAttr(fullTitle)}"
                             loading="lazy"
                             onerror="this.src='/static/images/course_image_placeholder.png'">
                    </div>
                    <div class="course-info">
                        <h3 class="course-title"
                            title="${escapeHtmlAttr(fullTitle)}">
                            ${escapeHtmlAttr(fullTitle)}
                        </h3>
                        <p class="course-org">${escapeHtmlAttr(course.org || '')}</p>
                        ${
                            fullDescription
                                ? `<p class="course-description"
                                      title="${escapeHtmlAttr(fullDescription)}">
                                       ${escapeHtmlAttr(shortDescription)}
                                   </p>`
                                : ''
                        }
                    </div>
                </a>
            `;

            return card;
        }

        updateCarousel() {
            // currentIndex es la “página”, cada página desplaza el 100% del ancho visible
            this.coursesPerPage = this.getCoursesPerPage();
            const offset = -(this.currentIndex * 100);
            this.track.style.transform = `translateX(${offset}%)`;

            const startIdx = this.currentIndex * this.coursesPerPage;
            const endIdx = Math.min(startIdx + this.coursesPerPage, this.courses.length);

            console.log(
                `[${this.containerId}] updateCarousel() - página: ${this.currentIndex}, ` +
                `coursesPerPage: ${this.coursesPerPage}, mostrando cursos [${startIdx} .. ${endIdx - 1}] de ${this.courses.length}, offset: ${offset}%`
            );
        }

        updateNavigation() {
            this.coursesPerPage = this.getCoursesPerPage();
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage) || 1;

            if (this.currentIndex >= totalPages) {
                this.currentIndex = totalPages - 1;
            }

            console.log(
                `[${this.containerId}] updateNavigation() - Total cursos: ${this.courses.length}, ` +
                `coursesPerPage: ${this.coursesPerPage}, totalPages: ${totalPages}, currentIndex: ${this.currentIndex}`
            );

            this.prevBtn.disabled = this.currentIndex === 0;
            this.nextBtn.disabled = this.currentIndex >= totalPages - 1 || this.courses.length === 0;
        }

        prev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateCarousel();
                this.updateNavigation();
            }
        }

        next() {
            this.coursesPerPage = this.getCoursesPerPage();
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage) || 1;
            if (this.currentIndex < totalPages - 1) {
                this.currentIndex++;
                this.updateCarousel();
                this.updateNavigation();
            }
        }
    }

    // ---------- INICIALIZACIÓN ----------

    function checkContainers() {
        console.log('--- VERIFICACIÓN DE CONTENEDORES ---');
        const upvx = document.getElementById('catalogo-upvx');
        const edx = document.getElementById('catalogo-edx');

        console.log('Contenedor catalogo-upvx:', upvx ? 'ENCONTRADO' : 'NO ENCONTRADO');
        console.log('Contenedor catalogo-edx:', edx ? 'ENCONTRADO' : 'NO ENCONTRADO');

        return upvx && edx;
    }

    function initCarousels() {
        console.log('\n🚀 ========== INICIANDO CARRUSELES ==========');

        if (!checkContainers()) {
            console.error('❌ NO SE PUEDEN INICIALIZAR - Contenedores no encontrados');
            return;
        }

        console.log('\n--- Creando Carrusel 1: catalogo-upvx ---');
        // Configuración leída de los data-* del div
        const catalog1 = new CourseCarousel('catalogo-upvx');

        console.log('\n--- Creando Carrusel 2: catalogo-edx ---');
        const catalog2 = new CourseCarousel('catalogo-edx');

        console.log('\n✅ ========== CARRUSELES INICIALIZADOS ==========\n');
    }

    // Esperar a que el DOM esté listo con múltiples intentos
    let attempts = 0;
    const maxAttempts = 5;

    function tryInit() {
        attempts++;
        console.log(`Intento de inicialización #${attempts}`);

        if (document.getElementById('catalogo-upvx') && document.getElementById('catalogo-edx')) {
            console.log('✅ Contenedores encontrados, iniciando...');
            initCarousels();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Contenedores no encontrados, reintentando en ${500 * attempts}ms...`);
            setTimeout(tryInit, 500 * attempts);
        } else {
            console.error('❌ No se pudieron encontrar los contenedores después de múltiples intentos');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

    // ---------- ESTILOS CSS ----------

    const styles = document.createElement('style');
    styles.textContent = `
        /* OCULTAR el listado original de cursos de Open edX */
        .courses-container,
        .courses-listing,
        ul.courses-listing,
        .find-courses .courses,
        section.find-courses .courses,
        .courses-listing-item {
            display: none !important;
        }

        #catalogo-upvx,
        #catalogo-edx {
            width: 100%;
            clear: both;
            margin: 60px 0;
            min-height: 200px;
        }

        .course-carousel-wrapper {
            margin: 0;
            padding: 0 20px;
            width: 100%;
            clear: both;
        }

        .carousel-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #c8102e;
        }

        .carousel-header h2 {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #333;
            display: inline-block;
        }

        .carousel-header small {
            margin-left: 10px;
            font-size: 16px;
            font-weight: normal;
        }

        .carousel-container {
            position: relative;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .carousel-track-container {
            flex: 1;
            overflow: hidden;
            border-radius: 8px;
        }

        .carousel-track {
            display: flex;
            transition: transform 0.4s ease-in-out;
            /* IMPORTANTE: sin gap aquí para que 4 tarjetas = 100% exactos */
        }

        .carousel-course-card {
            flex: 0 0 25%;
            max-width: 25%;
            box-sizing: border-box;
            padding: 0 10px;
            background: transparent;
        }

        .carousel-course-card > .course-card-link {
            display: block;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
        }

        .carousel-course-card > .course-card-link:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .course-card-link {
            text-decoration: none;
            color: inherit;
        }

        .course-image {
            width: 100%;
            height: 180px;
            overflow: hidden;
            background: #f0f0f0;
        }

        .course-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .course-info {
            padding: 15px;
        }

        .course-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #333;
            line-height: 1.4;
            height: 44px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .course-org {
            font-size: 12px;
            color: #666;
            margin: 0 0 8px 0;
            font-weight: 500;
        }

        .course-description {
            font-size: 13px;
            color: #777;
            margin: 0;
            line-height: 1.4;
            max-height: 3.4em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .carousel-btn {
            background: white;
            border: 2px solid #ddd;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .carousel-btn:hover:not(:disabled) {
            background: #f5f5f5;
            border-color: #999;
        }

        .carousel-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .carousel-btn i {
            font-size: 20px;
            color: #333;
        }

        @media (max-width: 1400px) {
            .carousel-course-card {
                flex: 0 0 25%;
                max-width: 25%;
            }
        }

        @media (max-width: 1200px) {
            .carousel-course-card {
                flex: 0 0 33.3333%;
                max-width: 33.3333%;
            }
        }

        @media (max-width: 768px) {
            .carousel-course-card {
                flex: 0 0 50%;
                max-width: 50%;
            }

            .carousel-btn {
                width: 40px;
                height: 40px;
            }

            .carousel-btn i {
                font-size: 16px;
            }
        }

        /* 👇 Fuerza UNA sola columna en móviles pequeños */
        @media (max-width: 480px) {
            #catalogo-upvx .carousel-course-card,
            #catalogo-edx .carousel-course-card {
                flex: 0 0 100% !important;
                max-width: 100% !important;
            }

            .course-carousel-wrapper {
                padding: 0 10px;
            }
        }
    `;

    document.head.appendChild(styles);

    console.log('=== Estilos CSS añadidos ===\n');
})();
