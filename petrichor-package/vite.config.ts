import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],

  build: {
    outDir: "../petrichor-dist",
  },
  ssr: {
    noExternal: [
      // this package has uncompiled .vue files
      "@smui/fab",
      "@smui-extra/bottom-app-bar",
    ],
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "src/variables.scss" as *;',
      },
    },
  },
});
