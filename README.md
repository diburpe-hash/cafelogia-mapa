# Mapa Cafelogía

Mapa interactivo de cafeterías de especialidad y puntos turísticos de Andorra. Sitio estático (HTML/CSS/JS), sin build ni servidor especial — se sube tal cual al hosting.

## Probar en tu ordenador

Necesitas un servidor local simple (no basta con abrir `index.html` con doble clic, porque el navegador bloquea la carga del CSV por seguridad). Opciones:

- Con Node instalado: `npx serve .` dentro de la carpeta `Mapp`, y abre la URL que te indique.
- Con Python instalado: `python -m http.server 8080`, y abre `http://localhost:8080`.

## Actualizar los lugares (sin tocar código)

1. Sube el archivo `data/cafelogia.csv` a Google Sheets: en Sheets, `Archivo > Importar > Subir`.
2. Publica esa hoja como CSV: `Archivo > Compartir > Publicar en la web` → elige la pestaña con los datos → formato **Valores separados por comas (.csv)** → Publicar.
3. Copia la URL que te da Google y pégala en `js/config.js`, en `sheetCsvUrl: "..."`.
4. A partir de ahí, cualquier fila que agregues, edites o borres en la Sheet se refleja en el mapa la próxima vez que alguien lo cargue (no hace falta volver a subir archivos).

Columnas que debe tener la hoja (igual que `data/cafelogia.csv`): `Name, Slug, Address, Latitude, Longitude, Notes, Group, Icon, Button Link, Tags`.

- `Group` debe ser exactamente `Cafeterías de Especialidad` o `Puntos Turísticos` (si no coincide, el lugar se muestra como punto turístico por defecto).
- `Slug` es el nombre de la carpeta de fotos de ese lugar (ver abajo). Debe ser único, sin espacios ni tildes (ej. `kofi-specialty-coffee-roasters-brunch`).
- `Icon` solo aplica a `Puntos Turísticos` (las cafeterías siempre usan el logo de Cafelogía). Elige uno de estos valores según la esencia del lugar; si lo dejas vacío o escribes algo distinto, se usa el ícono de montaña por defecto:

  | Valor en `Icon` | Ícono | Úsalo para... |
  |---|---|---|
  | `foto` | cámara | monumentos, esculturas, fuentes, puentes, miradores — lugares para sacar una foto |
  | `museo` | edificio con columnas | museos |
  | `deporte` | trofeo | estadios, instalaciones deportivas |
  | `ski` | esquiador | pistas / sectores de esquí |
  | `spa` | nadador | piscinas, spas, centros termales |
  | `bus` | autobús | estaciones o paradas de transporte |
  | `shopping` | bolsa | centros comerciales |
  | `parque` | árbol | parques y zonas verdes |
  | `caminata` | persona caminando | paseos, senderos, pasarelas |
  | `bici` | bicicleta | rutas o museos de ciclismo |
  | *(vacío o no reconocido)* | montaña | valor por defecto para cualquier otro lugar |

  Si en el futuro necesitas un ícono para una categoría que no está en esta lista (por ejemplo "restaurante" o "mirador panorámico"), pídemelo: agregar un ícono nuevo requiere crear el dibujo SVG, así que es la única parte de este mantenimiento que sí necesita un cambio de código.
- `Tags` solo se muestran para cafeterías, separados por coma.
- `Button Link` es el link de Instagram (o el que quieras) que aparece como botón en el popup. Si lo dejas vacío, ese botón no aparece.
- `Latitude`/`Longitude` deben ser números normales con punto decimal (ej. `42.5075`, `1.5218`), no el formato de Google Maps con grados.

## Agregar fotos a un lugar

El popup de cada lugar muestra un slider de fotos **solo si existen archivos de imagen** para su `Slug`. No hay feed en vivo de Instagram (requiere aprobación de Meta Business por cada cuenta, inviable para tantas cafeterías) — en su lugar, subes tú manualmente 2 a 4 fotos elegidas:

1. Crea una carpeta dentro de `images/` con el mismo nombre que el `Slug` del lugar, ej. `images/rollo/`.
2. Dentro, guarda las fotos numeradas: `1.jpg`, `2.jpg`, `3.jpg`, `4.jpg` (no hace falta usar las 4, con 1 ya funciona).
3. Si no hay carpeta o fotos, el popup se ve igual que el de "ROLLO" en tus capturas de ejemplo: sin imagen, solo texto y botones.

## Cambiar el logo de las cafeterías (sin tocar código)

El ícono marrón de cafeterías usa el archivo `icons/logo-c.png`. Si en algún momento cambias el logo de Cafelogía, solo reemplaza ese archivo por el nuevo **usando el mismo nombre** (`logo-c.png`) vía FTP o el administrador de archivos de tu panel — no hace falta editar nada más, el mapa lo toma automáticamente. Recomendado: PNG cuadrado, con fondo transparente, de al menos 200x200 px.

## Subir a tu VPS con EasyPanel (una sola vez)

