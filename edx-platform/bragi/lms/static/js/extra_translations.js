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
