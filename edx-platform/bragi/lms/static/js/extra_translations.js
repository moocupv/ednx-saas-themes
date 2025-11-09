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
    }
  };

  // Cambiar botones de navegación (Register Now)
  const navLoginButtons = document.querySelectorAll('.nav-link.nav-login');
  navLoginButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (translations[text] && translations[text][lang]) {
      btn.textContent = translations[text][lang];
    }
  });

  // Cambiar botones de Enroll en la página de curso
  const path = window.location.pathname;
  const match = path.match(/^\/courses\/course-v1:([^+]+)\+([^+]+)\+([^\/]+)\/about$/);
  if (match) {
    const buttons = document.querySelectorAll('.btn.register');
    buttons.forEach(button => {
      const text = button.textContent.trim();
      if (translations[text] && translations[text][lang]) {
        button.textContent = translations[text][lang];
      }
    });
  }
})();
