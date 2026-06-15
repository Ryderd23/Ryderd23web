/**
 * Sincroniza el catálogo musical desde el canal de YouTube (Data API v3).
 * Ejecutar: pnpm sync:youtube  (o automáticamente en prebuild si hay API key)
 *
 * Requiere: YOUTUBE_API_KEY en .env o variables de entorno.
 * Opcional: YOUTUBE_CHANNEL_HANDLE, YOUTUBE_CHANNEL_ID, YOUTUBE_MAX_VIDEOS
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src/data/generated");
const OUT_FILE = path.join(OUT_DIR, "youtube-tracks.json");
const OVERRIDE_FILE = path.join(ROOT, "src/data/latest-release.override.json");
const CATALOG_FILE = path.join(ROOT, "src/data/releases.catalog.json");
const ENV_FILE = path.join(ROOT, ".env");

/** Títulos / formatos que indican Reels, Shorts o contenido no musical */
const DEFAULT_EXCLUDE_TITLE_PATTERNS = [
  "\\bshorts?\\b",
  "#shorts",
  "\\breels?\\b",
  "#reels?",
  "\\b(teaser|trailer|preview|snippet|promo|promoci[oó]n|anuncio|avance|coming soon|pr[oó]ximamente)\\b",
  "\\b(behind the scenes|detr[aá]s de|c[aá]maras|making of)\\b",
  "\\b(vlog|podcast|live stream|directo en vivo|streaming|en vivo)\\b",
  "\\b(entrevista|interview|q\\s*&\\s*a|charla|conversaci[oó]n)\\b",
  "\\b(reaccion|reaction|unboxing|review|reseña)\\b",
  "\\b(comercial|advertisement|publicidad|sponsor|patrocin)\\b",
];

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`YouTube API ${res.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

function cleanTitle(title) {
  return title
    .replace(
      /\s*[\|\-–—]\s*(official\s*(video|audio|visualizer)|video\s*oficial|lyric\s*video|visualizer|audio\s*oficial|video\s*lyrics?|lyrics?\s*video).*$/i,
      ""
    )
    .replace(/\s*[\|\-–—]\s*ryderd23\s*(\([^)]*\))?$/i, "")
    .replace(/^\s*ryderd23\s*[\|\-–—:]\s*/i, "")
    .replace(/\s*\(official\s*(video|audio|visualizer)[^)]*\)/gi, "")
    .replace(/\s*\(video\s*lyrics?\)/gi, "")
    .replace(/\s*\(visualizer\)/gi, "")
    .replace(/\s*\(lyric\s*video\)/gi, "")
    .replace(/\s*\[official\s*(video|audio|visualizer)[^\]]*\]/gi, "")
    .replace(/\s+#shorts\b/gi, "")
    .replace(/\s+#\w+/g, "")
    .trim();
}

function isShortOrReelTitle(title) {
  return /\b(reels?|shorts?)\b|#reels?|#shorts/i.test(title);
}

function isPromoOrSocialTitle(title) {
  const lower = title.toLowerCase();
  if (/\batentos al canal\b/.test(lower)) return true;
  if (/\b(suscr[ií]bete|subscribe|nuevo\s+contenido|estreno\s+pronto)\b/.test(lower)) return true;

  const mentions = title.match(/@[\w.]+/g) ?? [];
  const hasMusicKeyword = /(official|video|lyric|visualizer|audio|sencillo|single)/i.test(title);
  const hasSeparator = /[\|\-–—]/.test(title);

  if (mentions.length >= 2 && !hasMusicKeyword && !hasSeparator) return true;
  if (mentions.length >= 1 && title.length <= 45 && !hasMusicKeyword && !hasSeparator) return true;

  return false;
}

function bestThumbnail(thumbnails) {
  if (!thumbnails) return { url: "", quality: "hqdefault" };
  const order = ["maxres", "standard", "high", "medium", "default"];
  for (const key of order) {
    if (thumbnails[key]?.url) {
      const quality =
        key === "maxres" ? "maxresdefault" : key === "high" ? "hqdefault" : "mqdefault";
      return { url: thumbnails[key].url, quality };
    }
  }
  return { url: "", quality: "hqdefault" };
}

function formatReleaseDate(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

function parseIsoDurationSeconds(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function compilePatterns(patternStrings = []) {
  const all = [...DEFAULT_EXCLUDE_TITLE_PATTERNS, ...patternStrings];
  return all.map((source) => {
    try {
      return new RegExp(source, "i");
    } catch {
      return new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }
  });
}

function getFilterConfig(override) {
  const filterShorts =
    override.filterShorts !== false &&
    process.env.YOUTUBE_FILTER_SHORTS !== "0";
  const shortMaxSec = Math.max(
    15,
    parseInt(
      override.shortMaxDurationSeconds ??
        process.env.YOUTUBE_SHORT_MAX_SECONDS ??
        "60",
      10
    )
  );
  const titlePatterns = compilePatterns(override.excludeTitlePatterns ?? []);
  const excludeIds = new Set(override.excludeVideoIds ?? []);

  return { filterShorts, shortMaxSec, titlePatterns, excludeIds };
}

function getExcludeReason({ videoId, rawTitle, durationSec, isShort, config }) {
  if (config.excludeIds.has(videoId)) {
    return "excluido manualmente (excludeVideoIds)";
  }
  if (!rawTitle || rawTitle.toLowerCase() === "private video") {
    return "video privado";
  }
  if (rawTitle.toLowerCase() === "deleted video") {
    return "video eliminado";
  }
  if (isShortOrReelTitle(rawTitle)) {
    return "reel/short (título)";
  }
  if (isShort) {
    return "reel/short (formato vertical)";
  }
  for (const pattern of config.titlePatterns) {
    if (pattern.test(rawTitle)) {
      return `título no musical (${pattern.source})`;
    }
  }
  if (isPromoOrSocialTitle(rawTitle)) {
    return "contenido promocional o publicación social";
  }
  if (config.filterShorts && durationSec > 0 && durationSec <= config.shortMaxSec) {
    return `duración corta / reel (${durationSec}s ≤ ${config.shortMaxSec}s)`;
  }
  return null;
}

async function fetchVideoPageMeta(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Ryderd23Sync/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const lengthSec = parseInt(html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? "0", 10);
    const isShort =
      /"isShort":true|"shortsPlayerRenderer"|"reelWatchSequence"|"VIDEO_TYPE_SHORT"/.test(html) ||
      html.includes(`/shorts/${videoId}`);

    return { durationSec: lengthSec, isShort };
  } catch {
    return { durationSec: 0, isShort: false };
  }
}

async function fetchVideosMetaMap(videoIds) {
  const map = new Map();
  const batchSize = 4;

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((id) => fetchVideoPageMeta(id)));
    batch.forEach((id, idx) => map.set(id, results[idx]));
  }

  return map;
}

async function resolveChannelId(apiKey, channelId, handle) {
  if (channelId) return channelId;

  const cleanHandle = handle.replace(/^@/, "");
  const byHandle = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
  );

  if (byHandle.items?.[0]?.id) return byHandle.items[0].id;

  const bySearch = await fetchJson(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&maxResults=1&key=${apiKey}`
  );

  const found = bySearch.items?.[0]?.snippet?.channelId;
  if (found) return found;

  throw new Error(
    `No se encontró el canal "${handle}". Define YOUTUBE_CHANNEL_ID en .env con el ID UC... del canal.`
  );
}

