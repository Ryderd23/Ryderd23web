/**
 * Configuración central — edita todo desde aquí.
 * Redes y plataformas: src/data/socials.ts
 */
export const site = {
  artist: {
    name: "Ryderd23",
    displayName: "RYDERD23",
    verticalLabel: "RYDERD23",
    slogan: "Con los pies en la tierra, pero la mente en el cielo.",
    tagline: "DESDE MACHALA, ECUADOR",
    city: "Machala",
    country: "Ecuador",
    genre: "Urbano / Trap / Reggaetón",
    age: 23,
    biography: `Ryderd23 nació el 23 de agosto de 2006 en los barrios bajos de Machala, Ecuador. Criado por su abuela en un entorno humilde y con oportunidades limitadas dentro de la industria musical, encontró en la música una forma de expresión, superación y libertad.

Desde muy joven mostró una fuerte conexión con la escena urbana, comenzando su camino artístico a los 13 años con su primer sencillo romántico llamado «Malos Sentimientos».

Con el tiempo evolucionó su sonido fusionando melodías emocionales, letras personales y sonidos urbanos modernos.

Entre sus lanzamientos más destacados se encuentran «Me Gustas» y «DIME» junto a Zailer La R.`,
    aboutHeading: "HISTORIA REAL, SUEÑOS REALES.",
    aboutHighlight: "REALES",
    quoteBanner: "DESDE MACHALA PARA EL MUNDO.",
  },

  logo: {
    src: "/assets/logo.png",
    alt: "Ryderd23 — logo oficial",
    width: 240,
    height: 144,
  },

  seo: {
    title: "Ryderd23 | Artista Urbano",
    description:
      "Música urbana premium desde Ecuador. Trap, reggaetón y estética cinematográfica.",
    url: "https://ryderd23.com",
    ogImage: "/assets/placeholders/og.svg",
  },

  theme: {
    bg: "#050505",
    /** Dorado del logo oficial */
    accent: "#D4AF37",
    accentLight: "#E8C547",
    accentDark: "#B8962E",
  },

  navigation: [
    { label: "INICIO", href: "#inicio" },
    { label: "SOBRE MÍ", href: "#sobre-mi" },
    { label: "LANZAMIENTO", href: "#ultimo-lanzamiento" },
    { label: "DISCOGRAFÍA", href: "#discografia" },
    { label: "VIDEOS", href: "#videos" },
    { label: "GALERÍA", href: "#galeria" },
    { label: "CONTACTO", href: "#contacto" },
  ],

  hero: {
    ctaPrimary: { label: "ESCUCHAR AHORA", href: "#ultimo-lanzamiento", icon: "play" },
    ctaSecondary: { label: "VER VIDEOS", href: "#videos" },
    heroImage: "/assets/hero-bg.webp",
    heroImageMobile: "/assets/hero-bg-mobile.webp",
    heroImageFallback: "/assets/hero-bg.png",
    watermark: "R23",
  },

  about: {
    id: "sobre-mi",
    label: "SOBRE MÍ",
    image: "/assets/about-artist.png?v=new",
    cta: { label: "CONOCER MÁS", href: "#contacto" },
  },

  /** Config de sección — canciones en src/data/music.ts */
  music: {
    id: "musica",
    eyebrow: "ÚLTIMOS LANZAMIENTOS",
    title: "NUEVA MÚSICA",
  },

  /** Videos — mismos lanzamientos que src/data/music.ts */
  videos: {
    id: "videos",
    title: "VIDEOS MUSICALES",
  },

  gallery: {
    id: "galeria",
    title: "GALERÍA",
    images: [
      { id: "3", src: "/assets/gallery/galeria-03.jpg", alt: "Galería 3" },
      { id: "1", src: "/assets/gallery/galeria-01.jpg", alt: "Sesión urbana" },
      { id: "2", src: "/assets/gallery/galeria-02.jpg", alt: "Retrato estilo street luxury" },
      { id: "4", src: "/assets/gallery/galeria-04.jpg", alt: "Galería 4" },
      { id: "5", src: "/assets/gallery/galeria-05.jpg", alt: "Galería 5" },
    ],
  },

  contact: {
    id: "contacto",
    followTitle: "SÍGUEME",
    formTitle: "BOOKING / CONTACTO",
    submitLabel: "ENVIAR MENSAJE",
    background: "/assets/contact-bg.png",
    emailjs: {
      serviceId: "service_79d9obq",
      templateId: "template_lyufu8f",
      publicKey: "jz91Yf3jrHY5Ls5tY",
    },
    messages: {
      success: "Mensaje enviado correctamente. Me pondré en contacto contigo pronto.",
      error: "No se pudo enviar el mensaje. Inténtalo nuevamente.",
    },
    fields: {
      name: { label: "Nombre", placeholder: "Tu nombre" },
      email: { label: "Correo", placeholder: "tu@email.com" },
      subject: { label: "Asunto", placeholder: "Booking, colaboración..." },
      message: { label: "Mensaje", placeholder: "Cuéntame tu propuesta..." },
    },
  },

  footer: {
    copyright: `© ${new Date().getFullYear()} Ryderd23. Todos los derechos reservados.`,
  },
} as const;

export type SiteConfig = typeof site;
