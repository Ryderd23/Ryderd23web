/**
 * Redes y plataformas oficiales — edita todos los enlaces aquí.
 */
export const socials = {
  spotify:
    "https://open.spotify.com/artist/3dQN7m0VNgSrMKxdEk5XGG",
  youtube: "https://www.youtube.com/@Ryderd23",
  appleMusic: "https://music.apple.com/ar/artist/ryderd23/1808337270",
  instagram: "https://instagram.com/riderd.23",
  tiktok: "https://www.tiktok.com/@ryderd__23",
  facebook: "https://www.facebook.com/Ryderd23",
} as const;

export type SocialKey = keyof typeof socials;

/** Navbar: todas las plataformas */
export const navbarSocials = [
  { id: "spotify", name: "Spotify", url: socials.spotify, icon: "spotify" as const },
  { id: "youtube", name: "YouTube", url: socials.youtube, icon: "youtube" as const },
  { id: "apple", name: "Apple Music", url: socials.appleMusic, icon: "apple" as const },
  { id: "tiktok", name: "TikTok", url: socials.tiktok, icon: "tiktok" as const },
  { id: "instagram", name: "Instagram", url: socials.instagram, icon: "instagram" as const },
] as const;

/** Hero: CTAs principales */
export const heroCtas = {
  spotify: {
    label: "ESCUCHAR EN SPOTIFY",
    url: socials.spotify,
    icon: "spotify" as const,
  },
  youtube: {
    label: "VER EN YOUTUBE",
    url: socials.youtube,
    icon: "youtube" as const,
  },
} as const;

/** Sección plataformas favoritas */
export const platformCards = [
  {
    id: "spotify",
    name: "Spotify",
    label: "SPOTIFY",
    description: "Escucha toda la discografía",
    cta: "ESCUCHAR",
    url: socials.spotify,
    color: "#1DB954",
    icon: "spotify" as const,
  },
  {
    id: "youtube",
    name: "YouTube",
    label: "YOUTUBE",
    description: "Videos oficiales y exclusivos",
    cta: "VER CANAL",
    url: socials.youtube,
    color: "#FF0000",
    icon: "youtube" as const,
  },
  {
    id: "apple",
    name: "Apple Music",
    label: "APPLE MUSIC",
    description: "Streaming en alta calidad",
    cta: "ESCUCHAR",
    url: socials.appleMusic,
    color: "#FA243C",
    icon: "apple" as const,
  },
] as const;

export const platformsSection = {
  id: "plataformas",
  eyebrow: "ESCUCHA EN",
  title: "TU PLATAFORMA FAVORITA",
} as const;

/** Sección redes sociales destacada */
export const socialFeed = {
  id: "redes",
  eyebrow: "SÍGUEME",
  title: "REDES SOCIALES",
  subtitle: "Contenido exclusivo, estrenos y detrás de cámaras",
  items: [
    {
      id: "youtube",
      name: "YouTube",
      handle: "@Ryderd23",
      url: socials.youtube,
      icon: "youtube" as const,
      stat: "Videos oficiales",
    },
    {
      id: "instagram",
      name: "Instagram",
      handle: "@riderd.23",
      url: socials.instagram,
      icon: "instagram" as const,
      stat: "Contenido diario",
    },
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@ryderd__23",
      url: socials.tiktok,
      icon: "tiktok" as const,
      stat: "Clips virales",
    },
    {
      id: "facebook",
      name: "Facebook",
      handle: "Ryderd23",
      url: socials.facebook,
      icon: "facebook" as const,
      stat: "Comunidad",
    },
  ],
} as const;

/** Contacto / Sígueme */
export const followSocials = [
  { id: "instagram", name: "Instagram", url: socials.instagram, icon: "instagram" as const },
  { id: "tiktok", name: "TikTok", url: socials.tiktok, icon: "tiktok" as const },
  { id: "spotify", name: "Spotify", url: socials.spotify, icon: "spotify" as const },
  { id: "youtube", name: "YouTube", url: socials.youtube, icon: "youtube" as const },
] as const;

/** Footer: acceso rápido a todo */
export const footerLinks = [
  { id: "spotify", label: "Spotify", url: socials.spotify, icon: "spotify" as const },
  { id: "youtube", label: "YouTube", url: socials.youtube, icon: "youtube" as const },
  { id: "apple", label: "Apple Music", url: socials.appleMusic, icon: "apple" as const },
  { id: "instagram", label: "Instagram", url: socials.instagram, icon: "instagram" as const },
  { id: "tiktok", label: "TikTok", url: socials.tiktok, icon: "tiktok" as const },
] as const;
