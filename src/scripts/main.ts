import anime from "animejs";
import emailjs from "@emailjs/browser";
import { youtubeEmbedUrl } from "@/data/music";

const EASE = {
  out: "easeOutCubic",
  outExpo: "easeOutExpo",
  inOut: "easeInOutQuart",
  outBack: "easeOutBack",
  inOutQuad: "easeInOutQuad",
} as const;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initLoaderParticles() {
  const canvas = document.getElementById("loader-particles") as HTMLCanvasElement | null;
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  type LoaderParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    twinkle: number;
    type: "dust" | "spark";
  };

  const cx = () => canvas.width / 2;
  const cy = () => canvas.height / 2;

  const particles: LoaderParticle[] = Array.from({ length: 90 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * Math.min(canvas.width, canvas.height) * 0.45;
    return {
      x: cx() + Math.cos(angle) * dist,
      y: cy() + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.15,
      size: Math.random() * 2.5 + (Math.random() > 0.85 ? 2 : 0),
      opacity: Math.random() * 0.5 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
      type: Math.random() > 0.75 ? "spark" : "dust",
    };
  });

  let frameId = 0;
  let running = true;

  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = cx();
    const centerY = cy();

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.twinkle += 0.04;

      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(canvas.width, canvas.height) * 0.55;

      if (dist > maxDist) {
        const a = Math.atan2(dy, dx);
        p.x = centerX + Math.cos(a) * maxDist * 0.3;
        p.y = centerY + Math.sin(a) * maxDist * 0.3;
      }

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      const flicker = 0.5 + Math.sin(p.twinkle) * 0.5;
      const alpha = p.opacity * flicker;

      if (p.type === "spark") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grad.addColorStop(0, `rgba(255, 230, 150, ${alpha})`);
        grad.addColorStop(0.4, `rgba(212, 175, 55, ${alpha * 0.6})`);
        grad.addColorStop(1, "rgba(212, 175, 55, 0)");
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
        ctx.fill();
      }
    });

    frameId = requestAnimationFrame(draw);
  };

  draw();
  window.addEventListener("resize", resize);

  return () => {
    running = false;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
  };
}

function initLoader() {
  const loader = document.getElementById("page-loader");
  const bar = document.getElementById("loader-bar");
  const logo = document.getElementById("loader-logo");
  if (!loader) return;

  const stopParticles = initLoaderParticles();
  const reduced = prefersReducedMotion();
  const isMobile = window.innerWidth < 1024;

  let didHide = false;

  if (logo && !reduced) {
    anime({
      targets: logo,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 1100,
      easing: EASE.outExpo,
    });
  }

  if (!reduced) {
    anime({
      targets: ".loader-ring",
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 1100,
      delay: anime.stagger(100),
      easing: EASE.out,
    });

    if (bar) {
      anime({
        targets: bar,
        width: ["0%", "100%"],
        duration: 1600,
        easing: EASE.inOutQuad,
      });
    }
  }

  const hideLoader = () => {
    if (didHide) return;
    didHide = true;
    stopParticles?.();

    if (reduced) {
      loader.style.display = "none";
      initHeroAnimations();
      return;
    }

    const exit = anime.timeline({
      easing: EASE.inOut,
      complete: () => {
        loader.style.display = "none";
        initHeroAnimations();
      },
    });

    exit
      .add({
        targets: ".loader-content",
        opacity: [1, 0],
        scale: [1, 0.96],
        translateY: [0, -12],
        duration: 500,
      })
      .add(
        {
          targets: loader,
          opacity: [1, 0],
          duration: 550,
        },
        "-=280"
      );
  };

  if (document.readyState === "complete") {
    setTimeout(hideLoader, isMobile ? 260 : 650);
    return;
  }

  // Mobile first: no esperes al evento `load` (puede demorar mucho con imágenes).
  setTimeout(hideLoader, isMobile ? 220 : 320);
  // Fallback: si por alguna razón tardara demasiado, aseguramos que el loader cierre.
  setTimeout(hideLoader, isMobile ? 1100 : 1400);
}

function initHeroAnimations() {
  const reduced = prefersReducedMotion();
  const isMobile = window.innerWidth < 1024;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const mobileContext = isMobile || coarsePointer;
  const title = document.querySelector<HTMLElement>(".hero-title");
  const items = document.querySelectorAll<HTMLElement>("[data-hero-item]");
  const ctas = document.querySelectorAll<HTMLElement>("[data-hero-cta]");
  const scrollLine = document.querySelector<HTMLElement>(".hero-scroll-line");

  if (reduced) {
    items.forEach((el) => {
      el.style.opacity = "1";
    });
    if (title) title.style.opacity = "1";
    return;
  }

  anime.set(items, { opacity: 0 });
  if (title) {
    // En móvil evitamos `clipPath` para que el reveal sea más fluido.
    anime.set(title, {
      opacity: 0,
      ...(mobileContext ? {} : { clipPath: "inset(100% 0 0 0)" }),
    });
  }

  const tl = anime.timeline({ easing: EASE.outExpo });

  if (title) {
    if (mobileContext) {
      tl.add({
        targets: title,
        opacity: [0, 1],
        translateY: [34, 0],
        duration: 820,
        easing: EASE.inOut,
      });
    } else {
      tl.add({
        targets: title,
        opacity: [0, 1],
        translateY: [48, 0],
        clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"],
        duration: 1300,
        easing: EASE.inOut,
      });
    }
  }

  tl.add(
    {
      targets: Array.from(items).filter((el) => !el.classList.contains("hero-title")),
      opacity: [0, 1],
      translateY: [mobileContext ? 22 : 28, 0],
      delay: anime.stagger(mobileContext ? 55 : 90, { start: mobileContext ? 120 : 200 }),
      duration: mobileContext ? 700 : 950,
    },
    title ? (mobileContext ? "-=620" : "-=900") : 0
  );

  if (ctas.length) {
    tl.add(
      {
        targets: ctas,
        opacity: [0, 1],
        scale: [mobileContext ? 0.9 : 0.88, 1],
        translateY: [mobileContext ? 14 : 20, 0],
        delay: anime.stagger(mobileContext ? 40 : 70),
        duration: mobileContext ? 650 : 850,
        easing: EASE.out,
      },
      mobileContext ? "-=380" : "-=500"
    );
  }

  if (scrollLine) {
    anime({
      targets: scrollLine,
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: mobileContext ? 780 : 1000,
      delay: mobileContext ? 720 : 1200,
      easing: EASE.inOut,
    });
  }

  initHeroCtaMagnetic();
  initHeroScrollParallax();
}

