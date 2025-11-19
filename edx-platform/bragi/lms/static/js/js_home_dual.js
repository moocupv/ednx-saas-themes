// js_home_dual.js - Homepage con dos secciones de cursos con navegación horizontal
(function() {
    'use strict';

    // Configuración para cada catálogo
    const catalogs = [
        {
            containerId: 'course-catalog-main',
            hideOrgs: ['poc', 'edxorg'],
            hideCourseIds: ['course-v1:TecnologiasAvanzadasDeComunicaciones+5G-Industry4.0+2022-01'],
            title: 'Cursos destacados',
            pageSize: 50
        },
        {
            containerId: 'course-catalog-nivelacion',
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
            ],
            title: 'Cursos de nivelación',
            pageSize: 50
        }
    ];

    // Clase para manejar un carrusel de cursos
    class CourseCarousel {
        constructor(config) {
            this.config = config;
            this.container = document.getElementById(config.containerId);
            this.courses = [];
            this.currentIndex = 0;
            this.coursesPerPage = 4; // Mostrar 4 cursos a la vez
            
            if (this.container) {
                this.init();
            }
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
            
            this.container.appendChild(wrapper);
            
            // Referencias a elementos
            this.track = wrapper.querySelector('.carousel-track');
            this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
            this.nextBtn = wrapper.querySelector('.carousel-btn-next');
            this.indicators = wrapper.querySelector('.carousel-indicators');
            
            // Event listeners
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
        }

        async fetchCourses() {
            try {
                const response = await fetch('/api/courses/v1/courses/?page_size=' + this.config.pageSize);
                const data = await response.json();
                
                this.courses = this.filterCourses(data.results || []);
                this.renderCourses();
                this.updateNavigation();
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        }

        filterCourses(courses) {
            return courses.filter(course => {
                // Filtrar por organización si está configurado
                if (this.config.hideOrgs && this.config.hideOrgs.includes(course.org)) {
                    return false;
                }
                
                if (this.config.filterOrg && course.org !== this.config.filterOrg) {
                    return false;
                }
                
                // Filtrar por IDs específicos
                if (this.config.hideCourseIds && this.config.hideCourseIds.includes(course.id)) {
                    return false;
                }
                
                // Filtrar por course numbers si está configurado
                if (this.config.filterCourseNumbers) {
                    const courseNumber = course.course_id.split('+')[1] || '';
                    if (!this.config.filterCourseNumbers.includes(courseNumber)) {
                        return false;
                    }
                }
                
                return true;
            });
        }

        renderCourses() {
            this.track.innerHTML = '';
            
            this.courses.forEach(course => {
                const courseCard = this.createCourseCard(course);
                this.track.appendChild(courseCard);
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

    // Inicializar todos los carruseles cuando el DOM esté listo
    function initCarousels() {
        catalogs.forEach(config => {
            new CourseCarousel(config);
        });
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousels);
    } else {
        initCarousels();
    }

    // Añadir estilos CSS
    const styles = `
        <style>
        .course-carousel-wrapper {
            margin: 40px 0;
            padding: 0 20px;
        }
        
        .carousel-header h2 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
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
})();