async function fetchAllUploadPlaylistItems(apiKey, uploadsPlaylistId) {
  const items = [];
  let pageToken = "";

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const data = await fetchJson(url.toString());
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return items;
}

async function fetchVideoDetailsMap(apiKey, videoIds) {
  const map = new Map();
  const chunks = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", apiKey);

    const data = await fetchJson(url.toString());
    for (const item of data.items ?? []) {
      map.set(item.id, item);
    }
  }

  return map;
}

function buildTracksFromUploads(playlistItems, detailsMap, filterConfig, maxVideos, shortMetaMap = new Map()) {
  const tracks = [];
  const excluded = [];

  for (const item of playlistItems) {
    const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!videoId) continue;

    const rawTitle = item.snippet?.title ?? "";
    const details = detailsMap.get(videoId);
    const durationSec = parseIsoDurationSeconds(details?.contentDetails?.duration);
    const pageMeta = shortMetaMap.get(videoId);
    const isShort = pageMeta?.isShort ?? false;
    const effectiveDuration = durationSec || pageMeta?.durationSec || 0;

    const reason = getExcludeReason({
      videoId,
      rawTitle,
      durationSec: effectiveDuration,
      isShort,
      config: filterConfig,
    });
    if (reason) {
      excluded.push({ videoId, title: rawTitle, reason });
      continue;
    }

    const title = cleanTitle(rawTitle);
    if (!title) {
      excluded.push({ videoId, title: rawTitle, reason: "título vacío tras limpieza" });
      continue;
    }

    const thumbs = details?.snippet?.thumbnails ?? item.snippet?.thumbnails;
    const { url: thumbUrl, quality } = bestThumbnail(thumbs);
    const publishedAt =
      details?.snippet?.publishedAt ??
      item.contentDetails?.videoPublishedAt ??
      item.snippet?.publishedAt;

    tracks.push({
      title,
      youtube: `https://www.youtube.com/watch?v=${videoId}`,
      releaseDate: formatReleaseDate(publishedAt),
      description: "",
      thumbnail: thumbUrl,
      thumbnailQuality: quality,
      thumbnailObjectPosition: "center center",
      durationSeconds: effectiveDuration || undefined,
      kind: "video",
    });
  }

  tracks.sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  const limited = maxVideos > 0 ? tracks.slice(0, maxVideos) : tracks;

  return { tracks: limited, excluded, totalMusical: tracks.length };
}