function initHeroScrollParallax() {
  const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
  const hero = document.getElementById("inicio");
  if (!stage || !hero || prefersReducedMotion()) return;
  // Mobile first: el parallax suele gastar CPU en celular.
  const isMobile = window.innerWidth < 1024;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (isMobile || coarsePointer) return;

  let rafId: number | null = null;

  const update = () => {
    rafId = null;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.85)));
    stage.style.transform = `translate3d(0, ${progress * 22}px, 0)`;
  };

  const onScroll = () => {
    if (rafId != null) return;
    rafId = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

function initHeroCtaMagnetic() {
  if (prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-hero-cta]").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.12;
      anime({
        targets: btn,
        translateX: x,
        translateY: y,
        duration: 400,
        easing: "easeOutQuad",
      });
    });
    btn.addEventListener("mouseleave", () => {
      anime({
        targets: btn,
        translateX: 0,
        translateY: 0,
        duration: 600,
        easing: EASE.outExpo,
      });
    });
  });
}

type RevealPreset = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

function getRevealPreset(type: string): RevealPreset {
  const presets: Record<string, RevealPreset> = {
    up: { opacity: 0, translateX: 0, translateY: 40, scale: 1 },
    down: { opacity: 0, translateX: 0, translateY: -30, scale: 1 },
    left: { opacity: 0, translateX: -48, translateY: 0, scale: 1 },
    right: { opacity: 0, translateX: 48, translateY: 0, scale: 1 },
    scale: { opacity: 0, translateX: 0, translateY: 20, scale: 0.94 },
    fade: { opacity: 0, translateX: 0, translateY: 0, scale: 1 },
  };
  return presets[type] ?? presets.up;
}

function animateReveal(el: HTMLElement) {
  const type = el.dataset.reveal || "up";
  const delay = Number(el.dataset.revealDelay || 0);
  const duration = Number(el.dataset.revealDuration || 900);
  const isMobile = window.innerWidth < 1024;
  const durationScale = isMobile ? 0.75 : 1;
  const delayScale = isMobile ? 0.7 : 1;
  const durationAdj = Math.max(250, duration * durationScale);
  const delayAdj = delay * delayScale;
  const from = getRevealPreset(type);

  el.classList.add("is-animating");

  anime({
    targets: el,
    opacity: [from.opacity, 1],
    translateX: [from.translateX, 0],
    translateY: [from.translateY, 0],
    scale: [from.scale, 1],
    duration: durationAdj,
    delay: delayAdj,
    easing: EASE.outExpo,
    complete: () => {
      el.classList.add("is-visible");
      el.classList.remove("is-animating");
      el.style.opacity = "";
      el.style.transform = "";
    },
  });

  const line = el.querySelector<HTMLElement>("[data-reveal-line]");
  if (line) {
    anime({
      targets: line,
      scaleX: [0, 1],
      opacity: [0, 1],
      duration: isMobile ? 650 : 800,
      delay: delayAdj + (isMobile ? 120 : 200),
      easing: EASE.out,
    });
  }
}

function initScrollReveal() {
  const reduced = prefersReducedMotion();
  const singles = document.querySelectorAll<HTMLElement>(".reveal, [data-reveal]");
  const groups = document.querySelectorAll<HTMLElement>("[data-reveal-group]");
  const isMobile = window.innerWidth < 1024;
  const groupDuration = isMobile ? 650 : 850;
  const groupDelayStep = isMobile ? 80 : 100;

  if (reduced) {
    singles.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);

        if (el.dataset.revealGroup !== undefined) {
          const children = el.querySelectorAll<HTMLElement>("[data-reveal-child]");
          anime.set(children, { opacity: 0 });

          children.forEach((child, i) => {
            const type = child.dataset.reveal || "up";
            const from = getRevealPreset(type);
            anime({
              targets: child,
              opacity: [from.opacity, 1],
              translateX: [from.translateX, 0],
              translateY: [from.translateY, 0],
              scale: [from.scale, 1],
              duration: groupDuration,
              delay: i * groupDelayStep,
              easing: EASE.outExpo,
              complete: () => child.classList.add("is-visible"),
            });
          });
          el.classList.add("is-visible");
        } else {
          animateReveal(el);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -4% 0px" }
  );

  singles.forEach((el) => {
    if (!el.closest("[data-reveal-group]")) observer.observe(el);
  });

  groups.forEach((group) => observer.observe(group));
}

