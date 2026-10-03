# Las palabras de Fernando

Colección personal de Fernando Nieto Nieto. Taller de Escritura Creativa de la Casa de las Conchas, Salamanca, impartido por Raúl Vacas. Curso 2025–2026. Prólogo de Juan José Nieto Lobato.

Web: https://elcontemplador.github.io/relatos-fernando-nieto/

24 textos y un prólogo, ilustraciones originales, lectura grande por defecto, tres tamaños de letra, tres contrastes, lectura por voz del dispositivo, búsqueda, categorías, elección al azar, recuerdo local del último texto y ampliación de imágenes. Sin cuentas, anuncios ni analítica.

## Edición y publicación

- `source/collection.json`: textos íntegros y asociación de ilustraciones.
- `docs/styles.css` y `docs/app.js`: diseño e interacción.
- `scripts/build.py`: genera páginas HTML estáticas con texto disponible sin JavaScript.
- `docs/coleccion-original.pdf`: edición original proporcionada por la familia.
- `python scripts/build.py` recompila el HTML.
- GitHub Pages publica `main:/docs`.

Para probar: `python -m http.server 18749 --bind 127.0.0.1 --directory docs`; después `node scripts/qa.cjs` con Playwright disponible. `scripts/accessibility.cjs` usa axe-core 4.10.3 descargado en `qa/axe.min.js` para las comprobaciones locales (no se sirve al público).

## Fidelidad editorial

Los textos no se han reescrito ni corregido silenciosamente. Se normalizan espacios y saltos físicos del PDF; se conservan versos, preguntas, subapartados, firmas y notas. Tautogramas tiene entrada propia aunque no figure en el índice del PDF. Su frase repetida al final se conserva como pie de ilustración, tal como aparece en la página 38. Los nombres de categorías y los textos de navegación son de la edición web. Las ilustraciones conservan su resolución de origen: ampliar no añade detalle.

Fuente: 49 páginas, 28 imágenes (incluida contraportada que repite la cubierta), compilación del 26 de junio de 2026. SHA-256 del PDF: `c332b6e9d80f4211791417fdb0b9ba3f796e5f82d167eb2f151f0ada8ed2d728`.

## Comprobaciones realizadas

- Comparación independiente PDF → JSON → HTML: 25/25 textos íntegros.
- 14 grupos de pruebas de navegador: rutas de los 25 textos, imágenes, búsqueda, filtros, aleatorio, ajustes y persistencia, lectura recuperada, imagen ampliada con Escape, lectura sin JavaScript, móvil Chromium/WebKit.
- Vistas de 320, 390, 768 y 1440 píxeles; ampliación al 200 % sin scroll horizontal.
- axe-core: cero incidencias A/AA detectadas en cuatro combinaciones de página/tema, incluyendo opciones abiertas. No equivale a certificación exhaustiva ni prueba con usuarios.
- Revisión visual de portada y lectura, móvil y escritorio.
- La voz usa SpeechSynthesis del navegador. Su timbre y disponibilidad dependen del dispositivo; no se ha validado mediante escucha humana en teléfonos físicos.

Proyecto personal independiente, publicado por autorización expresa. Texto e imágenes mantienen los derechos que correspondan a sus autores; no se otorga licencia abierta sobre el contenido.


## Mejora de lectura y UX · 3 de octubre de 2026

- Ajustes en diálogo: mantienen el párrafo visible, incluso cuando el lector está en el espacio entre párrafos. El marcador guarda párrafo, avance dentro del párrafo y separación visible; sigue aceptando marcadores anteriores.
- Barra persistente con Índice, Letra y Escuchar. Pausa, continuación y detención permanecen accesibles; se reserva espacio inferior para no ocultar el final.
- Escala global Normal/Grande/Muy grande para navegación, filtros, buscador y controles, además del texto. Tamaños de lectura aproximados: 24/28/34 px con preferencias de navegador predeterminadas.
- Búsqueda, categoría, vista y posición del catálogo se recuperan al volver. Estado en sesión; consultas y vista se reflejan en la URL.
- Portada móvil más breve, nombre del autor destacado y acceso directo a lectura. Índice rápido por defecto en móvil, con opción de tarjetas ilustradas. Medición a 390×844: longitud total 5.421 px frente a 17.221 de la versión inicial.
- 25 alternativas breves y descripciones visuales ampliadas revisadas contra las imágenes originales. Fuente editable: `source/image-descriptions.json`. Conservan la resolución del PDF: no se ha inventado detalle mediante escalado artificial.
- Modal de imágenes con distribución flexible para texto ampliado. Recursos CSS/JS versionados para evitar mezclar controles nuevos y código antiguo en caché.

Validación específica: `node scripts/qa-ux.cjs`, 19 comprobaciones, incluyendo ambos motores Chromium/WebKit, ancla en párrafo y en hueco, retorno al catálogo, escalado, orientación horizontal, 320 px, ampliación textual al 200 % y controles de voz con una API simulada. La prueba de voz simulada verifica estados, no la reproducción audible en un dispositivo físico. Se mantienen los 14 grupos generales, la comparación de 25 textos y los controles automáticos de accesibilidad.

Copia recuperable anterior: rama local `respaldo/antes-mejoras-ux-e98be92` y `qa/antes-mejoras-ux-e98be92.zip` (no publicados).
