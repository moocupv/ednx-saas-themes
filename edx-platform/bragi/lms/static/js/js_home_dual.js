// js_home_dual.js
// - Caché en memoria + localStorage (TTL)
// - Renderizado virtualizado (prev + actual + siguientes) para rendimiento
// - requestAnimationFrame para agrupar renders
// - Resize eficiente
//
// FIXES incluidos:
// 1) translateX en PX (no en %) para evitar saltos por width "lógica" del track
// 2) NO se fuerza track.style.width = `${logicalWidth}%` prueba
// 3) getCoursesPerPage() mide el ancho REAL del carrusel (track-container) antes que window.innerWidth
(function () {
  'use strict';

  // =======================
  // CONFIG
  // =======================
  const DEBUG = false;
  const log = (...a) => DEBUG && console.log(...a);
  const warn = (...a) => DEBUG && console.warn(...a);
  const error = (...a) => console.error(...a);

  // =======================
  // HELPERS
  // =======================
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
      warn('No se pudo hacer JSON.parse de:', str, e);
      return fallback;
    }
  }

  function debounce(fn, wait) {
    let t = null;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // =======================
  // FETCH GLOBAL (CACHE + localStorage)
  // =======================
  let allCoursesCache = null;
  let allCoursesFetchPromise = null;

  const COURSES_CACHE_KEY = 'upvx_courses_cache_v1';
  const COURSES_CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

  async function fetchAllCoursesFromAPI() {
    // 1) Memoria
    if (allCoursesCache) {
      log('[GLOBAL] Usando cursos cacheados en memoria:', allCoursesCache.length);
      return allCoursesCache;
    }

    // 2) localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(COURSES_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.courses) && typeof parsed.timestamp === 'number') {
            const age = Date.now() - parsed.timestamp;
            if (age >= 0 && age < COURSES_CACHE_TTL_MS) {
              log('[GLOBAL] Usando cursos cacheados en localStorage:', parsed.courses.length);
              allCoursesCache = parsed.courses;
              return allCoursesCache;
            } else {
              log('[GLOBAL] Cache localStorage caducada:', age, 'ms');
            }
          }
        }
      }
    } catch (e) {
      warn('[GLOBAL] Error leyendo cache de localStorage:', e);
    }

    // 3) Reutilizar fetch en marcha
    if (allCoursesFetchPromise) {
      log('[GLOBAL] Esperando fetch global existente...');
      return allCoursesFetchPromise;
    }

    // 4) Fetch real
    allCoursesFetchPromise = (async () => {
      const url = '/api/upvx/courses/all';
      log('[GLOBAL] Descargando:', url);

      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];

      allCoursesCache = results;

      // Guardar en localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(
            COURSES_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), courses: results })
          );
          log('[GLOBAL] Cache guardada en localStorage:', results.length);
        }
      } catch (e) {
        warn('[GLOBAL] No se pudo guardar cache en localStorage:', e);
      }

      return results;
    })();

    return allCoursesFetchPromise;
  }

  // =======================
  // CLASE CARRUSEL
  // =======================
  class CourseCarousel {
    constructor(containerId) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);

      this.courses = [];
      this.allCoursesFromAPI = [];
      this.currentIndex = 0; // página
      this.coursesPerPage = 4;

      // Virtualización
      this.renderStartIndex = 0; // índice del primer curso renderizado
      this.renderEndIndex = 0; // exclusivo
      this._renderScheduled = false;

      // Padding virtual (páginas) para evitar huecos:
      // 1 anterior, 2 siguientes suele ir muy bien
      this.padLeftPages = 1;
      this.padRightPages = 2;

      // Resize
      this.onResizeBound = debounce(this.onResize.bind(this), 100);

      if (!this.container) {
        error(`[${this.containerId}] CONTENEDOR NO ENCONTRADO`);
        return;
      }

      // Config desde data-*
      const ds = this.container.dataset;
      this.config = {
        title: ds.title || '',
        mode: ds.mode || 'exclude', // exclude | include
        hideCourseIds: safeJsonParse(ds.hideCourseIds, []),
        hideOrgs: safeJsonParse(ds.hideCourseOrgs, []),
        filterOrg: ds.filterOrg || '',
        filterCourseNumbers: safeJsonParse(ds.filterCourseNumbers, []),
      };

      this.init();
    }

    // Alineado con media queries, pero midiendo ancho REAL del carrusel
    getCoursesPerPage() {
      const trackContainer = this.container.querySelector('.carousel-track-container');
      const w =
        (trackContainer && trackContainer.getBoundingClientRect().width) ||
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

      if (w <= 480) return 1;
      if (w <= 768) return 2;
      if (w <= 1200) return 3;
      return 4;
    }

    init() {
      this.createStructure();
      this.coursesPerPage = this.getCoursesPerPage();
      this.fetchCourses();
      window.addEventListener('resize', this.onResizeBound, { passive: true });
    }

    createStructure() {
      this.container.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.className = 'course-carousel-wrapper';
      wrapper.setAttribute('data-carousel-id', this.containerId);

      const titleText = this.config.title || '';

      wrapper.innerHTML = `
        <div class="carousel-header">
          <h2>${escapeHtmlAttr(titleText)}</h2>
          <small style="color:#666;">(Cargando...)</small>
        </div>
        <div class="carousel-container">
          <button class="carousel-btn carousel-btn-prev" aria-label="Anterior" disabled>
            <i class="fa fa-chevron-left"></i>
          </button>
          <div class="carousel-track-container">
            <div class="carousel-track">
              <div style="padding: 40px; text-align:center; width:100%;">
                <i class="fa fa-spinner fa-spin" style="font-size:40px; color:#c8102e;"></i>
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

      this.wrapper = wrapper;
      this.track = wrapper.querySelector('.carousel-track');
      this.trackContainer = wrapper.querySelector('.carousel-track-container');
      this.prevBtn = wrapper.querySelector('.carousel-btn-prev');
      this.nextBtn = wrapper.querySelector('.carousel-btn-next');
      this.headerSmall = wrapper.querySelector('.carousel-header small');

      this.prevBtn.addEventListener('click', () => this.prev());
      this.nextBtn.addEventListener('click', () => this.next());
    }

    async fetchCourses() {
      try {
        const allCourses = await fetchAllCoursesFromAPI();
        this.allCoursesFromAPI = allCourses;

        // Filtrar
        this.courses = this.filterCourses(this.allCoursesFromAPI);

        // Ordenar (rápido)
        for (const c of this.courses) c.__nameKey = (c.name || '').toLowerCase();
        this.courses.sort((a, b) => (a.__nameKey > b.__nameKey) - (a.__nameKey < b.__nameKey));

        this.currentIndex = 0;
        this.renderCourses();
        this.updateNavigation();
      } catch (e) {
        error(`[${this.containerId}] ERROR FETCH:`, e);
        this.container.innerHTML = `
          <div class="carousel-header">
            <h2>${escapeHtmlAttr(this.config.title || '')}</h2>
          </div>
          <p style="text-align:center; padding:40px; color:red; background:#ffe6e6; border-radius:8px; margin:20px;">
            <i class="fa fa-exclamation-triangle"></i><br><br>
            Error al cargar los cursos: ${escapeHtmlAttr(e.message)}
          </p>
        `;
      }
    }

    filterCourses(courses) {
      const nowTs = Date.now();

      const mode = this.config.mode;
      const hideOrgs = this.config.hideOrgs || [];
      const hideIds = this.config.hideCourseIds || [];
      const filterOrg = this.config.filterOrg || '';
      const filterNums = this.config.filterCourseNumbers || [];

      const hasHideOrgs = hideOrgs.length > 0;
      const hasHideIds = hideIds.length > 0;
      const hasFilterNums = filterNums.length > 0;

      return courses.filter((course) => {
        // 1) hidden
        if (course.hidden === true || course.hidden === 'true') return false;

        // 2) end < now
        if (course.end && course.end !== 'None') {
          const endTs = Date.parse(course.end);
          if (!Number.isNaN(endTs) && endTs < nowTs) return false;
        }

        // 3) enrollment_start > now
        if (course.enrollment_start && course.enrollment_start !== 'None') {
          const startTs = Date.parse(course.enrollment_start);
          if (!Number.isNaN(startTs) && startTs > nowTs) return false;
        }

        // candidate ids
        const id1 = course.id;
        const id2 = course.course_id;

        if (mode === 'exclude') {
          if (hasHideOrgs && hideOrgs.includes(course.org)) return false;

          if (hasHideIds) {
            if (id1 && hideIds.includes(id1)) return false;
            if (id2 && id2 !== id1 && hideIds.includes(id2)) return false;
          }
          return true;
        }

        if (mode === 'include') {
          if (filterOrg && course.org !== filterOrg) return false;

          if (hasFilterNums) {
            let courseNumber = '';
            if (course.course_id) {
              const plusParts = course.course_id.split('+');
              const slashParts = course.course_id.split('/');

              if (plusParts.length >= 2) courseNumber = plusParts[1];
              else if (slashParts.length >= 2) courseNumber = slashParts[1];
            }
            return filterNums.includes(courseNumber);
          }
          return true;
        }

        return false;
      });
    }

    renderCourses() {
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
        return;
      }

      this.renderStartIndex = 0;
      this.renderEndIndex = 0;

      this.scheduleVirtualRender();
    }

    scheduleVirtualRender() {
      if (this._renderScheduled) return;
      this._renderScheduled = true;

      requestAnimationFrame(() => {
        this._renderScheduled = false;
        this.virtualRender();
        this.updateCarousel();
        this.updateNavigation();
      });
    }

    // Virtualización por páginas:
    // renderiza 1 página anterior, la actual y 2 siguientes (evita huecos al navegar).
    virtualRender() {
      const perPage = this.getCoursesPerPage();
      const total = this.courses.length;

      const totalPages = Math.max(1, Math.ceil(total / perPage));
      if (this.currentIndex >= totalPages) this.currentIndex = totalPages - 1;
      if (this.currentIndex < 0) this.currentIndex = 0;

      const currentPage = this.currentIndex;

      const startPage = Math.max(0, currentPage - this.padLeftPages);
      const endPage = Math.min(totalPages - 1, currentPage + this.padRightPages);

      const startIdx = startPage * perPage;
      const endIdx = Math.min(total, (endPage + 1) * perPage);

      if (startIdx === this.renderStartIndex && endIdx === this.renderEndIndex) return;

      this.renderStartIndex = startIdx;
      this.renderEndIndex = endIdx;

      const frag = document.createDocumentFragment();
      for (let i = startIdx; i < endIdx; i++) {
        frag.appendChild(this.createCourseCard(this.courses[i]));
      }

      this.track.innerHTML = '';
      this.track.appendChild(frag);

      this.track.style.willChange = 'transform';
    }

    createCourseCard(course) {
      const card = document.createElement('div');
      card.className = 'carousel-course-card';
      card.setAttribute('data-course-org', course.org || '');
      card.setAttribute('data-course-id', course.id || course.course_id || '');

      const imageUrl =
        (course.media && course.media.image && course.media.image.raw) ||
        (course.media && course.media.course_image && course.media.course_image.uri) ||
        '/static/images/course_image_placeholder.png';

      const courseIdForUrl = course.id || course.course_id;
      const courseUrl = courseIdForUrl ? `/courses/${courseIdForUrl}/about` : '#';

      const fullTitle = course.name || '';
      const fullDescription = course.short_description || '';

      let shortDescription = '';
      if (fullDescription) {
        shortDescription =
          fullDescription.length > 100 ? fullDescription.substring(0, 100) + '...' : fullDescription;
      }

      card.innerHTML = `
        <a href="${courseUrl}" class="course-card-link">
          <div class="course-image">
            <img src="${imageUrl}" alt="${escapeHtmlAttr(fullTitle)}"
                 loading="lazy"
                 decoding="async"
                 onerror="this.src='/static/images/course_image_placeholder.png'">
          </div>
          <div class="course-info">
            <h3 class="course-title" title="${escapeHtmlAttr(fullTitle)}">
              ${escapeHtmlAttr(fullTitle)}
            </h3>
            <p class="course-org">${escapeHtmlAttr(course.org || '')}</p>
            ${
              fullDescription
                ? `<p class="course-description" title="${escapeHtmlAttr(fullDescription)}">
                    ${escapeHtmlAttr(shortDescription)}
                  </p>`
                : ''
            }
          </div>
        </a>
      `;

      return card;
    }

    // translateX en px usando ancho del viewport del carrusel
    updateCarousel() {
      this.coursesPerPage = this.getCoursesPerPage();
      const perPage = this.coursesPerPage;

      // DOM renderizado empieza en renderStartIndex -> startPage
      const startPage = Math.floor(this.renderStartIndex / perPage);

      const viewportW = this.trackContainer ? this.trackContainer.getBoundingClientRect().width : 0;

      const offsetPx = -((this.currentIndex - startPage) * viewportW);
      this.track.style.transform = `translateX(${offsetPx}px)`;
    }

    updateNavigation() {
      this.coursesPerPage = this.getCoursesPerPage();
      const totalPages = Math.ceil(this.courses.length / this.coursesPerPage) || 1;

      if (this.currentIndex >= totalPages) this.currentIndex = totalPages - 1;
      if (this.currentIndex < 0) this.currentIndex = 0;

      this.prevBtn.disabled = this.currentIndex === 0;
      this.nextBtn.disabled = this.currentIndex >= totalPages - 1 || this.courses.length === 0;
    }

    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.scheduleVirtualRender();
      }
    }

    next() {
      const perPage = this.getCoursesPerPage();
      const totalPages = Math.ceil(this.courses.length / perPage) || 1;

      if (this.currentIndex < totalPages - 1) {
        this.currentIndex++;
        this.scheduleVirtualRender();
      }
    }

    onResize() {
      this.scheduleVirtualRender();
    }
  }

  // =======================
  // INIT
  // =======================
  function checkContainers() {
    const upvx = document.getElementById('catalogo-upvx');
    const edx = document.getElementById('catalogo-edx');
    return upvx && edx;
  }

  function initCarousels() {
    if (!checkContainers()) {
      error('NO SE PUEDEN INICIALIZAR - Contenedores no encontrados');
      return;
    }

    new CourseCarousel('catalogo-upvx');
    new CourseCarousel('catalogo-edx');
  }

  let attempts = 0;
  const maxAttempts = 5;

  function tryInit() {
    attempts++;
    if (checkContainers()) {
      initCarousels();
    } else if (attempts < maxAttempts) {
      setTimeout(tryInit, 250 * attempts);
    } else {
      error('No se pudieron encontrar los contenedores tras múltiples intentos');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

  // =======================
  // CSS
  // =======================
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
      will-change: transform;
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
})();
