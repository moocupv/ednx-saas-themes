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

    // ---------- FETCH GLOBAL DE TODOS LOS CURSOS (CON CACHÉ) ----------

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

        // 4) Fetch real al API (1 llamada) contra endpoint cacheado server-side
        allCoursesFetchPromise = (async () => {
            console.log('\n[GLOBAL] ========== FETCH TODOS LOS CURSOS (CACHE SERVER) ==========');

            const url = '/api/upvx/courses/all';
            console.log(`[GLOBAL] Descargando: ${url}`);

            try {
                const response = await fetch(url, { credentials: 'same-origin' });
                console.log(`[GLOBAL] Status:`, response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const results = Array.isArray(data.results) ? data.results : [];
                console.log(`[GLOBAL] ✅ Total cursos recibidos: ${results.length} (source: ${data.source || 'unknown'})`);

                allCoursesCache = results;

                // 5) Guardar en localStorage para próximas visitas
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        const payload = {
                            timestamp: Date.now(),
                            courses: results
                        };
                        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(payload));
                        console.log('[GLOBAL] Cache guardada en localStorage:', results.length, 'cursos');
                    }
                } catch (e) {
                    console.warn('[GLOBAL] No se pudo guardar cache en localStorage:', e);
                }

                return results;
            } catch (error) {
                allCoursesFetchPromise = null; // Resetear promesa para permitir reintentos
                throw error;
            }
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

            this.init();
        }

        getCoursesPerPage() {
            const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            if (w <= 480) return 1;
            if (w <= 768) return 2;
            if (w <= 1200) return 3;
            return 4;
        }

        onResize() {
            this.coursesPerPage = this.getCoursesPerPage();
            this.updateNavigation();
            this.updateCarousel();
        }

        init() {
            this.createStructure();
            this.coursesPerPage = this.getCoursesPerPage();
            this.fetchCourses();
            window.addEventListener('resize', this.onResizeBound);
        }

        createStructure() {
            this.container.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'course-carousel-wrapper';
            wrapper.setAttribute('data-carousel-id', this.containerId);

            wrapper.innerHTML = `
                <div class="carousel-header">
                    <h2>${escapeHtmlAttr(this.config.title || '')}</h2>
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
            this.track = wrapper.querySelector('.carousel-track');
            this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
            this.nextBtn = wrapper.querySelector('.carousel-btn-next');
            this.headerSmall = wrapper.querySelector('.carousel-header small');

            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
        }

        async fetchCourses() {
            try {
                const allCourses = await fetchAllCoursesFromAPI();
                this.allCoursesFromAPI = allCourses.slice();

                this.courses = this.filterCourses(this.allCoursesFromAPI);

                // Orden alfabético por nombre
                this.courses.sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                });

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

        filterCourses(courses) {
            const now = new Date();
            return courses.filter((course) => {
                if (course.hidden === true || course.hidden === 'true') return false;

                if (course.end && course.end !== 'None') {
                    const endDate = new Date(course.end);
                    if (!isNaN(endDate.getTime()) && endDate < now) return false;
                }

                if (course.enrollment_start && course.enrollment_start !== 'None') {
                    const enrollStart = new Date(course.enrollment_start);
                    if (!isNaN(enrollStart.getTime()) && enrollStart > now) return false;
                }

                if (this.config.mode === 'exclude') {
                    if (this.config.hideOrgs && this.config.hideOrgs.includes(course.org)) return false;
                    const candidateIds = [course.id, course.course_id].filter(Boolean);
                    if (this.config.hideCourseIds && this.config.hideCourseIds.length > 0) {
                        if (candidateIds.some(id => this.config.hideCourseIds.includes(id))) return false;
                    }
                    return true;
                }

                if (this.config.mode === 'include') {
                    if (this.config.filterOrg && course.org !== this.config.filterOrg) return false;
                    if (this.config.filterCourseNumbers && this.config.filterCourseNumbers.length > 0) {
                        let courseNumber = '';
                        if (course.course_id) {
                            const plusParts = course.course_id.split('+');
                            const slashParts = course.course_id.split('/');
                            courseNumber = plusParts.length >= 2 ? plusParts[1] : (slashParts.length >= 2 ? slashParts[1] : '');
                        }
                        return this.config.filterCourseNumbers.includes(courseNumber);
                    }
                    return true;
                }
                return false;
            });
        }

        renderCourses() {
            if (this.headerSmall) {
                this.headerSmall.textContent = `(${this.courses.length})`;
            }

            if (this.courses.length === 0) {
                this.track.innerHTML = `
                    <div style="text-align: center; padding: 40px; width: 100%;">
                        <i class="fa fa-info-circle" style="font-size: 40px; color: #999;"></i>
                        <p style="margin-top: 20px; color: #666;">No hay cursos disponibles.</p>
                    </div>
                `;
                return;
            }

            this.track.innerHTML = '';
            this.courses.forEach((course) => {
                this.track.appendChild(this.createCourseCard(course));
            });
            this.updateCarousel();
        }

        createCourseCard(course) {
            const card = document.createElement('div');
            card.className = 'carousel-course-card';
            
            const imageUrl = (course.media && course.media.image && course.media.image.raw) ||
                             (course.media && course.media.course_image && course.media.course_image.uri) ||
                             '/static/images/course_image_placeholder.png';

            const courseId = course.id || course.course_id;
            const fullTitle = course.name || '';
            const fullDescription = course.short_description || '';
            const shortDescription = fullDescription.length > 100 ? fullDescription.substring(0, 100) + '...' : fullDescription;

            card.innerHTML = `
                <a href="/courses/${courseId}/about" class="course-card-link">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${escapeHtmlAttr(fullTitle)}" loading="lazy" onerror="this.src='/static/images/course_image_placeholder.png'">
                    </div>
                    <div class="course-info">
                        <h3 class="course-title" title="${escapeHtmlAttr(fullTitle)}">${escapeHtmlAttr(fullTitle)}</h3>
                        <p class="course-org">${escapeHtmlAttr(course.org || '')}</p>
                        ${fullDescription ? `<p class="course-description" title="${escapeHtmlAttr(fullDescription)}">${escapeHtmlAttr(shortDescription)}</p>` : ''}
                    </div>
                </a>
            `;
            return card;
        }

        updateCarousel() {
            this.coursesPerPage = this.getCoursesPerPage();
            const offset = -(this.currentIndex * 100);
            this.track.style.transform = `translateX(${offset}%)`;
        }

        updateNavigation() {
            this.coursesPerPage = this.getCoursesPerPage();
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage) || 1;
            if (this.currentIndex >= totalPages) this.currentIndex = totalPages - 1;
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
            const totalPages = Math.ceil(this.courses.length / this.getCoursesPerPage()) || 1;
            if (this.currentIndex < totalPages - 1) {
                this.currentIndex++;
                this.updateCarousel();
                this.updateNavigation();
            }
        }
    }

    // ---------- INICIALIZACIÓN ----------

    function initCarousels() {
        if (document.getElementById('catalogo-upvx')) new CourseCarousel('catalogo-upvx');
        if (document.getElementById('catalogo-edx')) new CourseCarousel('catalogo-edx');
    }

    let attempts = 0;
    function tryInit() {
        attempts++;
        if (document.getElementById('catalogo-upvx') || document.getElementById('catalogo-edx')) {
            initCarousels();
        } else if (attempts < 5) {
            setTimeout(tryInit, 500 * attempts);
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
        .courses-container, .courses-listing, .find-courses .courses { display: none !important; }
        #catalogo-upvx, #catalogo-edx { width: 100%; clear: both; margin: 60px 0; min-height: 200px; }
        .course-carousel-wrapper { padding: 0 20px; width: 100%; }
        .carousel-header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #c8102e; }
        .carousel-header h2 { font-size: 28px; font-weight: bold; margin: 0; color: #333; display: inline-block; }
        .carousel-container { position: relative; display: flex; align-items: center; gap: 15px; }
        .carousel-track-container { flex: 1; overflow: hidden; border-radius: 8px; }
        .carousel-track { display: flex; transition: transform 0.4s ease-in-out; }
        .carousel-course-card { flex: 0 0 25%; max-width: 25%; box-sizing: border-box; padding: 0 10px; }
        .course-card-link { display: block; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease; text-decoration: none; color: inherit; height: 100%; }
        .course-card-link:hover { transform: translateY(-5px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .course-image { width: 100%; height: 180px; background: #f0f0f0; }
        .course-image img { width: 100%; height: 100%; object-fit: cover; }
        .course-info { padding: 15px; }
        .course-title { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; height: 44px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .course-org { font-size: 12px; color: #666; margin-bottom: 8px; }
        .course-description { font-size: 13px; color: #777; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .carousel-btn { background: white; border: 2px solid #ddd; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .carousel-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        @media (max-width: 1200px) { .carousel-course-card { flex: 0 0 33.33%; max-width: 33.33%; } }
        @media (max-width: 768px) { .carousel-course-card { flex: 0 0 50%; max-width: 50%; } .carousel-btn { width: 40px; height: 40px; } }
        @media (max-width: 480px) { .carousel-course-card { flex: 0 0 100% !important; max-width: 100% !important; } }
    `;
    document.head.appendChild(styles);
})();
