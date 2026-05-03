import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      "gallant-achievement-production-025a.up.railway.app"
    ],
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173
  }
});