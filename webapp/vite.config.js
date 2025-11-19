import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,  // 外部接続許可（ngrok に必要）

    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "blushful-cletus-nonseparably.ngrok-free.dev",
    ],

    // ポートの上書きを防ぐため、明示しておく（任意）
    port: 5173,
  },
});
