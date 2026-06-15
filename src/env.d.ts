/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** EmailJS — Service ID (opcional, sobreescribe site.ts). */
  readonly PUBLIC_EMAILJS_SERVICE_ID?: string;
  /** EmailJS — Template ID (opcional, sobreescribe site.ts). */
  readonly PUBLIC_EMAILJS_TEMPLATE_ID?: string;
  /** EmailJS — Public Key (opcional, sobreescribe site.ts). */
  readonly PUBLIC_EMAILJS_PUBLIC_KEY?: string;
}
