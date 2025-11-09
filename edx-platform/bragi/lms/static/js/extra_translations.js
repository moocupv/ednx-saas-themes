(function () {
  // Obtener idioma del navegador (primeros dos caracteres)
  const lang = navigator.language.slice(0, 2); // "es", "de", "el", "it", etc.

  // Mapas de traducción
  const translations = {
    "Register Now": {
      "es": "Regístrate ahora",
      "de": "Jetzt registrieren",
      "el": "Εγγραφή τώρα",
      "it": "Registrati ora"
    },
    "Enroll": {
      "es": "Inscríbete",
      "de": "Einschreiben",
      "el": "Εγγραφή",
      "it": "Iscriviti"
    },
    "Iniciar sesión": {
      "en": "Sign In",
      "de": "Anmelden",
      "el": "Σύνδεση",
      "it": "Accedi"
    },
    "APRENDE MÁS": {
      "en": "LEARN MORE",
      "de": "MEHR ERFAHREN",
      "el": "ΜΑΘΕ ΠΕΡΙΣΣΟΤΕΡΑ",
      "it": "SCOPRI DI PIÙ"
    },
    "Buscar cursos": {
      "en": "Search courses",
      "de": "Kurse suchen",
      "el": "Αναζήτηση μαθημάτων",
      "it": "Cerca corsi"
    },
    "Formación Online": {
      "en": "Online Training",
      "de": "Online-Schulung",
      "el": "Διαδικτυακή Εκπαίδευση",
      "it": "Formazione Online"
    },
    "Cursos destacados": {
      "en": "Featured Courses",
      "de": "Ausgewählte Kurse",
      "el": "Προτεινόμενα Μαθήματα",
      "it": "Corsi in Evidenza"
    },
    "Política de Cookies": {
      "en": "Cookie Policy",
      "de": "Cookie-Richtlinie",
      "el": "Πολιτική Cookies",
      "it": "Politica sui Cookie"
    },
    "FAQ": {
      "en": "FAQ",
      "de": "FAQ",
      "el": "Συχνές Ερωτήσεις",
      "it": "FAQ"
    },
    "Contacto": {
      "en": "Contact",
      "de": "Kontakt",
      "el": "Επικοινωνία",
      "it": "Contatto"
    },
    "Blog": {
      "en": "Blog",
      "de": "Blog",
      "el": "Blog",
      "it": "Blog"
    },
    "Aviso legal": {
      "en": "Legal Notice",
      "de": "Impressum",
      "el": "Νομική Ειδοποίηση",
      "it": "Note Legali"
    },
    "Política de privacidad": {
      "en": "Privacy Policy",
      "de": "Datenschutzrichtlinie",
      "el": "Πολιτική Απορρήτου",
      "it": "Politica sulla Privacy"
    },
    "Código de Honor": {
      "en": "Honor Code",
      "de": "Ehrenkodex",
      "el": "Κώδικας Τιμής",
      "it": "Codice d'Onore"
    }
  };

  // Función genérica para traducir elementos
  function translateElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const text = element.textContent.trim();
      if (translations[text] && translations[text][lang]) {
        element.textContent = translations[text][lang];
      }
      
      // También traducir placeholders en inputs
      if (element.placeholder) {
        const placeholderText = element.placeholder.trim();
        if (translations[placeholderText] && translations[placeholderText][lang]) {
          element.placeholder = translations[placeholderText][lang];
        }
      }
    });
  }

  // Función para traducir cuando el DOM esté listo
  function applyTranslations() {
    // Cambiar botones de navegación (Register Now)
    translateElements('.nav-link.nav-login');

    // Cambiar enlaces "Iniciar sesión" (nav-link px-2)
    translateElements('.nav-link.px-2');

    // Cambiar enlaces "APRENDE MÁS" (learn-more)
    translateElements('.learn-more');

    // Traducir campos de home_intro y home_text
    translateElements('input[placeholder="Buscar cursos"]');
    
    // Traducir todos los h2 y h3
    translateElements('h2');
    translateElements('h3');

    // Traducir enlaces del footer - colophon
    translateElements('.nav-colophon-00 a');
    translateElements('.nav-colophon-01 a');
    translateElements('.nav-colophon-02 a');
    translateElements('.nav-colophon-03 a');

    // Traducir enlaces del footer - legal
    translateElements('.nav-legal-01 a');

    // Cambiar botones de Enroll en la página de curso
    const path = window.location.pathname;
    const match = path.match(/^\/courses\/course-v1:([^+]+)\+([^+]+)\+([^\/]+)\/about$/);
    if (match) {
      translateElements('.btn.register');
    }
  }

  // Ejecutar cuando el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }

  // Una sola ejecución adicional después de la carga completa
  window.addEventListener('load', applyTranslations);
})();
(function () {
  // Obtener idioma del navegador
  const lang = navigator.language.slice(0, 2);
  
  // Solo ejecutar en páginas estáticas
  const staticPages = ['/faq', '/privacy', '/cookies', '/tos', '/honor', '/contact'];
  const currentPath = window.location.pathname;
  const isStaticPage = staticPages.some(page => currentPath.includes(page));
  
  if (!isStaticPage || lang === 'es') {
    return; // No hacer nada si no es página estática o ya está en español
  }

  // Mapeo de rutas a claves de contenido
  const pageContentMap = {
    '/faq': { html: 'static_faq_html', title: 'static_faq_title' },
    '/privacy': { html: 'static_privacy_html', title: 'static_privacy_title' },
    '/cookies': { html: 'static_cookies_html', title: 'static_cookies_title' },
    '/tos': { html: 'static_tos_html', title: 'static_tos_title' },
    '/honor': { html: 'static_honor_html', title: 'static_honor_title' },
    '/contact': { html: 'static_contact_html', title: 'static_contact_title' }
  };

  // Determinar qué página estática es
  let pageConfig = null;
  for (const [path, config] of Object.entries(pageContentMap)) {
    if (currentPath.includes(path)) {
      pageConfig = config;
      break;
    }
  }

  if (!pageConfig) return;

  // Cargar traducciones
  const translationUrl = `/static/translations/static_pages_${lang}.json`;
  
  fetch(translationUrl)
    .then(response => {
      if (!response.ok) {
        console.warn(`No se encontró archivo de traducción para ${lang}`);
        return null;
      }
      return response.json();
    })
    .then(translations => {
      if (!translations) return;

      // Reemplazar el contenido HTML
      const mainContent = document.querySelector('main.container') || 
                         document.querySelector('.container') ||
                         document.querySelector('main');
      
      if (mainContent && translations[pageConfig.html]) {
        mainContent.innerHTML = translations[pageConfig.html];
      }

      // Reemplazar el título de la página
      if (translations[pageConfig.title]) {
        document.title = translations[pageConfig.title] + ' | UPV[X]';
        
        // También actualizar el h1 si existe
        const h1 = document.querySelector('h1');
        if (h1 && pageConfig.title.includes('title')) {
          h1.textContent = translations[pageConfig.title];
        }
      }
    })
    .catch(error => {
      console.error('Error cargando traducciones:', error);
    });
})();
