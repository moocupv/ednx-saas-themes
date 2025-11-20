// ==========================================
// CONFIGURACIÓN GLOBAL DEL PANEL DE COOKIES
// Esta variable será traducida automáticamente si el idioma no es español.
// ==========================================
var cookie_content ={
    popup_colorbackground: "#323538",
    popup_colortext: "#ffffff",
    button_colorbackground: "#005379",
    button_colortext: "#ffffff",
    // Estos campos serán traducidos:
    message: 'Utilizamos cookies propias y de terceros por motivos de seguridad, y también para mejorar la experiencia del usuario y conocer tus hábitos de navegación. Recuerda que, al utilizar nuestros servicios, admites nuestro aviso legal y nuestra política de cookies. Entendemos que si continuas navegando es porque apruebas estos términos.',
    message_button: "Acepto",
    message_link: "Saber más",
    link_href: "https://upvx.es/cookies"
};

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

// NOTA: La función deleteCookie ha sido eliminada, ya que se solicitó no borrar la cookie.

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
// GESTIÓN DE COOKIE DE IDIOMA Y TRADUCCIONES DE INTERFAZ
// ==========================================

(function () {
  // Verificar si existe la cookie de idioma y la cookie de login
  let cookieLang = getCookie('openedx-language-preference');
  const isLoggedIn = getCookie('edxloggedin') !== null;
  const cookieExistedBefore = cookieLang !== null;
  
  // Solo crear/sobrescribir la cookie si el usuario NO está logueado Y la cookie NO existía
  if (!isLoggedIn && !cookieExistedBefore) {
    // Obtener idioma del navegador
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    
    console.log('Usuario no logueado - Creando cookie de idioma temporal:', mappedLang, 'desde navegador:', browserLang);
    
    // Crear cookie de sesión
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
    
    // Recargar la página para que el backend use la nueva cookie
    if (window.location.pathname.includes('/courses') || window.location.pathname.includes('/about')) {
      window.location.reload();
      return;
    }
  } else if (isLoggedIn) {
    console.log('Usuario logueado - Respetando cookie de idioma existente:', cookieLang);
  }

  // ==========================================
  // MAPAS DE TRADUCCIÓN
  // ==========================================
  
  const browserLang = navigator.language.slice(0, 2);
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;

  const translations = {
    // --- TRADUCCIONES DE INTERFAZ EXISTENTES ---
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
    "Créditos optativos grado UPV": {
      "en": "UPV Degree Elective Credits",
      "de": "UPV Wahlpflichtmodule",
      "el": "Προαιρετικές Πιστωτικές Μονάδες Πτυχίου UPV",
      "it": "Crediti opzionali laurea UPV"
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
    "Cursos UPVx": {
      "en": "UPVx Courses",
      "de": "UPVx-Kurse",
      "el": "Μαθήματα UPVx",
      "it": "Corsi UPVx"
    },
    "Cursos en edX": {
      "en": "Courses on edX",
      "de": "Kurse auf edX",
      "el": "Μαθήματα στο edX",
      "it": "Corsi su edX"
    },
    "Cargando cursos...": {
      "en": "Loading courses...",
      "de": "Kurse werden geladen...",
      "el": "Φόρτωση μαθημάτων...",
      "it": "Caricamento corsi..."
    },
    "(Cargando...)": {
        "en": "(Loading...)",
        "de": "(Laden...)",
        "el": "(Φόρτωση...)",
        "it": "(Caricamento...)"
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
    },
    // --- NUEVAS TRADUCCIONES PARA EL PANEL DE COOKIES ---
    "cookie_message": {
      "es": 'Utilizamos cookies propias y de terceros por motivos de seguridad, y también para mejorar la experiencia del usuario y conocer tus hábitos de navegación. Recuerda que, al utilizar nuestros servicios, admites nuestro aviso legal y nuestra política de cookies. Entendemos que si continuas navegando es porque apruebas estos términos.',
      "en": 'We use our own and third-party cookies for security reasons, and also to improve user experience and learn about your browsing habits. Remember that, by using our services, you accept our legal notice and our cookie policy. We understand that if you continue browsing it is because you approve these terms.',
      "de": 'Wir verwenden eigene und Drittanbieter-Cookies aus Sicherheitsgründen sowie zur Verbesserung der Benutzererfahrung und zur Kenntnisnahme Ihrer Surfgewohnheiten. Denken Sie daran, dass Sie mit der Nutzung unserer Dienste unser Impressum und unsere Cookie-Richtlinie akzeptieren. Wir gehen davon aus, dass Sie diese Bedingungen akzeptieren, wenn Sie weiter surfen.',
      "it": 'Utilizziamo cookie proprietari e di terze parti per motivi di sicurezza, e anche per migliorare l\'esperienza utente e conoscere le tue abitudini di navigazione. Ricorda che, utilizzando i nostri servizi, accetti la nostra informativa legale e la nostra politica sui cookie. Comprendiamo che se continui a navigare è perché approvi questi termini.',
      "el": 'Χρησιμοποιούμε δικά μας και τρίτων cookies για λόγους ασφαλείας, καθώς και για τη βελτίωση της εμπειρίας του χρήστη και για να γνωρίζουμε τις συνήθειές σας στην πλοήγηση. Θυμηθείτε ότι, χρησιμοποιώντας τις υπηρεσίες μας, αποδέχεστε τη νομική μας ειδοποίηση και την πολιτική μας για τα cookies. Κατανοούμε ότι αν συνεχίσετε την πλοήγηση, αποδέχεστε αυτούς τους όρους.'
    },
    "cookie_button_text": {
      "es": "Acepto",
      "en": "I Accept",
      "de": "Ich akzeptiere",
      "it": "Accetto",
      "el": "Αποδέχομαι"
    },
    "cookie_link_text": {
      "es": "Saber más",
      "en": "Learn More",
      "de": "Mehr erfahren",
      "it": "Per saperne di più",
      "el": "Μάθετε περισσότερα"
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
    translateElements('.mr-auto');
    
    // Traducir "Cargando cursos..." en el carrusel
    translateElements('.carousel-track-container p');
    translateElements('.carousel-header small');

    const path = window.location.pathname;
    const match = path.match(/^\/courses\/course-v1:([^+]+)\+([^+]+)\+([^\/]+)\/about$/);
    if (match) {
      translateElements('.btn.register');
    }
    
    // Aplicar la traducción al objeto cookie_content (si no es español)
    if (lang !== 'es' && typeof cookie_content !== 'undefined') {
        const cookieTranslations = {
            message: translations.cookie_message[lang],
            message_button: translations.cookie_button_text[lang],
            message_link: translations.cookie_link_text[lang]
        };
        
        if (cookieTranslations.message) {
             cookie_content.message = cookieTranslations.message;
             console.log('Cookie message translated.');
        }
        if (cookieTranslations.message_button) {
            cookie_content.message_button = cookieTranslations.message_button;
            console.log('Cookie button translated.');
        }
        if (cookieTranslations.message_link) {
            cookie_content.message_link = cookieTranslations.message_link;
            console.log('Cookie link translated.');
        }
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
  // Verificar si existe la cookie de idioma y la cookie de login
  let cookieLang = getCookie('openedx-language-preference');
  const isLoggedIn = getCookie('edxloggedin') !== null;
  const cookieExistedBefore = cookieLang !== null;
  
  // Si no existe y el usuario NO está logueado, crear cookie de sesión
  if (!isLoggedIn && !cookieExistedBefore) {
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
    console.log('Páginas estáticas - Cookie temporal creada:', mappedLang);
  }

  const browserLang = navigator.language.slice(0, 2);
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;
  
  // Solo ejecutar en páginas estáticas
  const staticPages = ['/faq', '/privacy', '/cookies', '/tos', '/honor', '/contact'];
  const currentPath = window.location.pathname;
  const isStaticPage = staticPages.some(page => currentPath.includes(page));
  
  if (!isStaticPage) {
    return;
  }
  
  if (lang === 'es') {
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
      // La eliminación de la cookie temporal fue quitada aquí.
    });
})();

// ==========================================
// TRADUCCIÓN DEL BOTTOM PANEL
// ==========================================

(function () {
  const faqPanel = document.getElementById('panel-faq');
  if (!faqPanel) return;
  
  // Verificar si existe la cookie de idioma y la cookie de login
  let cookieLang = getCookie('openedx-language-preference');
  const isLoggedIn = getCookie('edxloggedin') !== null;
  const cookieExistedBefore = cookieLang !== null;
  
  // Si no existe y el usuario NO está logueado, crear cookie de sesión
  if (!isLoggedIn && !cookieExistedBefore) {
    const browserLang = navigator.language || navigator.userLanguage;
    const mappedLang = getMappedLanguage(browserLang);
    setSessionCookie('openedx-language-preference', mappedLang);
    cookieLang = mappedLang;
    console.log('Bottom panel - Cookie temporal creada:', mappedLang);
  }

  const browserLang = navigator.language.slice(0, 2);
  const lang = cookieLang ? cookieLang.slice(0, 2) : browserLang;
  
  if (lang === 'es') {
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
      // La eliminación de la cookie temporal fue quitada aquí.
    });
})();
