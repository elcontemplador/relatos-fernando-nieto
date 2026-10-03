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
