/**
 * Música y videos — catálogo central + sync YouTube (ver docs/CATALOG.md).
 *
 * Fuentes (fusionadas por ID de video):
 * 1. src/data/releases.catalog.json  — edición manual, siempre disponible
 * 2. src/data/generated/youtube-tracks.json — sync automático (API o RSS)
 *
 * Último Lanzamiento = canción más reciente.
 * Discografía = resto del catálogo (sin duplicar el último).
 */
import { socials } from "./socials";
import releasesCatalog from "./releases.catalog.json";
import youtubeTracksData from "./generated/youtube-tracks.json";
import latestReleaseOverride from "./latest-release.override.json";
import trackOverridesRaw from "./track-overrides.json";

export type MusicTrack = {
  title: string;
  youtube: string;
  spotify: string;
  appleMusic: string;
  thumbnail: string;
  releaseDate: string;
  description?: string;
  thumbnailQuality?: "maxresdefault" | "hqdefault" | "mqdefault";
  thumbnailObjectPosition?: string;
};

export type RawRelease = Omit<MusicTrack, "spotify" | "appleMusic"> & {
  durationSeconds?: number;
  kind?: "video" | "short";
  isShort?: boolean;
};

const SHORT_REEL_PATTERN = /\b(reels?|shorts?)\b|#reels?|#shorts/i;
const SHORT_MAX_SECONDS = 60;

/** Excluye Reels/Shorts — no deben aparecer en ninguna sección del sitio. */
export function isShortOrReel(release: RawRelease): boolean {
  const url = release.youtube ?? "";
  if (/\/shorts\//i.test(url)) return true;

  const title = release.title ?? "";
  if (SHORT_REEL_PATTERN.test(title)) return true;

  if (release.kind === "short" || release.isShort === true) return true;

  const duration = release.durationSeconds;
  if (typeof duration === "number" && duration > 0 && duration <= SHORT_MAX_SECONDS) {
    return true;
  }

  return false;
}

export type YoutubeSyncMeta = {
  syncedAt: string;
  source: string;
  channelId: string;
  channelTitle: string;
  channelHandle: string;
};

type TrackOverride = {
  title?: string;
  description?: string;
  thumbnailQuality?: MusicTrack["thumbnailQuality"];
  thumbnailObjectPosition?: string;
};

type LatestReleaseOverride = {
  description?: string | null;
  titleOverride?: string | null;
  excludeVideoIds?: string[];
};

type ReleasesCatalogFile = {
  channel?: {
    handle?: string;
    youtubeChannelId?: string;
  };
  releases?: RawRelease[];
};

const catalogFile = releasesCatalog as ReleasesCatalogFile;
const trackOverrides = trackOverridesRaw as Record<string, TrackOverride | string>;
const latestOverride = latestReleaseOverride as LatestReleaseOverride;

export const catalogChannel = {
  handle: catalogFile.channel?.handle ?? "Ryderd23",
  youtubeChannelId: catalogFile.channel?.youtubeChannelId ?? "",
};

export const youtubeSyncMeta: YoutubeSyncMeta = {
  syncedAt: youtubeTracksData.syncedAt,
  source: youtubeTracksData.source,
  channelId: youtubeTracksData.channelId || catalogChannel.youtubeChannelId,
  channelTitle: youtubeTracksData.channelTitle,
  channelHandle: youtubeTracksData.channelHandle,
};

export const latestReleaseSection = {
  id: "ultimo-lanzamiento",
  eyebrow: "NUEVO SENCILLO",
  title: "ÚLTIMO LANZAMIENTO",
  badge: "Lanzamiento oficial",
  ctaPlay: "REPRODUCIR AHORA",
} as const;

export const discographySection = {
  id: "discografia",
  eyebrow: "CATÁLOGO OFICIAL",
  title: "DISCOGRAFÍA",
  cta: {
    label: "VER EN SPOTIFY",
    href: socials.spotify,
  },
} as const;

export const videosSection = {
  id: "videos",
  title: "VIDEOS MUSICALES",
  eyebrow: "VIDEOCLIPS",
  cta: {
    label: "VER MÁS",
    href: socials.youtube,
  },
} as const;

export function extractYoutubeId(url: string): string {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/
  );
  return match?.[1] ?? "";
}

