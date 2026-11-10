import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  optimizeDeps: {
    exclude: ["box-ui-elements", "box-ui-elements/i18n/bundles/ja-JP"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-redux": path.resolve(__dirname, "./node_modules/react-redux"),
    },
  },
  server: {
    host: true,
    // ローカルは 5174 固定。v0 のプレビュー（DEV_PORT を渡す）など、ポート指定がある環境ではそちらを使う
    port: Number(process.env.DEV_PORT || process.env.PORT) || 5174,
    // 使用中のときに別のポートへ移らず、エラーで止める。
    // Box の CORS 設定（Developer Console の CORS Domains）は、ポートまで完全一致で登録するため、
    // ポートが変わると Box Explorer が 403（cors_origin_not_whitelisted）になる。
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
});
