// ==========================================
// FUNCIONES AUXILIARES COMPARTIDAS
// ==========================================

// Función para obtener el valor de una cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Función para crear una cookie de sesión (sin expiración)
function setSessionCookie(name, value) {
  document.cookie = name + "=" + encodeURIComponent(value) + "; path=/";
}

// Función para eliminar una cookie
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Función para obtener el idioma mapeado desde el navegador
function getMappedLanguage(browserLang) {
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
  
  return langMap[browserLang] || langMap[browserLang.split('-')[0]] || 'es-419';
}

// ==========================================
// GESTIÓN DE COOKIE DE IDIOMA Y TRADUCCIONES
// ==========================================

(function () {
  // Verificar si la cookie ya existía
  let cookieLang = getCookie('openedx-language-preference');
  const cookieExistedBefore = cookieLang !== null;
  
  if (!cookieExistedBefore) {
    // Obtener idioma del navegador
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    
    console.log('Creando cookie de idioma temporal:', mappedLang, 'desde navegador:', browserLang);
    
    // Crear cookie de sesión
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
    
    // Recargar la página para que el backend use la nueva cookie
    if (window.location.pathname.includes('/courses') || window.location.pathname.includes('/about')) {
      window.location.reload();
      return;
    }
  }

  // ==========================================
  // TRADUCCIONES DE INTERFAZ
  // ==========================================
  
  const browserLang = navigator.language.slice(0, 2);
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
    translateElements('.nav-link.nav-login');
    translateElements('.nav-link.px-2');
    translateElements('.learn-more');
    translateElements('input[placeholder="Buscar cursos"]');
    translateElements('h1');
    translateElements('h2');
    translateElements('h3');
    translateElements('.nav-colophon-00 a');
    translateElements('.nav-colophon-01 a');
    translateElements('.nav-colophon-02 a');
    translateElements('.nav-colophon-03 a');
    translateElements('.nav-legal-01 a');

    const path = window.location.pathname;
    const match = path.match(/^\/courses\/course-v1:([^+]+)\+([^+]+)\+([^\/]+)\/about$/);
    if (match) {
      translateElements('.btn.register');
    }

    // Borrar cookie si fue creada por el script
    if (!cookieExistedBefore) {
      deleteCookie('openedx-language-preference');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }

  window.addEventListener('load', applyTranslations);
})();

// ==========================================
// TRADUCCIONES DE PÁGINAS ESTÁTICAS
// ==========================================

(function () {
  // Verificar si la cookie ya existía
  let cookieLang = getCookie('openedx-language-preference');
  const cookieExistedBefore = cookieLang !== null;
  
  // Si no existe, crear cookie de sesión
  if (!cookieExistedBefore) {
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
  }

  const browserLang = navigator.language.slice(0, 2);
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;
  
  // Solo ejecutar en páginas estáticas
  const staticPages = ['/faq', '/privacy', '/cookies', '/tos', '/honor', '/contact'];
  const currentPath = window.location.pathname;
  const isStaticPage = staticPages.some(page => currentPath.includes(page));
  
  if (!isStaticPage) {
    // Borrar cookie si fue creada y no estamos en página estática
    if (!cookieExistedBefore) {
      deleteCookie('openedx-language-preference');
    }
    return;
  }
  
  if (lang === 'es') {
    // Borrar cookie si fue creada
    if (!cookieExistedBefore) {
      deleteCookie('openedx-language-preference');
    }
    return;
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

  let pageConfig = null;
  for (const [path, config] of Object.entries(pageContentMap)) {
    if (currentPath.includes(path)) {
      pageConfig = config;
      break;
    }
  }

  if (!pageConfig) {
    // Borrar cookie si fue creada
    if (!cookieExistedBefore) {
      deleteCookie('openedx-language-preference');
    }
    return;
  }

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

      const mainContent = document.querySelector('main.container') || 
                         document.querySelector('.container') ||
                         document.querySelector('main');
      
      if (mainContent && translations[pageConfig.html]) {
        mainContent.innerHTML = translations[pageConfig.html];
      }

      if (translations[pageConfig.title]) {
        document.title = translations[pageConfig.title] + ' | UPV[X]';
        
        const h1 = document.querySelector('h1');
        if (h1 && pageConfig.title.includes('title')) {
          h1.textContent = translations[pageConfig.title];
        }
      }
    })
    .catch(error => {
      console.error('Error cargando traducciones:', error);
    })
    .finally(() => {
      // Borrar cookie si fue creada por el script
      if (!cookieExistedBefore) {
        deleteCookie('openedx-language-preference');
      }
    });
})();

// ==========================================
// TRADUCCIÓN DEL BOTTOM PANEL
// ==========================================

(function () {
  const faqPanel = document.getElementById('panel-faq');
  if (!faqPanel) return;
  
  // Verificar si la cookie ya existía
  let cookieLang = getCookie('openedx-language-preference');
  const cookieExistedBefore = cookieLang !== null;
  
  // Si no existe, crear cookie de sesión
  if (!cookieExistedBefore) {
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
  }

  const browserLang = navigator.language.slice(0, 2);
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;
  
  if (lang === 'es') {
    // Borrar cookie si fue creada
    if (!cookieExistedBefore) {
      deleteCookie('openedx-language-preference');
    }
    return;
  }

  const translationUrl = `/static/bragi/js/bottom_panel_${lang}.json`;
  
  fetch(translationUrl)
    .then(response => {
      if (!response.ok) {
        console.warn(`No se encontró archivo de traducción para bottom panel: ${lang}`);
        return null;
      }
      return response.json();
    })
    .then(translations => {
      if (!translations) return;

      const faqTitle = document.querySelector('#heading1 .panel-title a');
      if (faqTitle && translations.faq_title) {
        faqTitle.textContent = translations.faq_title;
      }
      
      const faqContent = document.querySelector('#collapse1 .panel-body');
      if (faqContent && translations.faq_content) {
        faqContent.innerHTML = translations.faq_content;
      }

      const featuresTitle = document.querySelector('#heading2 .panel-title a');
      if (featuresTitle && translations.features_title) {
        featuresTitle.textContent = translations.features_title;
      }
      
      const featuresContent = document.querySelector('#collapse2 .panel-body');
      if (featuresContent && translations.features_content) {
        featuresContent.innerHTML = translations.features_content;
      }
    })
    .catch(error => {
      console.error('Error cargando traducciones del bottom panel:', error);
    })
    .finally(() => {
      // Borrar cookie si fue creada por el script
      if (!cookieExistedBefore) {
        deleteCookie('openedx-language-preference');
      }
    });
})();