function resolveChannelIdFromConfig() {
  const catalog = loadJson(CATALOG_FILE, {});
  return (
    process.env.YOUTUBE_CHANNEL_ID?.trim() ||
    catalog.channel?.youtubeChannelId?.trim() ||
    ""
  );
}

function resolveChannelHandle() {
  const catalog = loadJson(CATALOG_FILE, {});
  return process.env.YOUTUBE_CHANNEL_HANDLE || catalog.channel?.handle || "Ryderd23";
}

async function fetchFromRss(channelId, filterConfig) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Ryderd23SiteSync/1.0" },
  });

  if (!res.ok) {
    throw new Error(`RSS de YouTube ${res.status} para canal ${channelId}`);
  }

  const xml = await res.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const parsed = entries.map(([, entry]) => {
    const videoId =
      entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ??
      entry.match(/<id>yt:video:([^<]+)<\/id>/)?.[1] ??
      "";
    const rawTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? "";
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    return { videoId, rawTitle, published };
  });

  const videoIds = parsed.map((item) => item.videoId).filter(Boolean);
  console.log(`[sync:youtube] Detectando Reels/Shorts en ${videoIds.length} videos…`);
  const metaMap = await fetchVideosMetaMap(videoIds);

  const tracks = [];
  const excluded = [];

  for (const { videoId, rawTitle, published } of parsed) {
    if (!videoId) continue;

    const meta = metaMap.get(videoId) ?? { durationSec: 0, isShort: false };
    const reason = getExcludeReason({
      videoId,
      rawTitle,
      durationSec: meta.durationSec,
      isShort: meta.isShort,
      config: filterConfig,
    });

    if (reason) {
      excluded.push({ videoId, title: rawTitle, reason });
      continue;
    }

    const title = cleanTitle(rawTitle);
    if (!title) continue;

    tracks.push({
      title,
      youtube: `https://www.youtube.com/watch?v=${videoId}`,
      releaseDate: formatReleaseDate(published),
      description: "",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailQuality: "hqdefault",
      thumbnailObjectPosition: "center center",
      durationSeconds: meta.durationSec || undefined,
      kind: "video",
    });
  }

  tracks.sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  return { tracks, excluded, uploadsTotal: entries.length };
}

