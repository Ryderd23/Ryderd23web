# Sincronización automática con YouTube

La sección de música del sitio se actualiza a partir de tu canal de YouTube **y** del catálogo manual en `src/data/releases.catalog.json`. Ambas fuentes se fusionan en build.

Cada vez que publicas un video nuevo y vuelves a desplegar el sitio, ese video pasa a ser **Último Lanzamiento** y los anteriores quedan en **Discografía**.

> **¿Por qué solo veo 2 canciones en Discografía?**  
> Discografía muestra **todas las canciones menos la más reciente** (esa va en Último Lanzamiento). Si el catálogo tiene 3 canciones, Discografía mostrará 2. Para ver más, añádelas en `releases.catalog.json` o configura el sync de YouTube. Ver [CATALOG.md](./CATALOG.md).

## Cómo funciona

1. Antes de cada `pnpm build`, se ejecuta `scripts/sync-youtube.mjs`.
2. El script consulta la **YouTube Data API v3** y obtiene los videos más recientes de tu canal.
3. Guarda el resultado en `src/data/generated/youtube-tracks.json`.
4. Astro usa ese archivo en build time (sin llamadas extra en el navegador del visitante).

```
Canal YouTube → API (build) → youtube-tracks.json → Último Lanzamiento + Discografía
```

## Configuración paso a paso

### 1. Crear proyecto en Google Cloud

1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (o usa uno existente).
3. Ve a **APIs y servicios → Biblioteca**.
4. Busca **YouTube Data API v3** y pulsa **Habilitar**.

### 2. Crear una API Key

1. Ve a **APIs y servicios → Credenciales**.
2. **Crear credenciales → Clave de API**.
3. Copia la clave generada.
4. (Recomendado) Edita la clave y **restringe** su uso:
   - Restricción de aplicación: según tu hosting (IP del servidor o referrers si aplica).
   - Restricción de API: solo **YouTube Data API v3**.

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env`:

```env
YOUTUBE_API_KEY=tu_clave_aqui
YOUTUBE_CHANNEL_HANDLE=Ryderd23
YOUTUBE_MAX_VIDEOS=100
```

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `YOUTUBE_API_KEY` | Sí (para sync) | Clave de la YouTube Data API v3 |
| `YOUTUBE_CHANNEL_HANDLE` | No | Handle del canal sin `@` (default: `Ryderd23`) |
| `YOUTUBE_CHANNEL_ID` | No | ID `UC...` si el handle no se resuelve |
| `YOUTUBE_MAX_VIDEOS` | No | Máximo de canciones (0 = catálogo completo, default: 100) |
| `YOUTUBE_FILTER_SHORTS` | No | `1` excluye Shorts por duración (default: `1`) |
| `YOUTUBE_SHORT_MAX_SECONDS` | No | Duración máx. para considerar Short (default: 60) |
| `YOUTUBE_SYNC_VERBOSE` | No | `1` muestra en consola qué videos se excluyen |

Tu canal: [https://www.youtube.com/@Ryderd23](https://www.youtube.com/@Ryderd23)

### 4. Sincronizar manualmente (opcional)

```bash
pnpm sync:youtube
```

### 5. Build y despliegue

```bash
pnpm build
```

En cada build con API key configurada, el catálogo se refresca automáticamente.

## Despliegue en hosting

Añade las mismas variables en el panel de tu proveedor (Vercel, Netlify, Cloudflare Pages, etc.):

- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_HANDLE` (opcional)
- `YOUTUBE_CHANNEL_ID` (opcional)

El comando de build debe ser `pnpm build` (o `npm run build`). El hook `prebuild` ejecutará la sincronización.

Si **no** configuras la API key en el hosting, el sitio usará el último `youtube-tracks.json` commiteado en el repositorio.

## Personalizar el Último Lanzamiento (sin tocar código)

Edita `src/data/latest-release.override.json`:

```json
{
  "description": "Tu texto promocional aquí. Aparece bajo el título del sencillo.",
  "titleOverride": null,
  "excludeVideoIds": [],
  "excludeTitlePatterns": [],
  "filterShorts": true,
  "shortMaxDurationSeconds": 60
}
```