function initNavbar() {
  const navbar = document.querySelector<HTMLElement>("[data-navbar]");
  const links = document.querySelectorAll("[data-nav-link]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  const menuPanel = document.querySelector<HTMLElement>("[data-mobile-panel]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const iconOpen = toggle?.querySelector(".icon-open");
  const iconClose = toggle?.querySelector(".icon-close");
  const mobileLinks = document.querySelectorAll<HTMLElement>("[data-mobile-link]");
  let menuOpen = false;
  let scrollTicking = false;

  const updateNavbarOnScroll = () => {
    if (!navbar) return;
    const y = window.scrollY;
    const range = 120;
    const progress = Math.min(1, Math.max(0, y / range));
    navbar.style.setProperty("--nav-progress", progress.toFixed(3));
    navbar.classList.toggle("navbar--scrolled", y > 20);
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateNavbarOnScroll);
      }
    },
    { passive: true }
  );
  updateNavbarOnScroll();

  const sections = ["inicio", "sobre-mi", "ultimo-lanzamiento", "discografia", "videos", "galeria", "contacto"];
  // Mobile first: evitamos leer `offsetTop` en cada scroll (layout thrash).
  // Usamos IntersectionObserver para detectar la sección "activa".
  const sectionEls = sections
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el != null);

  if (sectionEls.length && "IntersectionObserver" in window) {
    const idToIndex = new Map<string, number>();
    sections.forEach((id, idx) => idToIndex.set(id, idx));

    const ratios = new Map<number, number>();
    sections.forEach((_, idx) => ratios.set(idx, 0));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = idToIndex.get((entry.target as HTMLElement).id);
          if (idx == null) return;
          ratios.set(idx, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestIdx = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        });

        links.forEach((link, i) => {
          link.classList.toggle("nav-link-active", i === bestIdx);
        });
      },
      {
        threshold: [0.2, 0.35, 0.5],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    sectionEls.forEach((el) => observer.observe(el));
  }

  const openMenu = () => {
    if (!menu || !menuPanel) return;
    menuOpen = true;
    menu.classList.add("is-open");
    menu.classList.remove("opacity-0", "pointer-events-none");
    menu.classList.add("opacity-100", "pointer-events-auto");
    iconOpen?.classList.add("hidden");
    iconClose?.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

    if (!prefersReducedMotion()) {
      anime({ targets: menuPanel, opacity: [0, 1], duration: 350, easing: EASE.out });
      anime({
        targets: mobileLinks,
        opacity: [0, 1],
        translateY: [36, 0],
        delay: anime.stagger(55, { start: 120 }),
        duration: 650,
        easing: EASE.outExpo,
      });
      anime({
        targets: "[data-mobile-social]",
        opacity: [0, 1],
        translateY: [20, 0],
        delay: 420,
        duration: 500,
        easing: EASE.out,
      });
    }
  };

  const closeMenu = () => {
    if (!menu || !menuPanel) return;
    menuOpen = false;
    document.body.classList.remove("overflow-hidden");
    iconOpen?.classList.remove("hidden");
    iconClose?.classList.add("hidden");

    const finish = () => {
      menu.classList.remove("is-open", "opacity-100", "pointer-events-auto");
      menu.classList.add("opacity-0", "pointer-events-none");
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    anime({
      targets: [...mobileLinks, "[data-mobile-social]"],
      opacity: 0,
      translateY: 16,
      duration: 250,
      easing: EASE.out,
    });
    anime({
      targets: menuPanel,
      opacity: [1, 0],
      duration: 300,
      easing: EASE.out,
      complete: finish,
    });
  };

  toggle?.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
  menu?.addEventListener("click", (e) => {
    if (e.target === menu) closeMenu();
  });
}

function initParticles() {
  const el = document.getElementById("hero-particles");
  if (!(el instanceof HTMLCanvasElement)) return;
  const canvas = el;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  const isMobile = () => window.innerWidth < 1024;
  const count = () => (isMobile() ? 18 : 32);

  let particles = createParticles(count());

  function createParticles(n: number) {
    return Array.from({ length: n }, () => ({
      x: canvas.width * (0.52 + Math.random() * 0.48),
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      o: Math.random() * 0.2 + 0.05,
    }));
  }

  // Resize throttling (mobile: evita recrear partículas en cada "micro-resize").
  let resizeRaf: number | null = null;
  const onResize = () => {
    if (resizeRaf != null) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      resize();
      particles = createParticles(count());
    });
  };
  window.addEventListener("resize", onResize, { passive: true });

  // Pausar canvas cuando el hero no está visible (mejora FPS al hacer scroll).
  const hero = document.getElementById("inicio");
  let rafId: number | null = null;
  let running = true;

  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < canvas.width * 0.5) p.x = canvas.width * (0.52 + Math.random() * 0.48);
      if (p.x > canvas.width) p.x = canvas.width * 0.52;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${p.o})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  };

  const start = () => {
    running = true;
    if (rafId != null) return;
    rafId = requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Inicio inmediato.
  start();

  if (hero && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== hero) return;
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(hero);
  }
}

function bindCoverFallback(img: HTMLImageElement) {
  const swapIfLowRes = () => {
    if (img.naturalWidth <= 0) return;
    const fallback = img.dataset.fallback;
    const fallbackAlt = img.dataset.fallbackAlt;
    if (img.naturalWidth < 320 && fallback && img.src !== fallback) {
      img.src = fallback;
      return;
    }
    if (img.naturalWidth < 200 && fallbackAlt && img.src !== fallbackAlt) {
      img.src = fallbackAlt;
    }
  };

  img.addEventListener("error", () => {
    const fallback = img.dataset.fallback;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
      return;
    }
    const alt = img.dataset.fallbackAlt;
    if (alt && img.src !== alt) img.src = alt;
  });

  if (img.complete) swapIfLowRes();
  else img.addEventListener("load", swapIfLowRes, { once: true });
}

function initMusicThumbnails() {
  document.querySelectorAll<HTMLImageElement>(".music-cover-img").forEach(bindCoverFallback);
}

function initButtonMicrointeractions() {
  if (prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll<HTMLElement>(".btn-gold, .btn-outline, [data-contact-submit]").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      anime({ targets: btn, translateY: -2, scale: 1.015, duration: 320, easing: EASE.out });
    });
    btn.addEventListener("mouseleave", () => {
      anime({ targets: btn, translateY: 0, scale: 1, duration: 420, easing: EASE.outExpo });
    });
  });

  document.querySelectorAll<HTMLElement>(".nav-link").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      anime({ targets: link, translateY: -1, duration: 280, easing: EASE.out });
    });
    link.addEventListener("mouseleave", () => {
      anime({ targets: link, translateY: 0, duration: 320, easing: EASE.out });
    });
  });
}

function initContactParallax() {
  const section = document.querySelector<HTMLElement>("[data-contact-section]");
  const img = section?.querySelector<HTMLElement>(".contact-section__img");
  if (!section || !img || prefersReducedMotion()) return;
  if (window.innerWidth < 1024 || window.matchMedia("(pointer: coarse)").matches) return;

  let rafId: number | null = null;

  const update = () => {
    rafId = null;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = Math.min(
      1,
      Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height))
    );
    img.style.transform = `scale(1.04) translate3d(0, ${(progress - 0.5) * 14}px, 0)`;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

