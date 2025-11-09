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

  // Cargar traducciones (ruta relativa)
  const translationUrl = `static_pages_${lang}.json`;
  
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
