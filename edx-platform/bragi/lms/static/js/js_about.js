(function () {
    const path = window.location.pathname;
  
    const match = path.match(/^\/courses\/course-v1:([^+]+)\+([^+]+)\+([^\/]+)\/about$/);
    if (match) {
      const org = match[1];
      const number = match[2];
      const run = match[3];
      const course_id = `course-v1:${org}+${number}+${run}`;
      const redirectUrl = `https://gerardo.cc.upv.es/edx/getcourseedxurl/${number}/`;
  
      // Si el org es edxorg
      if (org === "edxorg") {
        // Verifica si ya existe la cookie con el nombre = course_id
        const cookies = document.cookie.split(';').map(c => c.trim());
        const hasRedirectCookie = cookies.some(c => c.startsWith(`${course_id}=`));
  
        if (hasRedirectCookie) {
          // Redirigir inmediatamente si ya tiene la cookie
          window.location.href = redirectUrl;
          return;
        }
  
        // Modificar los botones
        const buttons = document.querySelectorAll('.btn.register');
        buttons.forEach((button, index) => {
          const newButton = button.cloneNode(true);
  
          // Cambiar clase
          newButton.classList.remove('register');
          newButton.classList.add('redirectEdx');
  
          // Cambiar texto y href
          newButton.textContent = "Este curso se realizará en edx.org";
          newButton.href = redirectUrl;
  
          // Reemplazar el botÃ³n original
          button.parentNode.replaceChild(newButton, button);
  
          // Agregar evento click limpio
          newButton.addEventListener('click', function (event) {
            event.preventDefault();
  
            // Crear cookie con nombre = course_id, valor = edxCourseRedirect, duraciÃ³n = 30 dÃ­as
            document.cookie = `${course_id}=edxCourseRedirect; path=/; max-age=2592000`;
  
            // Redirigir
            window.location.href = redirectUrl;
          });
  
          // Click automÃ¡tico al primero a los 30 segundos
          if (index === 0) {
            setTimeout(() => {
              newButton.click();
            }, 30000);
          }
        });
      }
    }
  })();
