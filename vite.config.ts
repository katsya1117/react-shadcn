import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-redux": path.resolve(__dirname, "./node_modules/react-redux"),
    },
  },
  server: {
    host: true,
    port: 5174,
    watch: {
      usePolling: true,
    },
  },
});
