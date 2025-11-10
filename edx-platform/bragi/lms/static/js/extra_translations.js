(function () {
  // ==========================================
  // GESTIÓN DE COOKIE DE IDIOMA
  // ==========================================
  
  // Función para obtener el valor de una cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Función para crear una cookie de sesión (sin expiración)
  function setCookie(name, value) {
    document.cookie = name + "=" + encodeURIComponent(value) + "; path=/";
  }

  // Solo crear la cookie si NO existe (para no sobrescribir la de usuarios autenticados)
  let cookieLang = getCookie('openedx-language-preference');
  
  if (!cookieLang) {
    // Obtener idioma del navegador
    const browserLang = navigator.language || navigator.userLanguage;
    
    // Mapear códigos de idioma del navegador a los de Open edX
    const langMap = {
      'es': 'es-419',
      'es-ES': 'es-419',
      'es-MX': 'es-419',
      'es-AR': 'es-419',
      'it': 'it-it',
      'it-IT': 'it-it',
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'de': 'de-de',
      'de-DE': 'de-de',
      'el': 'el',
      'el-GR': 'el'
    };
    
    // Obtener el idioma mapeado o usar el primero (antes del guión)
    const mappedLang = langMap[browserLang] || langMap[browserLang.split('-')[0]] || 'es-419';
    
    console.log('Creando cookie de idioma temporal:', mappedLang, 'desde navegador:', browserLang);
    
    // Crear cookie de sesión (se borra al cerrar el navegador)
    setCookie('openedx-language-preference', mappedLang);
    
    // Actualizar la variable local
    cookieLang = mappedLang;
    
    // Recargar la página para que el backend use la nueva cookie
    // Solo si estamos en /courses o /about
    if (window.location.pathname.includes('/courses') || window.location.pathname.includes('/about')) {
      window.location.reload();
      return; // Salir para que no ejecute el resto del código antes de recargar
    }
  }

  // ==========================================
  // TRADUCCIONES DE INTERFAZ
  // ==========================================
  
  const browserLang = navigator.language.slice(0, 2);
  // Normalizar a 2 caracteres
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;

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
    "Nuestro catálogo de cursos": {
      "en": "Our Course Catalog",
      "de": "Unser Kurskatalog",
      "el": "Ο Κατάλογος Μαθημάτων μας",
      "it": "Il nostro Catalogo Corsi"
    },
    "Explora nuestros cursos": {
      "en": "Explore our courses",
      "de": "Entdecken Sie unsere Kurse",
      "el": "Εξερευνήστε τα μαθήματά μας",
      "it": "Esplora i nostri corsi"
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
    
    // Traducir todos los h1, h2 y h3
    translateElements('h1');
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
  // ==========================================
  // TRADUCCIONES DE PÁGINAS ESTÁTICAS
  // ==========================================
  
  // Función para obtener el valor de una cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Obtener idioma: primero de la cookie, luego del navegador
  const cookieLang = getCookie('openedx-language-preference');
  const browserLang = navigator.language.slice(0, 2);
  // Normalizar ambos a 2 caracteres
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;
  
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

  // Cargar traducciones (ruta absoluta desde la raíz del sitio)
  const translationUrl = `/static/bragi/js/static_pages_${lang}.json`;
  
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