Tu WordPress corre en EasyPanel como una app de plantilla, dentro del proyecto **cafelogia**. Ese panel no tiene un tipo de servicio "sitio estático", así que el mapa se despliega como una **Aplicación** nueva (independiente de WordPress) usando un `Dockerfile` (ya incluido en esta carpeta) que sirve estos archivos con Nginx. El código vive en GitHub y en EasyPanel apretás "Deploy" cuando quieras publicar un cambio — nada se actualiza solo.

**Esto se hace una sola vez.** Después, actualizar los *lugares* del mapa es siempre por Google Sheets (arriba) — nunca necesitas repetir estos pasos para eso.

### 1. Subir el proyecto a GitHub

1. Crea una cuenta gratis en [github.com](https://github.com) si no tienes una.
2. Creá un repositorio nuevo (botón verde "New"), nombre por ejemplo `cafelogia-mapa`, puede ser **Private** (privado, gratis igual). No marques ninguna casilla de "agregar README".
3. En la página del repo recién creado, hacé clic en **"uploading an existing file"**.
4. Arrastrá desde la carpeta `Mapp` de tu computadora estos archivos y carpetas (no arrastres `Hoja de cálculo sin título.xlsx` ni las capturas `Captura ...PNG` ni `C.png` suelto — esos no hacen falta en el sitio publicado):
   - `index.html`
   - `Dockerfile`
   - `css/`
   - `js/`
   - `data/`
   - `icons/`
   - `images/`
5. Hacé "Commit changes" (podés dejar el mensaje que propone por defecto).

### 2. Crear el servicio en EasyPanel

1. Dentro del proyecto **cafelogia**, hacé clic en **"+ Servicio"** → **"Aplicación"**.
2. Ponele un nombre, por ejemplo `cafelogia-mapa`.
3. En la pestaña **Origen/Source**, elegí **GitHub**, conectá tu cuenta si te lo pide, y seleccioná el repositorio `cafelogia-mapa` (rama `main`).
4. EasyPanel va a detectar el `Dockerfile` solo y usarlo para construir la imagen — no hace falta tocar nada más en Build.
5. En la pestaña **Dominios**, agregá `mapa.cafelogia.com` (o el subdominio que prefieras). EasyPanel genera el certificado SSL automáticamente.
6. Guardá y hacé clic en **Deploy**.

### 3. Apuntar el subdominio (DNS)

Esto **no es un dominio nuevo ni tiene costo** — es un registro extra sobre el dominio que ya tenés.

1. Entrá al panel donde administras el DNS de `cafelogia.com` (normalmente Hostinger, en la sección "DNS / Nameservers" del dominio).
2. Agregá un registro tipo **A** con nombre `mapa` apuntando a la misma IP que ya usa `cafelogia.com` (la IP de tu VPS — la encontrás en EasyPanel, en la configuración del servidor, o mirando el registro A que ya existe para el dominio principal).
3. Esperá unos minutos a que propague, y entrá a `https://mapa.cafelogia.com` para confirmar que carga el mapa.

### 4. Cuando cambie el código del mapa (a futuro)

Si en algún momento pedís un cambio de diseño o función (no de datos, eso es por Sheets), yo te doy los archivos actualizados: los subís al mismo repositorio de GitHub (arrastrando de nuevo por "Add file > Upload files", reemplaza lo anterior) y después apretás **Deploy** en EasyPanel. Dos clics, sin instalar nada.

### 5. Agregar el botón "Mapa" en tu web de WordPress

En WordPress, sin tocar código:

1. Andá a **Apariencia > Menús** (o el editor de menú de tu tema).
2. Agregá un ítem **"Enlace personalizado"** con URL `https://mapa.cafelogia.com` y texto, por ejemplo, "Mapa" o "Encontrá una cafetería".
3. Guardá el menú. Si tu tema usa un builder de páginas (Elementor, etc.) en vez de menú clásico, es el mismo concepto: agregá un botón cuyo link sea esa URL — se abre como un enlace normal (podés marcarlo para abrir en pestaña nueva).

## Estructura del proyecto

```
index.html          Página principal
Dockerfile           Sirve el sitio con Nginx en EasyPanel (no requiere edición)
css/style.css        Estilos
js/app.js            Lógica del mapa (Leaflet, clustering, filtros, popups, geolocalización)
js/config.js         URL del CSV de Google Sheets y ajustes iniciales del mapa
data/cafelogia.csv   Copia local de los datos (respaldo si falla la Sheet, y semilla inicial)
icons/cafe.svg           Marco del marcador de cafeterías (usa logo-c.png)
icons/logo-c.png         Logo de Cafelogía mostrado en cada marcador de cafetería
icons/turismo.svg        Ícono por defecto (montaña) para puntos turísticos
icons/turismo-*.svg      Íconos temáticos para puntos turísticos (foto, museo, deporte, etc.)
images/<slug>/           Fotos opcionales por lugar, para el slider del popup
```
