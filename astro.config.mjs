import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://ryderd23.com",
  integrations: [tailwind()],
  build: {
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