function writeSyncPayload(payload) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function logSyncSummary(tracks, excluded, source) {
  console.log(
    `[sync:youtube] OK (${source}) — ${tracks.length} canciones importadas` +
      (excluded.length ? ` (${excluded.length} excluidos)` : "") +
      ".\n" +
      `  Último lanzamiento: "${tracks[0].title}" (${tracks[0].releaseDate})\n` +
      `  Discografía: ${Math.max(0, tracks.length - 1)} lanzamientos anteriores\n` +
      `  Catálogo fusionado en build con src/data/releases.catalog.json\n` +
      `  Archivo: src/data/generated/youtube-tracks.json`
  );
}

async function syncWithRss(channelId, channelHandle, override) {
  const filterConfig = getFilterConfig(override);
  console.log(`[sync:youtube] Modo RSS (sin API key) — canal ${channelId}`);

  const { tracks, excluded, uploadsTotal } = await fetchFromRss(channelId, filterConfig);

  if (!tracks.length) {
    throw new Error("RSS no devolvió canciones válidas para este canal.");
  }

  writeSyncPayload({
    syncedAt: new Date().toISOString(),
    source: "youtube-rss",
    channelId,
    channelTitle: channelHandle,
    channelHandle: `@${channelHandle.replace(/^@/, "")}`,
    uploadsPlaylistId: "",
    stats: {
      uploadsTotal,
      musicalTotal: tracks.length,
      imported: tracks.length,
      excluded: excluded.length,
      rssLimitNote: "El feed RSS de YouTube incluye como máximo ~15 videos recientes.",
    },
    tracks,
  });

  logSyncSummary(tracks, excluded, "RSS");

  if (excluded.length > 0 && process.env.YOUTUBE_SYNC_VERBOSE === "1") {
    console.log("[sync:youtube] Excluidos (Reels, Shorts, promos…):");
    for (const row of excluded) {
      console.log(`  - ${row.title} (${row.videoId}): ${row.reason}`);
    }
  }

  console.warn(
    "[sync:youtube] Para importar TODO el catálogo histórico, configura YOUTUBE_API_KEY (docs/YOUTUBE_SYNC.md)\n" +
      "  o añade canciones manualmente en src/data/releases.catalog.json"
  );
}