export function youtubeThumbnail(
  url: string,
  quality: "maxresdefault" | "hqdefault" | "mqdefault" = "maxresdefault"
): string {
  const id = extractYoutubeId(url);
  if (!id) return "";
  return `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
}

export function youtubeEmbedUrl(youtubeId: string, autoplay = false): string {
  if (!youtubeId) return "";
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

export function normalizeYoutubeUrl(url: string): string {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}

function getTrackOverride(videoId: string): TrackOverride | undefined {
  const entry = trackOverrides[videoId];
  if (!entry || typeof entry === "string") return undefined;
  return entry;
}

function withPlatformLinks(track: RawRelease): MusicTrack {
  const videoId = extractYoutubeId(track.youtube);
  const perTrack = videoId ? getTrackOverride(videoId) : undefined;

  return {
    ...track,
    title: perTrack?.title ?? track.title,
    description: perTrack?.description ?? track.description,
    thumbnailQuality: perTrack?.thumbnailQuality ?? track.thumbnailQuality,
    thumbnailObjectPosition:
      perTrack?.thumbnailObjectPosition ?? track.thumbnailObjectPosition ?? "center center",
    spotify: socials.spotify,
    appleMusic: socials.appleMusic,
  };
}

/** Fusiona catálogo manual + datos sincronizados de YouTube (sin duplicados). */
export function mergeReleaseSources(
  catalog: RawRelease[] = [],
  synced: RawRelease[] = []
): RawRelease[] {
  const byId = new Map<string, RawRelease>();

  for (const entry of catalog) {
    const id = extractYoutubeId(entry.youtube);
    if (!id || !entry.title?.trim()) continue;
    byId.set(id, { ...entry });
  }

  for (const entry of synced) {
    const id = extractYoutubeId(entry.youtube);
    if (!id || !entry.title?.trim()) continue;

    const manual = byId.get(id);
    byId.set(id, {
      ...manual,
      ...entry,
      title: manual?.title?.trim() ? manual.title : entry.title,
      description: manual?.description?.trim() ? manual.description : entry.description ?? "",
      releaseDate: entry.releaseDate || manual?.releaseDate || "",
      thumbnail: entry.thumbnail || manual?.thumbnail || "",
      thumbnailQuality: manual?.thumbnailQuality ?? entry.thumbnailQuality,
      thumbnailObjectPosition:
        manual?.thumbnailObjectPosition ?? entry.thumbnailObjectPosition ?? "center center",
    });
  }

  return [...byId.values()]
    .filter((release) => !isShortOrReel(release))
    .filter((release) => !(latestOverride.excludeVideoIds ?? []).includes(extractYoutubeId(release.youtube)))
    .sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
}

function loadRawTracks(): MusicTrack[] {
  const catalog = catalogFile.releases ?? [];
  const synced = youtubeTracksData.tracks ?? [];
  const merged = mergeReleaseSources(catalog, synced);

  if (!merged.length) {
    throw new Error(
      "No hay lanzamientos. Añade canciones en src/data/releases.catalog.json o ejecuta pnpm sync:youtube"
    );
  }

  return merged.map(withPlatformLinks);
}

export const tracks: MusicTrack[] = loadRawTracks();

export function enrichTrack(track: MusicTrack) {
  const youtubeId = extractYoutubeId(track.youtube);
  const quality = track.thumbnailQuality ?? "hqdefault";
  const primary = track.thumbnail || youtubeThumbnail(track.youtube, quality);
  const fallback =
    quality === "maxresdefault"
      ? youtubeThumbnail(track.youtube, "hqdefault")
      : youtubeThumbnail(track.youtube, "mqdefault");
  const fallbackAlt = youtubeThumbnail(track.youtube, "mqdefault");

  return {
    ...track,
    youtubeId,
    thumbnail: primary,
    thumbnailFallback: fallback,
    thumbnailFallbackAlt: fallbackAlt,
    thumbnailObjectPosition: track.thumbnailObjectPosition ?? "center center",
    embedUrl: youtubeEmbedUrl(youtubeId),
    youtube: normalizeYoutubeUrl(track.youtube),
  };
}

export function getSortedTracks(limit?: number) {
  const sorted = tracks.map(enrichTrack);
  return limit ? sorted.slice(0, limit) : sorted;
}

function applyLatestOverride<T extends ReturnType<typeof enrichTrack>>(track: T): T {
  const titleOverride = latestOverride.titleOverride?.trim();
  const descriptionOverride = latestOverride.description?.trim();

  return {
    ...track,
    title: titleOverride || track.title,
    description: descriptionOverride || track.description,
  };
}

/** Canción más reciente — Último Lanzamiento y reproductor flotante. */
export function getFeaturedTrack() {
  const latest = getSortedTracks()[0];
  if (!latest) return null;
  return applyLatestOverride(latest);
}

export function getLatestTrack() {
  return getFeaturedTrack();
}

/**
 * Discografía: todos los lanzamientos excepto el más reciente
 * (que se muestra en la sección «Último Lanzamiento»).
 */
export function getDiscographyTracks(limit?: number) {
  const rest = getSortedTracks().slice(1);
  return limit ? rest.slice(0, limit) : rest;
}

/** @deprecated Usar discographySection */
export const musicSection = discographySection;
