# Catálogo musical — guía rápida

El sitio usa **dos fuentes fusionadas** para construir la discografía completa:

| Fuente | Archivo | Cuándo usarla |
|--------|---------|---------------|
| **Catálogo manual** | `src/data/releases.catalog.json` | Añadir canciones a mano, siempre disponible |
| **Sync YouTube** | `src/data/generated/youtube-tracks.json` | Actualización automática en build |

En build, ambas se **fusionan por ID de video** (sin duplicados) y se ordenan por fecha.

## Añadir una canción manualmente

Edita `src/data/releases.catalog.json` y añade un objeto al array `releases`:

```json
{
  "title": "Nombre de la canción",
  "youtube": "https://www.youtube.com/watch?v=VIDEO_ID",
  "releaseDate": "2025-03-15",
  "description": "Opcional — descripción corta",
  "thumbnailQuality": "hqdefault",
  "thumbnailObjectPosition": "center center"
}
```

Solo son obligatorios: `title`, `youtube`, `releaseDate`.

Guarda el archivo y ejecuta `pnpm build` (o `pnpm dev`). La tarjeta aparecerá automáticamente en Discografía.

## Cómo se reparten las secciones

| Sección | Qué muestra |
|---------|-------------|
| **Último Lanzamiento** | La canción con `releaseDate` más reciente |
| **Discografía** | **Todas las demás** canciones del catálogo fusionado |

> Si ves **2 canciones en Discografía**, no es un límite del grid: significa que el catálogo fusionado tiene **3 lanzamientos** y 1 está reservado para Último Lanzamiento.

## Ejemplo con 8 canciones

```
Catálogo fusionado: 8 canciones
  → Último Lanzamiento: 1 (la más reciente)
  → Discografía: 7 tarjetas
```

## Sync automático (YouTube)

```bash
pnpm sync:youtube   # Actualiza youtube-tracks.json
pnpm build          # Fusiona catálogo + sync → sitio
```

Modos de sync (en orden de preferencia):

1. **API** (`YOUTUBE_API_KEY`) — importa **todo** el historial del canal
2. **RSS** (sin API key, con `youtubeChannelId` en el catálogo) — hasta ~15 videos recientes
3. **Solo catálogo manual** — si no hay API ni RSS

Ver configuración completa en [YOUTUBE_SYNC.md](./YOUTUBE_SYNC.md).

## Personalización por canción

- **Último lanzamiento (descripción):** `src/data/latest-release.override.json`
- **Ajustes por video (thumbnail, descripción):** `src/data/track-overrides.json`

## ID del canal

En `releases.catalog.json`:

```json
"channel": {
  "handle": "Ryderd23",
  "youtubeChannelId": "UCxxxxxxxxxxxxxxxxxxxxxx"
}
```

Encuéntralo en YouTube Studio → Configuración → Canal → Configuración avanzada.
