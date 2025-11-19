// js_home_dual_debug.js - Versión con depuración intensiva
(function() {
    'use strict';

    console.log('=== INICIANDO js_home_dual_debug.js ===');
    console.log('Timestamp:', new Date().toISOString());

    // Verificar que los contenedores existen
    function checkContainers() {
        console.log('--- VERIFICACIÓN DE CONTENEDORES ---');
        const main = document.getElementById('course-catalog-main');
        const nivel = document.getElementById('course-catalog-nivelacion');
        
        console.log('Contenedor main:', main ? 'ENCONTRADO' : 'NO ENCONTRADO');
        console.log('Contenedor nivelacion:', nivel ? 'ENCONTRADO' : 'NO ENCONTRADO');
        
        if (main) {
            console.log('Main innerHTML:', main.innerHTML.substring(0, 200));
            console.log('Main tiene hijos:', main.children.length);
        }
        
        if (nivel) {
            console.log('Nivelacion innerHTML:', nivel.innerHTML.substring(0, 200));
            console.log('Nivelacion tiene hijos:', nivel.children.length);
        }
        
        return main && nivel;
    }

    // Clase para manejar un carrusel de cursos
    class CourseCarousel {
        constructor(containerId, config) {
            this.containerId = containerId;
            this.config = config;
            this.container = document.getElementById(containerId);
            this.courses = [];
            this.allCoursesFromAPI = [];
            this.currentIndex = 0;
            this.coursesPerPage = 6; // Cambiado de 4 a 6 cursos por página
            
            console.log(`\n========================================`);
            console.log(`[${this.containerId}] CONSTRUCTOR LLAMADO`);
            console.log(`[${this.containerId}] Config:`, JSON.stringify(this.config, null, 2));
            
            if (!this.container) {
                console.error(`[${this.containerId}] ❌ CONTENEDOR NO ENCONTRADO!`);
                console.log('Contenedores disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
                return;
            }
            
            console.log(`[${this.containerId}] ✅ Contenedor encontrado`);
            console.log(`[${this.containerId}] Contenedor actual HTML:`, this.container.innerHTML.substring(0, 100));
            
            this.init();
        }

        init() {
            console.log(`[${this.containerId}] init() - Creando estructura`);
            this.createStructure();
            console.log(`[${this.containerId}] init() - Obteniendo cursos`);
            this.fetchCourses();
        }

        createStructure() {
            console.log(`[${this.containerId}] createStructure() - Limpiando contenedor`);
            
            // IMPORTANTE: Limpiar completamente el contenedor
            this.container.innerHTML = '';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'course-carousel-wrapper';
            wrapper.setAttribute('data-carousel-id', this.containerId);
            wrapper.innerHTML = `
                <div class="carousel-header">
                    <h2>${this.config.title}</h2>
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
                <div class="carousel-indicators"></div>
            `;
            
            this.container.appendChild(wrapper);
            
            // Referencias a elementos
            this.track = wrapper.querySelector('.carousel-track');
            this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
            this.nextBtn = wrapper.querySelector('.carousel-btn-next');
            this.indicators = wrapper.querySelector('.carousel-indicators');
            this.headerSmall = wrapper.querySelector('.carousel-header small');
            
            // Event listeners
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
            
            console.log(`[${this.containerId}] ✅ Estructura creada y añadida al DOM`);
        }

        async fetchCourses() {
            console.log(`\n[${this.containerId}] ========== FETCH COURSES ==========`);
            try {
                const url = '/api/courses/v1/courses/?page_size=100';
                console.log(`[${this.containerId}] Fetch URL:`, url);
                
                const response = await fetch(url);
                
                console.log(`[${this.containerId}] Response status:`, response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                this.allCoursesFromAPI = data.results || [];
                
                console.log(`[${this.containerId}] ✅ Total cursos de la API:`, this.allCoursesFromAPI.length);
                
                // Mostrar todos los cursos y sus organizaciones
                const orgCount = {};
                this.allCoursesFromAPI.forEach(c => {
                    orgCount[c.org] = (orgCount[c.org] || 0) + 1;
                });
                console.log(`[${this.containerId}] Cursos por organización:`, orgCount);
                
                // Mostrar primeros 5 cursos
                console.log(`[${this.containerId}] Primeros 5 cursos:`, this.allCoursesFromAPI.slice(0, 5).map(c => ({
                    name: c.name,
                    org: c.org,
                    id: c.id,
                    course_id: c.course_id
                })));
                
                console.log(`\n[${this.containerId}] ========== INICIANDO FILTRADO ==========`);
                this.courses = this.filterCourses(this.allCoursesFromAPI);
                console.log(`[${this.containerId}] ========== FIN FILTRADO ==========\n`);
                
                console.log(`[${this.containerId}] ✅ Cursos después del filtro:`, this.courses.length);
                
                if (this.courses.length === 0) {
                    console.warn(`[${this.containerId}] ⚠️ NO HAY CURSOS DESPUÉS DEL FILTRO!`);
                } else {
                    console.log(`[${this.containerId}] Cursos filtrados:`, this.courses.map(c => ({
                        name: c.name,
                        org: c.org,
                        course_id: c.course_id
                    })));
                }
                
                this.renderCourses();
                this.updateNavigation();
            } catch (error) {
                console.error(`[${this.containerId}] ❌ ERROR FETCH:`, error);
                this.container.innerHTML = `
                    <div class="carousel-header">
                        <h2>${this.config.title}</h2>
                    </div>
                    <p style="text-align: center; padding: 40px; color: red; background: #ffe6e6; border-radius: 8px; margin: 20px;">
                        <i class="fa fa-exclamation-triangle"></i><br><br>
                        Error al cargar los cursos: ${error.message}
                    </p>
                `;
            }
        }

        filterCourses(courses) {
            console.log(`[${this.containerId}] filterCourses() - Modo: ${this.config.mode}`);
            console.log(`[${this.containerId}] Cursos a filtrar:`, courses.length);
            
            const filtered = courses.filter((course, index) => {
                const logPrefix = `[${this.containerId}][Curso ${index}]`;
                
                // Modo exclude: Excluir organizaciones específicas
                if (this.config.mode === 'exclude') {
                    console.log(`${logPrefix} Evaluando "${course.name}" (org: ${course.org})`);
                    
                    // Excluir por organización
                    if (this.config.hideOrgs && this.config.hideOrgs.includes(course.org)) {
                        console.log(`${logPrefix} ❌ EXCLUIDO por org: ${course.org}`);
                        return false;
                    }
                    
                    // Excluir por ID específico
                    if (this.config.hideCourseIds && this.config.hideCourseIds.includes(course.id)) {
                        console.log(`${logPrefix} ❌ EXCLUIDO por ID: ${course.id}`);
                        return false;
                    }
                    
                    console.log(`${logPrefix} ✅ INCLUIDO`);
                    return true;
                }
                
                // Modo include: Solo incluir cursos específicos
                if (this.config.mode === 'include') {
                    console.log(`${logPrefix} Evaluando "${course.name}" (org: ${course.org}, id: ${course.course_id})`);
                    
                    // Debe ser de la organización correcta
                    if (this.config.filterOrg && course.org !== this.config.filterOrg) {
                        console.log(`${logPrefix} ❌ EXCLUIDO - org no coincide (esperado: ${this.config.filterOrg}, actual: ${course.org})`);
                        return false;
                    }
                    
                    // Si hay filtro de course numbers, verificar
                    if (this.config.filterCourseNumbers && this.config.filterCourseNumbers.length > 0) {
                        // Extraer el course number del course_id
                        const parts = course.course_id.split('+');
                        let courseNumber = '';
                        
                        if (parts.length >= 2) {
                            courseNumber = parts[1];
                        } else {
                            const slashParts = course.course_id.split('/');
                            if (slashParts.length >= 2) {
                                courseNumber = slashParts[1];
                            }
                        }
                        
                        console.log(`${logPrefix} Course number extraído: "${courseNumber}"`);
                        console.log(`${logPrefix} ¿Está en la lista?:`, this.config.filterCourseNumbers.includes(courseNumber));
                        
                        const isIncluded = this.config.filterCourseNumbers.includes(courseNumber);
                        
                        if (isIncluded) {
                            console.log(`${logPrefix} ✅ INCLUIDO - course number coincide`);
                        } else {
                            console.log(`${logPrefix} ❌ EXCLUIDO - course number no está en la lista`);
                        }
                        
                        return isIncluded;
                    }
                    
                    console.log(`${logPrefix} ✅ INCLUIDO - org coincide y no hay filtro de numbers`);
                    return true;
                }
                
                console.log(`${logPrefix} ❌ EXCLUIDO - modo desconocido`);
                return false;
            });
            
            console.log(`[${this.containerId}] Filtrado completado: ${filtered.length} cursos`);
            return filtered;
        }

        renderCourses() {
            console.log(`[${this.containerId}] renderCourses() - Renderizando ${this.courses.length} cursos`);
            
            if (this.headerSmall) {
                this.headerSmall.textContent = `(${this.courses.length} cursos)`;
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
                    console.log(`[${this.containerId}] ✅ Renderizado curso ${index + 1}: ${course.name}`);
                }
            });
            
            console.log(`[${this.containerId}] ✅ Todos los cursos renderizados`);
            
            this.createIndicators();
            this.updateCarousel();
        }

        createCourseCard(course) {
            const card = document.createElement('div');
            card.className = 'carousel-course-card';
            card.setAttribute('data-course-org', course.org);
            card.setAttribute('data-course-id', course.id);
            
            const imageUrl = course.media?.image?.raw || course.media?.course_image?.uri || '/static/images/course_image_placeholder.png';
            const courseUrl = `/courses/${course.id}/about`;
            
            card.innerHTML = `
                <a href="${courseUrl}" class="course-card-link">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${course.name}" loading="lazy" onerror="this.src='/static/images/course_image_placeholder.png'">
                    </div>
                    <div class="course-info">
                        <h3 class="course-title">${course.name}</h3>
                        <p class="course-org">${course.org}</p>
                        ${course.short_description ? `<p class="course-description">${course.short_description.substring(0, 100)}...</p>` : ''}
                    </div>
                </a>
            `;
            
            return card;
        }

        createIndicators() {
            this.indicators.innerHTML = '';
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage);
            
            if (totalPages <= 1) return;
            
            for (let i = 0; i < totalPages; i++) {
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                indicator.setAttribute('aria-label', `Página ${i + 1}`);
                indicator.addEventListener('click', () => this.goToPage(i));
                this.indicators.appendChild(indicator);
            }
            
            this.updateIndicators();
        }

        updateCarousel() {
            const cardWidth = 100 / this.coursesPerPage;
            const offset = -(this.currentIndex * cardWidth);
            this.track.style.transform = `translateX(${offset}%)`;
            
            console.log(`[${this.containerId}] updateCarousel() - currentIndex: ${this.currentIndex}, coursesPerPage: ${this.coursesPerPage}, offset: ${offset}%, totalCourses: ${this.courses.length}`);
        }

        updateNavigation() {
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage);
            
            console.log(`[${this.containerId}] updateNavigation() - Total cursos: ${this.courses.length}, coursesPerPage: ${this.coursesPerPage}, totalPages: ${totalPages}, currentIndex: ${this.currentIndex}`);
            console.log(`[${this.containerId}] Deberían verse ${Math.min(this.coursesPerPage, this.courses.length - (this.currentIndex * this.coursesPerPage))} cursos en esta página`);
            
            this.prevBtn.disabled = this.currentIndex === 0;
            this.nextBtn.disabled = this.currentIndex >= totalPages - 1 || this.courses.length === 0;
            
            this.updateIndicators();
        }

        updateIndicators() {
            const indicators = this.indicators.querySelectorAll('.carousel-indicator');
            indicators.forEach((indicator, index) => {
                if (index === this.currentIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        }

        prev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateCarousel();
                this.updateNavigation();
            }
        }

        next() {
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage);
            if (this.currentIndex < totalPages - 1) {
                this.currentIndex++;
                this.updateCarousel();
                this.updateNavigation();
            }
        }

        goToPage(pageIndex) {
            this.currentIndex = pageIndex;
            this.updateCarousel();
            this.updateNavigation();
        }
    }

    // Inicializar carruseles
    function initCarousels() {
        console.log('\n🚀 ========== INICIANDO CARRUSELES ==========');
        
        // Verificar contenedores primero
        if (!checkContainers()) {
            console.error('❌ NO SE PUEDEN INICIALIZAR - Contenedores no encontrados');
            setTimeout(() => {
                console.log('Reintentando en 500ms...');
                if (checkContainers()) {
                    initCarousels();
                }
            }, 500);
            return;
        }
        
        console.log('\n--- Creando Carrusel 1: Cursos UPVx ---');
        const catalog1 = new CourseCarousel('course-catalog-main', {
            title: 'Cursos UPVx',
            mode: 'exclude',
            hideOrgs: ['poc', 'edxorg'],
            hideCourseIds: ['course-v1:TecnologiasAvanzadasDeComunicaciones+5G-Industry4.0+2022-01']
        });
        
        console.log('\n--- Creando Carrusel 2: Cursos en edX ---');
        const catalog2 = new CourseCarousel('course-catalog-nivelacion', {
            title: 'Cursos en edX',
            mode: 'include',
            filterOrg: 'edxorg'
            // NO filterCourseNumbers - queremos TODOS los cursos de edxorg
        });
        
        console.log('\n✅ ========== CARRUSELES INICIALIZADOS ==========\n');
    }

    // Esperar a que el DOM esté listo con múltiples intentos
    let attempts = 0;
    const maxAttempts = 5;
    
    function tryInit() {
        attempts++;
        console.log(`Intento de inicialización #${attempts}`);
        
        if (document.getElementById('course-catalog-main') && document.getElementById('course-catalog-nivelacion')) {
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

    // Añadir estilos CSS
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
        
        #course-catalog-main,
        #course-catalog-nivelacion {
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
            gap: 20px;
        }
        
        .carousel-course-card {
            min-width: calc(16.666% - 17px);
            flex: 0 0 calc(16.666% - 17px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .carousel-course-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .course-card-link {
            text-decoration: none;
            color: inherit;
            display: block;
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
        
        .carousel-indicators {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        }
        
        .carousel-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ddd;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 0;
        }
        
        .carousel-indicator.active {
            background: #c8102e;
            width: 30px;
            border-radius: 5px;
        }
        
        .carousel-indicator:hover {
            background: #999;
        }
        
        @media (max-width: 1400px) {
            .carousel-course-card {
                min-width: calc(25% - 15px);
                flex: 0 0 calc(25% - 15px);
            }
        }
        
        @media (max-width: 1200px) {
            .carousel-course-card {
                min-width: calc(33.333% - 14px);
                flex: 0 0 calc(33.333% - 14px);
            }
        }
        
        @media (max-width: 768px) {
            .carousel-course-card {
                min-width: calc(50% - 10px);
                flex: 0 0 calc(50% - 10px);
            }
            
            .carousel-btn {
                width: 40px;
                height: 40px;
            }
            
            .carousel-btn i {
                font-size: 16px;
            }
        }
        
        @media (max-width: 480px) {
            .carousel-course-card {
                min-width: 100%;
                flex: 0 0 100%;
            }
            
            .course-carousel-wrapper {
                padding: 0 10px;
            }
        }
    `;
    
    document.head.appendChild(styles);
    
    console.log('=== Estilos CSS añadidos ===\n');
})();
