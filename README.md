# PlugSaurus — web oficial

Web estática (HTML + CSS + JavaScript, sin dependencias ni compilación). Todo el catálogo sale de **`data/products.json`**: añadir, quitar o cambiar un plugin es editar ese archivo. Los pagos y las descargas los gestiona **Gumroad**: la web no guarda datos de clientes ni procesa pagos.

```
plugsaurus-web/
├── index.html            Home
├── plugins.html          Catálogo con filtros (todos / free / premium / categoría / búsqueda)
├── plugin.html           Página individual: plugin.html?id=<id del producto>
├── free.html             Sección de plugins gratuitos
├── 404.html
├── data/
│   ├── products.json     ← CATÁLOGO (lo único que tocas para añadir plugins)
│   └── site.json         ← Instagram, tienda de Gumroad y sincronización
├── assets/
│   ├── css/styles.css    Diseño (colores de marca al principio, en :root)
│   ├── js/catalog.js     Carga products.json (+ sincronización con Gumroad, opcional)
│   ├── js/app.js         Pinta tarjetas, páginas, filtros…
│   ├── img/              Logo, favicons e imágenes de producto (WebP)
│   └── video/            Demos y reels
├── tools/
│   ├── prepare_assets.py Convierte tus PNG/MP4 originales a formato web
│   ├── sync_gumroad.py   Descarga tus productos de la API oficial de Gumroad
│   └── build_sitemap.py  Genera sitemap.xml y robots.txt
└── .github/workflows/sync-gumroad.yml   Sincronización diaria automática (opcional)
```

## Verla en tu ordenador

Necesita un mini servidor (los navegadores bloquean `fetch` de archivos locales). Con Python, que ya tienes:

```bash
cd C:\Users\cex\Desktop\CLAUDE\plugsaurus-web
python -m http.server 8765
```

Abre http://localhost:8765

## Añadir un plugin nuevo

1. Copia las imágenes a `assets/img/products/` (mejor en `.webp`; ideal: miniatura cuadrada 720×720 y portada 16:9). Si las tienes en PNG, añádelas a la lista `IMAGES` de `tools/prepare_assets.py` y ejecuta `python tools/prepare_assets.py`.
2. En `data/products.json`, copia el bloque de un producto parecido, pégalo dentro de `"products": [ ... ]` (separado por una coma) y cambia los campos:

| Campo | Qué es |
|---|---|
| `id` | Identificador único, en minúsculas y con guiones. Forma la URL: `plugin.html?id=este-id` |
| `name`, `tagline`, `description`, `longDescription` | Nombre, frase corta, resumen de la tarjeta y párrafos de la página |
| `price`, `currency` | Precio (número, `0` si es gratis) y moneda: `USD` o `EUR` |
| `type` | `FREE` o `PREMIUM` |
| `category` | Categoría del filtro (p. ej. `Vocals`, `Clipper`, `Saturation`, `Reverb`). Una categoría nueva aparece sola en los filtros |
| `image`, `cover`, `gallery` | Miniatura de la tarjeta, imagen grande y galería |
| `videos` | Lista de demos `{ "src", "poster", "title", "vertical": true/false }` (puede quedar `[]`) |
| `gumroadUrl` | Enlace de Gumroad: `https://dreamboyz.gumroad.com/l/<permalink>` |
| `gumroadPermalink` | La parte final de ese enlace (sirve para la sincronización) |
| `compatibility` | `os`, `formats` y `daws` |
| `features` | Lista de características. Si empiezan en MAYÚSCULAS seguidas de `:` se resaltan |
| `license`, `notes` | Texto de licencia y avisos (p. ej. Mac sin notarizar) |
| `status` | `published` (se puede comprar), `coming-soon` (se ve, botón desactivado), `hidden` (no se ve) |
| `featured` | `true` para que salga en "Apex predators" de la home |
| `freeVersion` / `fullVersion` | `id` de su versión gratis/completa: crea el enlace cruzado "Try it free" / "Unlock everything" |
| `accent` | Color del plugin (brillo de la tarjeta y botón de compra) |
| `order` | Orden en los listados (menor = antes) |

3. Guarda y recarga. Para comprobar que el JSON es válido: `python -c "import json;json.load(open('data/products.json',encoding='utf8'));print('OK')"`

## Cambiar enlaces o precios

- **Precio / enlace de un plugin** → `data/products.json`, campos `price`, `currency`, `gumroadUrl`.
- **Instagram y tienda de Gumroad** → `data/site.json`, bloque `social`.
- **Publicar algo que estaba "coming soon"** → pon `"status": "published"` y rellena `gumroadUrl`.
- **Ir directo al checkout** (opcional) → en `site.json`, `"buyParams": "wanted=true"` añade ese parámetro a todos los botones de compra.

## Publicar gratis

### Opción recomendada: GitHub Pages (gratis, sin tarjeta)

