// js_home_dual.js - Homepage con dos secciones de cursos independientes
(function() {
    'use strict';

    console.log('=== Iniciando js_home_dual.js ===');

    // Clase para manejar un carrusel de cursos
    class CourseCarousel {
        constructor(containerId, config) {
            this.containerId = containerId;
            this.config = config;
            this.container = document.getElementById(containerId);
            this.courses = [];
            this.currentIndex = 0;
            this.coursesPerPage = 4;
            
            console.log(`[${this.containerId}] Inicializando carrusel con config:`, this.config);
            
            if (!this.container) {
                console.error(`[${this.containerId}] Contenedor no encontrado!`);
                return;
            }
            
            console.log(`[${this.containerId}] Contenedor encontrado`);
            this.init();
        }

        init() {
            this.createStructure();
            this.fetchCourses();
        }

        createStructure() {
            const wrapper = document.createElement('div');
            wrapper.className = 'course-carousel-wrapper';
            wrapper.innerHTML = `
                <div class="carousel-header">
                    <h2>${this.config.title}</h2>
                </div>
                <div class="carousel-container">
                    <button class="carousel-btn carousel-btn-prev" aria-label="Anterior">
                        <i class="fa fa-chevron-left"></i>
                    </button>
                    <div class="carousel-track-container">
                        <div class="carousel-track"></div>
                    </div>
                    <button class="carousel-btn carousel-btn-next" aria-label="Siguiente">
                        <i class="fa fa-chevron-right"></i>
                    </button>
                </div>
                <div class="carousel-indicators"></div>
            `;
            
            this.container.innerHTML = '';
            this.container.appendChild(wrapper);
            
            // Referencias a elementos
            this.track = wrapper.querySelector('.carousel-track');
            this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
            this.nextBtn = wrapper.querySelector('.carousel-btn-next');
            this.indicators = wrapper.querySelector('.carousel-indicators');
            
            // Event listeners
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
            
            console.log(`[${this.containerId}] Estructura creada`);
        }

        async fetchCourses() {
            try {
                console.log(`[${this.containerId}] Obteniendo cursos...`);
                const response = await fetch('/api/courses/v1/courses/?page_size=100');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const allCourses = data.results || [];
                
                console.log(`[${this.containerId}] Total cursos de la API:`, allCourses.length);
                console.log(`[${this.containerId}] Primeros 3 cursos:`, allCourses.slice(0, 3).map(c => ({
                    name: c.name,
                    org: c.org,
                    id: c.id,
                    course_id: c.course_id
                })));
                
                this.courses = this.filterCourses(allCourses);
                
                console.log(`[${this.containerId}] Cursos después del filtro:`, this.courses.length);
                console.log(`[${this.containerId}] Cursos filtrados:`, this.courses.map(c => ({
                    name: c.name,
                    org: c.org
                })));
                
                this.renderCourses();
                this.updateNavigation();
            } catch (error) {
                console.error(`[${this.containerId}] Error fetching courses:`, error);
                this.container.innerHTML = `<p style="text-align: center; padding: 20px; color: red;">Error al cargar los cursos: ${error.message}</p>`;
            }
        }

        filterCourses(courses) {
            console.log(`[${this.containerId}] Filtrando cursos con modo: ${this.config.mode}`);
            
            const filtered = courses.filter(course => {
                // Modo exclude: Excluir organizaciones específicas
                if (this.config.mode === 'exclude') {
                    // Excluir por organización
                    if (this.config.hideOrgs && this.config.hideOrgs.includes(course.org)) {
                        console.log(`[${this.containerId}] Excluyendo curso "${course.name}" por org: ${course.org}`);
                        return false;
                    }
                    
                    // Excluir por ID específico
                    if (this.config.hideCourseIds && this.config.hideCourseIds.includes(course.id)) {
                        console.log(`[${this.containerId}] Excluyendo curso "${course.name}" por ID`);
                        return false;
                    }
                    
                    console.log(`[${this.containerId}] Incluyendo curso "${course.name}" (org: ${course.org})`);
                    return true;
                }
                
                // Modo include: Solo incluir cursos específicos
                if (this.config.mode === 'include') {
                    // Debe ser de la organización correcta
                    if (this.config.filterOrg && course.org !== this.config.filterOrg) {
                        return false;
                    }
                    
                    // Si hay filtro de course numbers, verificar
                    if (this.config.filterCourseNumbers && this.config.filterCourseNumbers.length > 0) {
                        // Extraer el course number del course_id
                        // Formato típico: course-v1:ORG+COURSENUMBER+RUN
                        const parts = course.course_id.split('+');
                        let courseNumber = '';
                        
                        if (parts.length >= 2) {
                            courseNumber = parts[1];
                        } else {
                            // Formato alternativo: ORG/COURSENUMBER/RUN
                            const slashParts = course.course_id.split('/');
                            if (slashParts.length >= 2) {
                                courseNumber = slashParts[1];
                            }
                        }
                        
                        const isIncluded = this.config.filterCourseNumbers.includes(courseNumber);
                        
                        if (isIncluded) {
                            console.log(`[${this.containerId}] Incluyendo curso "${course.name}" (courseNumber: ${courseNumber})`);
                        }
                        
                        return isIncluded;
                    }
                    
                    // Si no hay filtro de course numbers, incluir todos de la org
                    console.log(`[${this.containerId}] Incluyendo curso "${course.name}" por org: ${course.org}`);
                    return true;
                }
                
                return false;
            });
            
            return filtered;
        }

        renderCourses() {
            if (this.courses.length === 0) {
                this.container.innerHTML = `<div class="carousel-header"><h2>${this.config.title}</h2></div><p style="text-align: center; padding: 20px; color: #666;">No hay cursos disponibles en esta categoría.</p>`;
                console.log(`[${this.containerId}] No hay cursos para mostrar`);
                return;
            }
            
            console.log(`[${this.containerId}] Renderizando ${this.courses.length} cursos`);
            
            this.track.innerHTML = '';
            
            this.courses.forEach((course, index) => {
                const courseCard = this.createCourseCard(course);
                this.track.appendChild(courseCard);
                
                if (index < 3) {
                    console.log(`[${this.containerId}] Renderizado curso ${index + 1}: ${course.name}`);
                }
            });
            
            this.createIndicators();
            this.updateCarousel();
        }

        createCourseCard(course) {
            const card = document.createElement('div');
            card.className = 'carousel-course-card';
            
            const imageUrl = course.media?.image?.raw || course.media?.course_image?.uri || '/static/images/course_image_placeholder.png';
            const courseUrl = `/courses/${course.id}/about`;
            
            card.innerHTML = `
                <a href="${courseUrl}" class="course-card-link">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${course.name}" loading="lazy">
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
        }

        updateNavigation() {
            const totalPages = Math.ceil(this.courses.length / this.coursesPerPage);
            
            this.prevBtn.disabled = this.currentIndex === 0;
            this.nextBtn.disabled = this.currentIndex >= totalPages - 1;
            
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
        console.log('Inicializando carruseles...');
        
        // Carrusel 1: Cursos UPVx (excluir poc y edxorg)
        const catalog1 = new CourseCarousel('course-catalog-main', {
            title: 'Cursos UPVx',
            mode: 'exclude',
            hideOrgs: ['poc', 'edxorg'],
            hideCourseIds: ['course-v1:TecnologiasAvanzadasDeComunicaciones+5G-Industry4.0+2022-01']
        });
        
        // Carrusel 2: Cursos en edX (solo edxorg con course numbers específicos)
        const catalog2 = new CourseCarousel('course-catalog-nivelacion', {
            title: 'Cursos en edX',
            mode: 'include',
            filterOrg: 'edxorg',
            filterCourseNumbers: [
                'bases-matematicas-derivadas',
                'bases-matematicas-integrales',
                'bases-matematicas-numeros-y-terminologia',
                'bases-matematicas-algebra',
                'fundamentos-de-mecanica-para-ingenieria',
                'fundamentos-de-electromagnetismo-para',
                'fundamentos-de-oscilaciones-y-ondas-para-ingenieria',
                'el-enlace-quimico-y-las-interacciones',
                'formulacion-y-nomenclatura-de-compuestos',
                'introduccion-la-estructura-de-la-materia',
                'primeros-pasos-en-termodinamica',
                'reacciones-de-oxidacion-reduccion-conceptos-basicos',
                'reacciones-quimicas-y-calculos',
                'reacciones-redox-en-la-industria-y-la-naturaleza',
                'sales-reacciones-y-aplicaciones',
                'teoria-de-circuitos-conceptos-en-corriente-continua',
                'acidos-y-bases-reacciones-y-aplicaciones'
            ]
        });
        
        console.log('Carruseles inicializados');
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousels);
    } else {
        // Si el DOM ya está listo, ejecutar inmediatamente
        setTimeout(initCarousels, 100);
    }

    // Añadir estilos CSS
    const styles = `
        <style>
        #course-catalog-main,
        #course-catalog-nivelacion {
            width: 100%;
            clear: both;
            margin: 60px 0;
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
            margin: 0;
            color: #333;
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
            min-width: calc(25% - 15px);
            flex: 0 0 calc(25% - 15px);
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
        
        /* Responsive */
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
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
    
    console.log('=== Estilos CSS añadidos ===');
})();