function initAboutParallax() {
  const frame = document.querySelector<HTMLElement>(".about-artist-frame");
  const section = document.getElementById("sobre-mi");
  if (!frame || !section || prefersReducedMotion()) return;
  if (window.innerWidth < 1024) return;

  let rafId: number | null = null;

  const update = () => {
    rafId = null;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const progress = Math.min(
      1,
      Math.max(0, 1 - Math.abs(rect.top + rect.height * 0.5 - window.innerHeight * 0.5) / window.innerHeight)
    );
    frame.style.transform = `translate3d(0, ${(0.5 - progress) * 12}px, 0)`;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

function initContactEffects() {
  const section = document.querySelector<HTMLElement>("[data-contact-section]");
  const dustCanvas = document.getElementById("contact-gold-dust") as HTMLCanvasElement | null;
  const particleCanvas = document.getElementById("contact-particles") as HTMLCanvasElement | null;
  if (!section || prefersReducedMotion()) return;

  let dustRaf: number | null = null;
  let particleRaf: number | null = null;
  let dustRunning = false;
  let particleRunning = false;
  let startDust: (() => void) | null = null;
  let startParticles: (() => void) | null = null;

  const stopAll = () => {
    dustRunning = false;
    particleRunning = false;
    if (dustRaf != null) {
      cancelAnimationFrame(dustRaf);
      dustRaf = null;
    }
    if (particleRaf != null) {
      cancelAnimationFrame(particleRaf);
      particleRaf = null;
    }
  };

  const startAll = () => {
    startDust?.();
    startParticles?.();
  };

  if (dustCanvas) {
    const ctx = dustCanvas.getContext("2d");
    if (ctx) {
      const resizeDust = () => {
        dustCanvas.width = dustCanvas.offsetWidth;
        dustCanvas.height = dustCanvas.offsetHeight;
      };
      resizeDust();

      const createDust = () =>
        Array.from({ length: 48 }, () => ({
          x: Math.random() * dustCanvas.width,
          y: Math.random() * dustCanvas.height,
          s: Math.random() * 2.2 + 0.4,
          vy: Math.random() * 0.22 + 0.06,
          o: Math.random() * 0.55 + 0.12,
        }));

      let dust = createDust();

      const drawDust = () => {
        if (!dustRunning) return;
        ctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
        dust.forEach((d) => {
          d.y -= d.vy;
          if (d.y < 0) {
            d.y = dustCanvas.height;
            d.x = Math.random() * dustCanvas.width;
          }
          ctx.fillStyle = `rgba(232, 197, 87, ${d.o})`;
          ctx.fillRect(d.x, d.y, d.s, d.s);
        });
        dustRaf = requestAnimationFrame(drawDust);
      };

      startDust = () => {
        dustRunning = true;
        if (dustRaf != null) return;
        dustRaf = requestAnimationFrame(drawDust);
      };

      window.addEventListener(
        "resize",
        () => {
          resizeDust();
          dust = createDust();
        },
        { passive: true }
      );
    }
  }

  if (particleCanvas) {
    const ctx = particleCanvas.getContext("2d");
    if (ctx) {
      const resizeParticles = () => {
        particleCanvas.width = particleCanvas.offsetWidth;
        particleCanvas.height = particleCanvas.offsetHeight;
      };
      resizeParticles();

      const isMobile = () => window.innerWidth < 1024;
      const count = () => (isMobile() ? 22 : 36);

      const createParticles = (n: number) =>
        Array.from({ length: n }, () => ({
          x: Math.random() * particleCanvas.width,
          y: Math.random() * particleCanvas.height,
          r: Math.random() * 1.6 + 0.35,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.12,
          o: Math.random() * 0.28 + 0.06,
        }));

      let particles = createParticles(count());

      const drawParticles = () => {
        if (!particleRunning) return;
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = particleCanvas.width;
          if (p.x > particleCanvas.width) p.x = 0;
          if (p.y < 0) p.y = particleCanvas.height;
          if (p.y > particleCanvas.height) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${p.o})`;
          ctx.fill();
        });
        particleRaf = requestAnimationFrame(drawParticles);
      };

      startParticles = () => {
        particleRunning = true;
        if (particleRaf != null) return;
        particleRaf = requestAnimationFrame(drawParticles);
      };

      window.addEventListener(
        "resize",
        () => {
          resizeParticles();
          particles = createParticles(count());
        },
        { passive: true }
      );
    }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== section) return;
          if (entry.isIntersecting) startAll();
          else stopAll();
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(section);
  } else {
    startAll();
  }
}

function initSocialLinks() {
  if (!window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll("[data-social-link]").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const btn = link.querySelector(".social-link__btn");
      if (btn) {
        anime({
          targets: btn,
          scale: 1.1,
          duration: 450,
          easing: EASE.outBack,
        });
      }
    });
    link.addEventListener("mouseleave", () => {
      const btn = link.querySelector(".social-link__btn");
      if (btn) {
        anime({ targets: btn, scale: 1, duration: 450, easing: EASE.out });
      }
    });
  });
}

function initMusicModal() {
  const modal = document.getElementById("music-modal");
  if (!modal) return;

  const cover = document.getElementById("music-modal-cover") as HTMLImageElement | null;
  const titleEl = document.getElementById("music-modal-title");
  const platformLinks = {
    spotify: modal.querySelector<HTMLAnchorElement>('[data-music-platform="spotify"]'),
    youtube: modal.querySelector<HTMLAnchorElement>('[data-music-platform="youtube"]'),
    apple: modal.querySelector<HTMLAnchorElement>('[data-music-platform="apple"]'),
  };

  let lastFocus: HTMLElement | null = null;

  const close = () => {
    if (!modal.classList.contains("is-open")) return;

    if (!prefersReducedMotion()) {
      anime({
        targets: modal.querySelector(".music-modal__panel"),
        opacity: [1, 0],
        scale: [1, 0.96],
        translateY: [0, 12],
        duration: 320,
        easing: EASE.out,
      });
      anime({
        targets: modal,
        opacity: [1, 0],
        duration: 280,
        easing: EASE.out,
        complete: () => {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          modal.hidden = true;
          document.body.classList.remove("overflow-hidden");
          lastFocus?.focus();
        },
      });
    } else {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modal.hidden = true;
      document.body.classList.remove("overflow-hidden");
      lastFocus?.focus();
    }
  };

  const open = (btn: HTMLElement) => {
    const trackTitle = btn.dataset.title ?? "";
    const thumb = btn.dataset.thumbnail ?? "";
    const thumbFallback = btn.dataset.thumbnailFallback ?? thumb;
    const thumbFallbackAlt = btn.dataset.thumbnailFallbackAlt ?? thumbFallback;

    if (cover) {
      cover.src = thumb;
      cover.alt = trackTitle;
      cover.dataset.fallback = thumbFallback;
      cover.dataset.fallbackAlt = btn.dataset.thumbnailFallbackAlt ?? thumbFallback;
      bindCoverFallback(cover);
    }
    if (titleEl) titleEl.textContent = trackTitle;
    if (platformLinks.spotify) platformLinks.spotify.href = btn.dataset.spotify ?? "#";
    if (platformLinks.youtube) platformLinks.youtube.href = btn.dataset.youtube ?? "#";
    if (platformLinks.apple) platformLinks.apple.href = btn.dataset.apple ?? "#";

    lastFocus = btn;
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");

    if (!prefersReducedMotion()) {
      anime.set(modal, { opacity: 0 });
      anime.set(modal.querySelector(".music-modal__panel"), {
        opacity: 0,
        scale: 0.92,
        translateY: 20,
      });
      anime({ targets: modal, opacity: [0, 1], duration: 350, easing: EASE.out });
      anime({
        targets: modal.querySelector(".music-modal__panel"),
        opacity: [0, 1],
        scale: [0.92, 1],
        translateY: [20, 0],
        duration: 550,
        easing: EASE.outExpo,
        delay: 80,
      });
      anime({
        targets: modal.querySelectorAll(".music-modal__platform"),
        opacity: [0, 1],
        translateX: [-16, 0],
        delay: anime.stagger(70, { start: 280 }),
        duration: 500,
        easing: EASE.outExpo,
      });
    }

    modal.querySelector<HTMLElement>('[data-music-platform="spotify"]')?.focus();
  };

  document.querySelectorAll<HTMLElement>("[data-music-open]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn));
  });

  modal.querySelectorAll("[data-music-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

function initVideoModal() {
  const modal = document.getElementById("video-modal");
  const iframe = document.getElementById("video-modal-iframe") as HTMLIFrameElement | null;
  const titleEl = document.getElementById("video-modal-title");
  const placeholder = modal?.querySelector<HTMLElement>("[data-video-placeholder]");
  if (!modal || !iframe) return;

  let lastFocus: HTMLElement | null = null;

  const stopVideo = () => {
    iframe.src = "";
    placeholder?.classList.remove("hidden");
  };

  const close = () => {
    if (!modal.classList.contains("is-open")) return;
    stopVideo();

    if (!prefersReducedMotion()) {
      anime({
        targets: modal.querySelector(".video-modal__panel"),
        opacity: [1, 0],
        scale: [1, 0.96],
        translateY: [0, 16],
        duration: 300,
        easing: EASE.out,
      });
      anime({
        targets: modal,
        opacity: [1, 0],
        duration: 280,
        easing: EASE.out,
        complete: () => {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          modal.hidden = true;
          document.body.classList.remove("overflow-hidden");
          lastFocus?.focus();
        },
      });
    } else {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modal.hidden = true;
      document.body.classList.remove("overflow-hidden");
      lastFocus?.focus();
    }
  };

  const open = (btn: HTMLElement) => {
    const youtubeId = btn.dataset.youtubeId ?? "";
    const trackTitle = btn.dataset.title ?? "";
    if (!youtubeId) return;

    if (titleEl) titleEl.textContent = trackTitle;
    placeholder?.classList.remove("hidden");
    iframe.src = youtubeEmbedUrl(youtubeId, true);
    iframe.onload = () => placeholder?.classList.add("hidden");

    lastFocus = btn;
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");

    if (!prefersReducedMotion()) {
      anime.set(modal, { opacity: 0 });
      anime.set(modal.querySelector(".video-modal__panel"), { opacity: 0, scale: 0.94, translateY: 20 });
      anime({ targets: modal, opacity: [0, 1], duration: 350, easing: EASE.out });
      anime({
        targets: modal.querySelector(".video-modal__panel"),
        opacity: [0, 1],
        scale: [0.94, 1],
        translateY: [20, 0],
        duration: 550,
        easing: EASE.outExpo,
        delay: 60,
      });
    }

    modal.querySelector<HTMLElement>("[data-video-close]:not(.video-modal__backdrop)")?.focus();
  };

  document.querySelectorAll<HTMLElement>("[data-video-open]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn));
  });

  modal.querySelectorAll("[data-video-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

function initLatestRelease() {
  const section = document.querySelector<HTMLElement>("[data-latest-release]");
  const iframe = section?.querySelector<HTMLIFrameElement>("[data-latest-iframe]");
  if (!section || !iframe) return;

  const activatePlayer = (youtubeId: string) => {
    const facade = section.querySelector<HTMLElement>(".latest-release__player-play");
    const poster = section.querySelector<HTMLElement>(".latest-release__poster");
    const vignette = section.querySelector<HTMLElement>(".latest-release__player-vignette");
    const shine = section.querySelector<HTMLElement>(".latest-release__player-shine");

    iframe.src = youtubeEmbedUrl(youtubeId, true);
    iframe.classList.remove("hidden");
    facade?.classList.add("hidden");
    poster?.classList.add("hidden");
    vignette?.classList.add("hidden");
    shine?.classList.add("hidden");

    iframe.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  };

  section.querySelectorAll<HTMLElement>("[data-latest-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.youtubeId;
      if (id) activatePlayer(id);
    });
  });
}

function initLatestReleaseDust() {
  const section = document.querySelector<HTMLElement>("[data-latest-release]");
  const canvas = document.getElementById("latest-release-dust") as HTMLCanvasElement | null;
  if (!section || !canvas || prefersReducedMotion()) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();

  const createDust = () =>
    Array.from({ length: 32 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 1.8 + 0.3,
      vy: Math.random() * 0.2 + 0.05,
      o: Math.random() * 0.4 + 0.08,
    }));

  let dust = createDust();
  let rafId: number | null = null;
  let running = false;

  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dust.forEach((d) => {
      d.y -= d.vy;
      if (d.y < 0) d.y = canvas.height;
      ctx.fillStyle = `rgba(232, 197, 87, ${d.o})`;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    });
    rafId = requestAnimationFrame(draw);
  };

  window.addEventListener(
    "resize",
    () => {
      resize();
      dust = createDust();
    },
    { passive: true }
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== section) return;
          running = entry.isIntersecting;
          if (running && rafId == null) rafId = requestAnimationFrame(draw);
          if (!running && rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
  }
}

function initFloatingPlayer() {
  const root = document.querySelector<HTMLElement>("[data-floating-player]");
  const panel = root?.querySelector<HTMLElement>("[data-floating-panel]");
  const toggle = root?.querySelector<HTMLElement>("[data-floating-toggle]");
  const closeBtn = root?.querySelector<HTMLElement>("[data-floating-close]");
  const playBtn = root?.querySelector<HTMLElement>("[data-floating-play]");
  const iframe = root?.querySelector<HTMLIFrameElement>("[data-floating-iframe]");
  const iconPlay = playBtn?.querySelector(".floating-player__icon-play");
  const iconPause = playBtn?.querySelector(".floating-player__icon-pause");

  if (!root || !panel || !toggle || !playBtn || !iframe) return;

  const youtubeId = root.dataset.youtubeId ?? "";
  let isPlaying = false;
  let isOpen = false;

  const setPlaying = (playing: boolean) => {
    isPlaying = playing;
    playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    playBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    iconPlay?.classList.toggle("hidden", playing);
    iconPause?.classList.toggle("hidden", !playing);
    iframe.classList.toggle("hidden", !playing);

    if (playing && youtubeId) {
      iframe.src = youtubeEmbedUrl(youtubeId, true);
    } else {
      iframe.src = "";
    }
  };

  const openPanel = () => {
    isOpen = true;
    panel.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar reproductor de música");
    if (!prefersReducedMotion()) {
      anime({ targets: panel, opacity: [0, 1], translateY: [12, 0], duration: 400, easing: EASE.outExpo });
    }
  };

  const closePanel = () => {
    isOpen = false;
    setPlaying(false);
    panel.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir reproductor de música");
  };

  toggle.addEventListener("click", () => {
    if (isOpen) closePanel();
    else openPanel();
  });

  closeBtn?.addEventListener("click", closePanel);

  playBtn.addEventListener("click", () => {
    if (!isOpen) openPanel();
    setPlaying(!isPlaying);
  });
}

function initDiscographyCatalog() {
  const section = document.querySelector<HTMLElement>("[data-discography-catalog]");
  if (!section) return;

  const rows = section.querySelectorAll<HTMLElement>("[data-discography-row]");
  const dividers = section.querySelectorAll<HTMLElement>("[data-discography-divider]");

  if (prefersReducedMotion()) {
    rows.forEach((row) => row.classList.add("is-visible"));
    dividers.forEach((divider) => divider.classList.add("is-visible"));
    return;
  }

  const isMobile = window.innerWidth < 640;
  const isTablet = window.innerWidth < 1024;

  const rowObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const row = entry.target as HTMLElement;
        rowObserver.unobserve(row);

        const reversed = row.dataset.reverse === "true";
        const art = row.querySelector<HTMLElement>("[data-discography-art]");
        const content = row.querySelector<HTMLElement>("[data-discography-content]");
        const indexLine = row.querySelector<HTMLElement>("[data-discography-index-line]");

        const artFromX = isMobile ? 0 : reversed ? 64 : -64;
        const contentFromX = isMobile ? 0 : reversed ? -36 : 36;

        if (art) {
          anime({
            targets: art,
            opacity: [0, 1],
            translateX: [artFromX, 0],
            translateY: [isMobile ? 32 : isTablet ? 24 : 0, 0],
            scale: [0.94, 1],
            duration: isMobile ? 720 : 980,
            easing: EASE.outExpo,
          });
        }

        if (content) {
          anime({
            targets: content,
            opacity: [0, 1],
            translateX: [contentFromX, 0],
            translateY: [isMobile ? 24 : 28, 0],
            duration: isMobile ? 680 : 920,
            delay: isMobile ? 100 : 160,
            easing: EASE.outExpo,
          });
        }

        if (indexLine) {
          anime({
            targets: indexLine,
            scaleX: [0, 1],
            opacity: [0, 1],
            duration: isMobile ? 520 : 680,
            delay: isMobile ? 200 : 280,
            easing: EASE.out,
          });
        }

        row.classList.add("is-visible");
      });
    },
    { threshold: isMobile ? 0.12 : 0.18, rootMargin: "0px 0px -6% 0px" }
  );

  rows.forEach((row) => {
    const art = row.querySelector("[data-discography-art]");
    const content = row.querySelector("[data-discography-content]");
    if (art) anime.set(art, { opacity: 0 });
    if (content) anime.set(content, { opacity: 0 });
    rowObserver.observe(row);
  });

  const dividerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const divider = entry.target as HTMLElement;
        dividerObserver.unobserve(divider);

        const line = divider.querySelector<HTMLElement>("[data-discography-divider-line]");
        const spark = divider.querySelector<HTMLElement>("[data-discography-spark]");

        anime({
          targets: divider,
          opacity: [0, 1],
          duration: 500,
          easing: EASE.out,
        });

        if (line) {
          anime({
            targets: line,
            scaleX: [0, 1],
            opacity: [0, 1],
            duration: isMobile ? 700 : 900,
            easing: EASE.outExpo,
          });
        }

        if (spark) {
          anime({
            targets: spark,
            opacity: [0, 1],
            scale: [0.4, 1],
            duration: 600,
            delay: 200,
            easing: EASE.outExpo,
            complete: () => spark.classList.add("is-lit"),
          });
        }

        divider.classList.add("is-visible");
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -4% 0px" }
  );

  dividers.forEach((divider) => {
    anime.set(divider, { opacity: 0 });
    dividerObserver.observe(divider);
  });

  initDiscographyParallax(section);
}

function initDiscographyParallax(section: HTMLElement) {
  if (prefersReducedMotion() || window.innerWidth < 1024) return;

  const arts = section.querySelectorAll<HTMLElement>("[data-discography-art]");
  if (!arts.length) return;

  let rafId: number | null = null;

  const update = () => {
    rafId = null;
    const vh = window.innerHeight;

    arts.forEach((art) => {
      const rect = art.getBoundingClientRect();
      const center = rect.top + rect.height * 0.5;
      const dist = (center - vh * 0.5) / vh;
      const shift = Math.max(-14, Math.min(14, dist * -22));
      art.style.setProperty("--discography-parallax", `${shift.toFixed(2)}px`);
    });
  };

  const onScroll = () => {
    if (rafId != null) return;
    rafId = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initHoverAnimations() {
  if (!window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll<HTMLElement>(
    ".music-card-premium__trigger, .video-card-premium__trigger, .video-card-premium, .platform-card, .discography-catalog__row, .socials-premium__card, .latest-release__stage-frame"
  ).forEach((card) => {
    const img = card.querySelector("img");

    const isMusic = card.classList.contains("music-card-premium__trigger");
    const isVideo =
      card.classList.contains("video-card-premium") || card.classList.contains("video-card-premium__trigger");
    const isDiscography = card.classList.contains("discography-catalog__row");
    const media = card.querySelector(
      ".music-card-premium__media, .video-card-premium__media, .discography-card__media, .discography-catalog__art-frame, .latest-release__stage-frame"
    );

    card.addEventListener("mouseenter", () => {
      if ((isMusic || isVideo || isDiscography) && media) {
        anime({
          targets: media,
          scale: isDiscography ? 1.025 : 1.03,
          translateY: isDiscography ? -8 : -6,
          duration: 550,
          easing: EASE.outExpo,
        });
      } else if (card.classList.contains("socials-premium__card")) {
        anime({ targets: card, translateY: -6, duration: 450, easing: EASE.outExpo });
      } else {
        anime({ targets: card, translateY: -10, scale: 1.02, duration: 550, easing: EASE.outExpo });
      }
      if (img) {
        anime({ targets: img, scale: 1.08, duration: 700, easing: EASE.out });
      }
    });

    card.addEventListener("mouseleave", () => {
      if ((isMusic || isVideo || isDiscography) && media) {
        anime({ targets: media, scale: 1, translateY: 0, duration: 550, easing: EASE.out });
      } else if (card.classList.contains("socials-premium__card")) {
        anime({ targets: card, translateY: 0, duration: 450, easing: EASE.out });
      } else {
        anime({ targets: card, translateY: 0, scale: 1, duration: 550, easing: EASE.out });
      }
      if (img) {
        anime({ targets: img, scale: 1, duration: 600, easing: EASE.out });
      }
    });
  });

  document.querySelectorAll<HTMLElement>(".gallery-item").forEach((item) => {
    const img = item.querySelector("img");
    item.addEventListener("mouseenter", () => {
      anime({ targets: item, scale: 1.03, duration: 500, easing: EASE.out });
      if (img) anime({ targets: img, scale: 1.1, duration: 650, easing: EASE.out });
    });
    item.addEventListener("mouseleave", () => {
      anime({ targets: item, scale: 1, duration: 500, easing: EASE.out });
      if (img) anime({ targets: img, scale: 1, duration: 600, easing: EASE.out });
    });
  });
}

function initGallery() {
  const track = document.getElementById("gallery-track");
  const nextBtn = document.querySelector<HTMLButtonElement>("[data-gallery-next]");
  const prevBtn = document.querySelector<HTMLButtonElement>("[data-gallery-prev]");

  if (!track) return;

  const scrollDistance = Math.min(340, track.clientWidth * 0.85);

  // Función para actualizar visibilidad de botones
  const updateButtonVisibility = () => {
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;

    // Botón izquierda: mostrar solo si NO estamos al inicio
    if (prevBtn) {
      if (atStart) {
        prevBtn.classList.add("opacity-0", "pointer-events-none");
        prevBtn.classList.remove("opacity-100", "pointer-events-auto");
      } else {
        prevBtn.classList.remove("opacity-0", "pointer-events-none");
        prevBtn.classList.add("opacity-100", "pointer-events-auto");
      }
    }

    // Botón derecha: mostrar solo si NO estamos al final
    if (nextBtn) {
      if (atEnd) {
        nextBtn.classList.add("opacity-0", "pointer-events-none");
        nextBtn.classList.remove("opacity-100", "pointer-events-auto");
      } else {
        nextBtn.classList.remove("opacity-0", "pointer-events-none");
        nextBtn.classList.add("opacity-100", "pointer-events-auto");
      }
    }
  };

  // Listeners para los botones
  nextBtn?.addEventListener("click", () => {
    track.scrollBy({ left: scrollDistance, behavior: "smooth" });
    // Actualizar visibilidad después del scroll
    setTimeout(updateButtonVisibility, 150);
  });

  prevBtn?.addEventListener("click", () => {
    track.scrollBy({ left: -scrollDistance, behavior: "smooth" });
    // Actualizar visibilidad después del scroll
    setTimeout(updateButtonVisibility, 150);
  });

  // Listener para el scroll directo del usuario (con debounce)
  let scrollTimeout: ReturnType<typeof setTimeout>;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateButtonVisibility, 50);
  });

  // Inicializar visibilidad al cargar
  setTimeout(updateButtonVisibility, 0);

  const items = track.querySelectorAll<HTMLElement>(".gallery-item");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        if (prefersReducedMotion()) {
          el.classList.add("is-visible");
          return;
        }
        anime({
          targets: el,
          opacity: [0, 1],
          scale: [0.92, 1],
          duration: 700,
          easing: EASE.outExpo,
        });
        el.classList.add("is-visible");
      });
    },
    { threshold: 0.2, root: track }
  );

  items.forEach((item) => {
    if (!prefersReducedMotion()) {
      anime.set(item, { opacity: 0, scale: 0.92 });
    }
    observer.observe(item);
  });

  // Inicializar lightbox de galería
  initGalleryLightbox();
}

function initGalleryLightbox() {
  const modal = document.getElementById("gallery-modal") as HTMLElement | null;
  const modalImage = document.getElementById("gallery-modal-image") as HTMLImageElement | null;
  const closeBtn = document.getElementById("gallery-modal-close") as HTMLButtonElement | null;
  const prevBtn = document.getElementById("gallery-modal-prev") as HTMLButtonElement | null;
  const nextBtn = document.getElementById("gallery-modal-next") as HTMLButtonElement | null;

  if (!modal || !modalImage) return;

  const images = Array.from(document.querySelectorAll<HTMLImageElement>("[data-gallery-image]"));
  let currentImageIndex = 0;

  const showImage = (index: number) => {
    if (index < 0 || index >= images.length) return;
    currentImageIndex = index;
    const src = images[index].dataset.galleryImage;
    if (src) {
      modalImage.src = src;
      modalImage.alt = images[index].alt || "Imagen galería";
      // Animación rápida de transición entre imágenes
      anime.set(modalImage, { opacity: 0, scale: 0.97 });
      anime({
        targets: modalImage,
        opacity: 1,
        scale: 1,
        duration: 180,
        easing: "easeOutCubic",
      });
    }
  };

  const openModal = (index: number) => {
    showImage(index);
    // Mostrar modal inmediatamente sin delay
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    
    // Animar el fondo del modal
    anime.set(modal, { opacity: 0 });
    anime({
      targets: modal,
      opacity: 1,
      duration: 150,
      easing: "easeOutCubic",
    });
  };

  const closeModal = () => {
    anime({
      targets: modal,
      opacity: 0,
      duration: 150,
      easing: "easeOutCubic",
      complete: () => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
      },
    });
  };

  // Click en imágenes para abrir modal
  images.forEach((img, index) => {
    img.parentElement?.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(index);
    });
  });

  // Botón cerrar
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Click fuera de la imagen para cerrar (solo en el fondo)
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Tecla ESC para cerrar
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Botones de navegación dentro del modal
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentImageIndex - 1);
  });

  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentImageIndex + 1);
  });

  // Navegación con flechas del teclado
  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "ArrowLeft") showImage(currentImageIndex - 1);
    if (e.key === "ArrowRight") showImage(currentImageIndex + 1);
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]") as HTMLFormElement | null;
  if (!form) return;

  const successEl = form.querySelector<HTMLElement>("[data-form-success]");
  const errorEl = form.querySelector<HTMLElement>("[data-form-error]");
  const submitBtn = form.querySelector<HTMLButtonElement>("[data-contact-submit]");
  const submitIdle = form.querySelector<HTMLElement>("[data-contact-submit-idle]");
  const submitLoading = form.querySelector<HTMLElement>("[data-contact-submit-loading]");

  const serviceId =
    (import.meta.env.PUBLIC_EMAILJS_SERVICE_ID as string | undefined)?.trim() ||
    form.dataset.emailjsService?.trim() ||
    "";
  const templateId =
    (import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID as string | undefined)?.trim() ||
    form.dataset.emailjsTemplate?.trim() ||
    "";
  const publicKey =
    (import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY as string | undefined)?.trim() ||
    form.dataset.emailjsKey?.trim() ||
    "";

  const defaultErrorMessage =
    errorEl?.textContent?.trim() || "No se pudo enviar el mensaje. Inténtalo nuevamente.";

  emailjs.init({ publicKey });

  const hideFeedback = () => {
    successEl?.classList.add("hidden");
    errorEl?.classList.add("hidden");
  };

  const setLoading = (loading: boolean) => {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
    }
    submitIdle?.classList.toggle("hidden", loading);
    submitLoading?.classList.toggle("hidden", !loading);
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((field) => {
      field.disabled = loading;
    });
  };

  const revealFeedback = (el: HTMLElement) => {
    el.classList.remove("hidden");
    if (prefersReducedMotion()) {
      el.style.opacity = "1";
      return;
    }
    anime.set(el, { opacity: 0, translateY: 12 });
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 520,
      easing: EASE.outExpo,
    });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFeedback();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!serviceId || !templateId || !publicKey) {
      if (errorEl) revealFeedback(errorEl);
      return;
    }

    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const subjectRaw = String(fd.get("subject") ?? "").trim();
    const messageRaw = String(fd.get("message") ?? "").trim();
    const message = subjectRaw ? `Asunto: ${subjectRaw}\n\n${messageRaw}` : messageRaw;

    setLoading(true);

    try {
      await emailjs.send(serviceId, templateId, { name, email, message }, { publicKey });
      if (successEl) revealFeedback(successEl);
      form.reset();
    } catch {
      if (errorEl) {
        errorEl.textContent = defaultErrorMessage;
        revealFeedback(errorEl);
      }
    } finally {
      setLoading(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  initScrollReveal();
  initNavbar();
  initParticles();
  initContactEffects();
  initContactParallax();
  initAboutParallax();
  initMusicThumbnails();
  initButtonMicrointeractions();
  initSocialLinks();
  initHoverAnimations();
  initGallery();
  initMusicModal();
  initVideoModal();
  initLatestRelease();
  initLatestReleaseDust();
  initDiscographyCatalog();
  initFloatingPlayer();
  initContactForm();
});
