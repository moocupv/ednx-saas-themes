(function () {
  // Bandera para saber si la cookie fue creada en esta ejecución
  let cookieCreated = false;

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

  // Función para borrar una cookie de sesión
  function deleteCookie(name) {
    // Establecer la expiración en el pasado
    document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  // Solo crear la cookie si NO existe (para no sobrescribir la de usuarios autenticados)
  let cookieLang = getCookie('openedx-language-preference');
  
  if (!cookieLang) {
    // Establecer la bandera
    cookieCreated = true;

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
      console.log('Recargando página para aplicar el idioma del backend...');
      // IMPORTANTE: Al recargar, NO debemos borrar la cookie después.
      window.location.reload();
      return; // Salir aquí para que la cookie persista hasta la siguiente carga y no se borre en este ciclo
    }
  }

  // ==========================================
  // TRADUCCIONES DE INTERFAZ
  // (Resto del código original de traducciones)
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

  // ==========================================
  // BORRADO DE COOKIE TEMPORAL
  // ==========================================

  // Borrar la cookie si fue creada en esta ejecución y la página no se recargó
  // Esto se ejecuta después de que el código de traducciones haya sido programado/ejecutado
  if (cookieCreated) {
    console.log('Borrando cookie de idioma temporal.');
    deleteCookie('openedx-language-preference');
  }
})();
