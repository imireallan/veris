import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterDevTools } from "react-router-devtools";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isTest =
  typeof process !== "undefined" && process.env.TEST_MOCK === "true";
const enableRouterDevTools =
  typeof process !== "undefined" && process.env.ENABLE_ROUTER_DEVTOOLS === "true";

const plugins = [tailwindcss(), reactRouter(), tsconfigPaths()];

if (enableRouterDevTools) {
  plugins.unshift(reactRouterDevTools());
}

export default defineConfig({
  plugins,
  define: {
    __TEST_MODE__: JSON.stringify(isTest),
  },
  server: {
    host: true,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api/upload-image": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});