async function syncWithApi(apiKey, channelHandle, channelIdEnv, maxVideos, override) {
  const filterConfig = getFilterConfig(override);

  console.log(
    `[sync:youtube] Modo API — @${channelHandle.replace(/^@/, "")}` +
      (maxVideos > 0 ? ` (máx. ${maxVideos} canciones)` : " (catálogo completo)")
  );

  const channelId = await resolveChannelId(apiKey, channelIdEnv, channelHandle);

  const channelData = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
  );

  const channel = channelData.items?.[0];
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error("No se pudo obtener la playlist de subidas del canal.");
  }

  const playlistItems = await fetchAllUploadPlaylistItems(apiKey, uploadsPlaylistId);
  console.log(`[sync:youtube] ${playlistItems.length} videos en la playlist de subidas`);

  const videoIds = playlistItems
    .map((item) => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  const detailsMap = await fetchVideoDetailsMap(apiKey, videoIds);

  const shortMaxSec = getFilterConfig(override).shortMaxSec;
  const verifyIds = videoIds.filter((id) => {
    const durationSec = parseIsoDurationSeconds(detailsMap.get(id)?.contentDetails?.duration);
    return durationSec === 0 || durationSec <= Math.max(shortMaxSec, 180);
  });
  if (verifyIds.length) {
    console.log(`[sync:youtube] Verificando Reels/Shorts en ${verifyIds.length} videos…`);
  }
  const shortMetaMap = verifyIds.length ? await fetchVideosMetaMap(verifyIds) : new Map();

  const { tracks, excluded, totalMusical } = buildTracksFromUploads(
    playlistItems,
    detailsMap,
    filterConfig,
    maxVideos,
    shortMetaMap
  );

  if (!tracks.length) {
    throw new Error(
      "No se encontraron canciones tras filtrar el canal. Revisa excludeVideoIds o excludeTitlePatterns."
    );
  }

  writeSyncPayload({
    syncedAt: new Date().toISOString(),
    source: "youtube-api-v3",
    channelId,
    channelTitle: channel?.snippet?.title ?? channelHandle,
    channelHandle: `@${channelHandle.replace(/^@/, "")}`,
    uploadsPlaylistId,
    stats: {
      uploadsTotal: playlistItems.length,
      musicalTotal: totalMusical,
      imported: tracks.length,
      excluded: excluded.length,
    },
    tracks,
  });

  logSyncSummary(tracks, excluded, "API");

  if (excluded.length > 0 && process.env.YOUTUBE_SYNC_VERBOSE === "1") {
    console.log("[sync:youtube] Excluidos:");
    for (const row of excluded.slice(0, 20)) {
      console.log(`  - ${row.title} (${row.videoId}): ${row.reason}`);
    }
    if (excluded.length > 20) {
      console.log(`  ... y ${excluded.length - 20} más`);
    }
  }
}

async function sync() {
  loadEnvFile();

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const channelHandle = resolveChannelHandle();
  const channelIdEnv = resolveChannelIdFromConfig();
  const maxVideosRaw = parseInt(process.env.YOUTUBE_MAX_VIDEOS ?? "0", 10);
  const maxVideos = Number.isFinite(maxVideosRaw) && maxVideosRaw >= 0 ? maxVideosRaw : 0;
  const override = loadJson(OVERRIDE_FILE, {});

  if (apiKey) {
    await syncWithApi(apiKey, channelHandle, channelIdEnv, maxVideos, override);
    return;
  }

  if (channelIdEnv) {
    try {
      await syncWithRss(channelIdEnv, channelHandle, override);
      return;
    } catch (err) {
      console.warn(`[sync:youtube] RSS falló: ${err.message ?? err}`);
    }
  }

  console.warn(
    "[sync:youtube] Sin API key ni RSS disponible — se usa el cache + catálogo manual.\n" +
      "  • Añade canciones en src/data/releases.catalog.json\n" +
      "  • O configura YOUTUBE_API_KEY (docs/YOUTUBE_SYNC.md)\n" +
      "  • O define channel.youtubeChannelId en releases.catalog.json para sync RSS"
  );

  if (fs.existsSync(OUT_FILE)) return;

  const catalog = loadJson(CATALOG_FILE, {});
  if (catalog.releases?.length) {
    writeSyncPayload({
      syncedAt: new Date().toISOString(),
      source: "catalog-seed",
      channelId: channelIdEnv,
      channelTitle: channelHandle,
      channelHandle: `@${channelHandle.replace(/^@/, "")}`,
      uploadsPlaylistId: "",
      stats: { uploadsTotal: 0, musicalTotal: catalog.releases.length, imported: 0, excluded: 0 },
      tracks: [],
    });
    return;
  }

  console.error("[sync:youtube] No hay cache, catálogo ni credenciales. Abortando.");
  process.exit(1);
}

sync().catch((err) => {
  console.error("[sync:youtube] Error:", err.message ?? err);
  if (fs.existsSync(OUT_FILE)) {
    console.warn("[sync:youtube] Se mantiene el cache anterior para no romper el build.");
    process.exit(0);
  }
  process.exit(1);
});