1. Crea una cuenta gratuita en github.com (si no la tienes).
2. Crea un repositorio nuevo **público**, por ejemplo `plugsaurus` (Pages es gratis en repos públicos; el código de la web no contiene nada privado).
3. Sube el contenido de esta carpeta. Lo más fácil: en el repo, *Add file → Upload files* y arrastra todo lo de `plugsaurus-web` (incluida la carpeta `.github`). O con Git:
   ```bash
   cd C:\Users\cex\Desktop\CLAUDE\plugsaurus-web
   git init
   git add .
   git commit -m "PlugSaurus web v1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/plugsaurus.git
   git push -u origin main
   ```
4. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
5. En 1–2 minutos estará en `https://TU_USUARIO.github.io/plugsaurus/`. Pon esa dirección en `data/site.json` → `siteUrl` y en la bio de Instagram.

### Alternativa: Cloudflare Pages (gratis)

dash.cloudflare.com → Workers & Pages → Create → Pages → conectar el repositorio de GitHub (o *Upload assets* arrastrando la carpeta). Sin comando de build; carpeta de salida `/`. Dirección: `https://plugsaurus.pages.dev` (si el nombre está libre). Ventaja: la dirección queda en la raíz y la página 404 se ve perfecta.

> Ninguna de las dos opciones pide tarjeta ni cobra por una web estática como esta. Más adelante puedes conectar un dominio propio si lo compras, pero no es necesario.

## Sincronización automática con Gumroad (activada en la web; falta el token)

**Qué ofrece Gumroad oficialmente** (comprobado en su API y en su código abierto):
- **API v2** (`https://api.gumroad.com/v2/products`): devuelve tus productos con nombre, descripción, precio, moneda, enlace, miniatura y si están publicados. Gratis. Requiere un *access token* personal.
- **Webhooks** (*resource subscriptions* y *Ping*): solo avisan de ventas, reembolsos, cancelaciones y disputas. **No existe un aviso de "producto creado/actualizado"**, así que la detección de productos nuevos se hace consultando la API periódicamente.

**Cómo está montado:** el workflow `.github/workflows/sync-gumroad.yml` ejecuta `tools/sync_gumroad.py` una vez al día (y cuando tú quieras desde la pestaña *Actions*). El script guarda `data/gumroad-sync.json` y hace commit; GitHub Pages se republica sola. La web fusiona ese archivo con `products.json`:
- Actualiza **nombre, precio, moneda, estado y enlace** de los productos que coinciden por `gumroadPermalink` (configurable en `site.json → gumroad.sync.updateFields`).
- Un producto **nuevo publicado** en Gumroad aparece solo en la web con su portada, precio y enlace, aunque no esté en `products.json`. Después puedes añadirlo a `products.json` para darle galería, vídeos y características.
- Textos largos, imágenes y características siguen saliendo de `products.json` (Gumroad no da las características en formato estructurado).
- Para que Gumroad no toque un producto concreto: `"syncLocked": true` en ese producto.

**Para activarla:**
1. Gumroad → **Settings → Advanced → Applications → Create application** (nombre: PlugSaurus web; *Redirect URI*: la URL de tu web). Después pulsa **Generate access token** y copia el token.
2. GitHub → tu repo → **Settings → Secrets and variables → Actions → New repository secret**: nombre `GUMROAD_ACCESS_TOKEN`, valor el token. (El token queda cifrado en GitHub; nunca va en el código).
3. (Ya hecho) `data/site.json` tiene `"enabled": true`. Mientras no exista el token, `data/gumroad-sync.json` está vacío y la web usa solo `products.json`.
4. Pestaña **Actions → Sync Gumroad products → Run workflow** para la primera sincronización.

Coste: 0 €. En repos públicos los minutos de GitHub Actions son gratuitos; la tarea dura segundos.

## Notas técnicas
- Las páginas de producto se generan en el navegador (`plugin.html?id=…`). Google las indexa, pero si en el futuro quieres URLs tipo `/plugins/stomposaurus/`, se puede añadir un paso de generación estática al mismo workflow.
- Fuentes: Google Fonts (Chakra Petch + Inter). Si prefieres no cargar nada externo, borra las 3 líneas `fonts.googleapis` de cada HTML y se usará la fuente del sistema.
- Las imágenes originales nunca se modifican: `prepare_assets.py` solo lee de tus carpetas de marketing y escribe copias optimizadas aquí.

## Promociones con fecha (Black Friday, etc.)

En `data/site.json` → `promos`. Cada promoción tiene `start` y `end` (con zona horaria, p. ej. `+01:00` para España en invierno) y la lista de productos que cambian (`price`, y opcionalmente `regularPrice` para mostrar el precio tachado). La web la **activa y desactiva sola** entre esas fechas: barra superior con cuenta atrás, sección en la home, sello "Black Friday" y botones de descarga gratis. No hace falta publicar nada el día de la promo.

- Vista previa antes de tiempo: añade `?promo=<id>` a la URL, por ejemplo `index.html?promo=black-friday-2026`.
- Importante: la web solo muestra la oferta. El precio real lo marca Gumroad, así que cambia allí el precio (y publica el producto) a la misma hora.
