(function () {
  const API_BASE_URL = '/api/courses/v1/courses/';
  const container = document.getElementById('course-catalog');


  const COURSE_CARD_TEMPLATE = `
  <article class="course" id="<%- course_id %>" role="region" aria-label="<%- name %>">
    <a href="/courses/<%- course_id %>/about">
      <header class="course-image">
        <div class="cover-image">
          <img src="<%- image_url %>" alt="<%- name %> <%- number %>">
          <div class="learn-more" aria-hidden="true">APRENDER MÁS</div>
        </div>
      </header>

      <div class="course-info row align-items-stretch mx-0" aria-hidden="true">
        <h2 class="course-name col col-12 px-0">
          <span class="course-title my-1"><%- name %></span>
        </h2>

        <div class="course-description col col-12 mb-1"><%- short_description %></div>

        <div class="course-date localized_datetime col col-12 pb-2 align-self-end" aria-hidden="true" data-format="shortDate" data-datetime="<%- start_display %>">
          Empieza: <%- start_display %>
        </div>
      </div>

      <div class="sr">
        <ul>
          <li><%- number %></li>
          <li>Empieza: <time class="localized_datetime" itemprop="startDate" data-format="shortDate" data-datetime="<%- start_display %>"></time></li>
        </ul>
      </div>
    </a>
  </article>
  `;

  const courseCardTemplate = _.template(COURSE_CARD_TEMPLATE);

  let nextPageUrl = null;
  const ul = document.createElement('ul');
  ul.className = 'courses-listing';

  function buildQueryString(params) {
    return new URLSearchParams(params).toString();
  }

  function fetchCourses(url, append = false) {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        renderCourses(data.results, append);
        nextPageUrl = data.pagination.next;
      })
      .catch(error => {
        console.error('Error fetching courses:', error);
      });
  }

  function renderCourses(courses, append) {
    if (!container) {
      console.error('No container with id "course-catalog" found.');
      return;
    }

    let filteredCourses = courses;

    if (typeof FILTER_COURSE_IDS !== 'undefined' && FILTER_COURSE_IDS.length > 0) {
      filteredCourses = courses.filter(course => FILTER_COURSE_IDS.includes(course.id));
    }

    if (typeof FILTER_COURSE_NUMBERS !== 'undefined' && FILTER_COURSE_NUMBERS.length > 0) {
        filteredCourses = courses.filter(course => FILTER_COURSE_NUMBERS.includes(course.number));
      }

    filteredCourses.forEach(course => {
    const li = document.createElement('li');
      li.className = 'courses-listing-item';
      li.innerHTML = courseCardTemplate({
        course_id: course.id,
        course_id_encoded: encodeURIComponent(course.id),
        name: course.name,
        number: course.number,
        short_description: course.short_description,
        start_display: course.start_display || '',
        image_url: course.media?.image?.small || course.media?.course_image?.uri || ''
      });
      ul.appendChild(li)
    });

    if (!append) {
      const fullSection = document.createElement('div');
      fullSection.className = 'home';
      fullSection.innerHTML = `
        <section class="courses-container">
          <section class="courses py-0">
          </section>
        </section>
      `;
      fullSection.querySelector('.courses.py-0').appendChild(ul);
      container.innerHTML = '';
      container.appendChild(fullSection);
    }
  }

  function onScroll() {
    if (nextPageUrl && window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      fetchCourses(nextPageUrl, true);
      nextPageUrl = null;
    }
  }

  function init(params = {}) {
    const queryString = buildQueryString(params);
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    fetchCourses(url);
    window.addEventListener('scroll', onScroll);
  }

  function loadConfigFromHTML() {
    if (!container) {
      console.error('No container with id "course-catalog" found.');
      return {};
    }

    let query = {};
    let filterCourseIds = [];
    let filterCourseNumbers = [];

    const queryAttr = container.getAttribute('data-query');
    const filterIds = container.getAttribute('data-filter-course-ids');
    const filterNumbers = container.getAttribute('data-filter-course-numbers');

    if (queryAttr) {
      try {
        query = JSON.parse(queryAttr);
      } catch (e) {
        console.error('Error parsing filters JSON:', e);
      }
    }

    if (filterIds) {
      try {
        filterCourseIds = JSON.parse(filterIds);
      } catch (e) {
        console.error('Error parsing approved courses JSON:', e);
      }
    }

    if (filterNumbers) {
        try {
            filterCourseNumbers = JSON.parse(filterNumbers);
        } catch (e) {
          console.error('Error parsing approved courses JSON:', e);
        }
      }

    return { query, filterCourseIds, filterCourseNumbers };
  }


  // const query = {org: "upv", page_size: 50};
  // const filterCourseIds = ["course-v1:upv+101+2025_2","course-v1:upv+202+2025_2"];
  // const filterCourseNumbers = ["course-v1:upv+101+2025_2","course-v1:upv+202+2025_2"];
  const { query, filterCourseIds, filterCourseNumbers } = loadConfigFromHTML();

  const FILTER_COURSE_IDS = filterCourseIds;
  const FILTER_COURSE_NUMBERS = filterCourseNumbers;
  init(query);
})();