| Campo | Uso |
|-------|-----|
| `description` | Texto personalizado bajo el título en Último Lanzamiento |
| `titleOverride` | Sustituir el título que viene de YouTube (dejar `null` para usar el original) |
| `excludeVideoIds` | IDs de videos que no deben importarse (ej. vlogs, directos) |
| `excludeTitlePatterns` | Patrones regex extra para excluir por título |
| `filterShorts` | Excluir videos cortos (Shorts) por duración |
| `shortMaxDurationSeconds` | Umbral en segundos para detectar Shorts (default: 60) |

Los cambios en este archivo se aplican en el siguiente build **sin** volver a editar TypeScript.

## Personalizar canciones en Discografía

Edita `src/data/track-overrides.json` usando el **ID del video** de YouTube como clave:

```json
{
  "XkxN0A8nGck": {
    "description": "Sencillo urbano con melodías emocionales...",
    "thumbnailObjectPosition": "center center"
  }
}
```

## Qué se actualiza automáticamente

| Elemento | Fuente |
|----------|--------|
| Último Lanzamiento | Video #1 (más reciente) |
| Título | Título de YouTube (limpiado) + override opcional |
| Miniatura | Thumbnail de YouTube |
| Video embebido | ID del video más reciente |
| Fecha | Fecha de publicación en YouTube |
| Discografía | Resto de canciones (miniatura, título, fecha, Ver Video) |
| Videos Musicales | Todas las canciones sincronizadas |
| Reproductor flotante | Mismo video que Último Lanzamiento |

## Filtrado automático (Shorts y contenido no musical)

El script descarga **toda la playlist de subidas** del canal y aplica filtros antes de generar la Discografía:

1. **Reels / Shorts** — formato vertical detectado en YouTube, duración ≤ 60 s, o título con `reel`, `short`, `#reels`, `#shorts`.
2. **Títulos promocionales** — teaser, trailer, promo, vlog, entrevista, directo, etc.
3. **Exclusiones manuales** — IDs en `excludeVideoIds`.
4. **Patrones personalizados** — regex en `excludeTitlePatterns`.

Para depurar qué se excluye:

```bash
YOUTUBE_SYNC_VERBOSE=1 pnpm sync:youtube
```

Si una canción legítima se filtra por error, añade su ID a una lista blanca futura o desactiva temporalmente `filterShorts` en `latest-release.override.json`.

## Rendimiento

- La API de YouTube solo se consulta **en build**, no en cada visita.
- Los visitantes reciben HTML estático; no hay peticiones extra a Google en runtime.
- Las miniaturas se sirven desde `i.ytimg.com` con `loading="lazy"` donde corresponde.

## Cuota de la API

Cada sincronización consume aproximadamente **3–10 unidades** por cada 50 videos del canal (playlist + detalles). La cuota diaria gratuita suele ser **10 000 unidades**, más que suficiente para builds normales.

## Solución de problemas

### «YOUTUBE_API_KEY no definida»

El build continúa con el cache en `src/data/generated/youtube-tracks.json`. Configura `.env` o las variables en tu hosting.

### «No se encontró el canal»

Define `YOUTUBE_CHANNEL_ID` con el ID `UC...` del canal. Lo encuentras en YouTube Studio → Configuración → Información básica → ID del canal.

### El título tiene texto extra («Official Video», etc.)

El script limpia automáticamente sufijos comunes. Si hace falta, usa `titleOverride` en `latest-release.override.json`.

### Un video no es música y no debe aparecer

Añade su ID a `excludeVideoIds` en `latest-release.override.json` y vuelve a sincronizar.

## Comandos útiles

```bash
pnpm sync:youtube   # Sincronizar ahora
pnpm build          # Sync + build estático
pnpm dev            # Desarrollo (usa el JSON ya generado)
```

Para ver datos frescos en desarrollo local, ejecuta `pnpm sync:youtube` antes de `pnpm dev`.
