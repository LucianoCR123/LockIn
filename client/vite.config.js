import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host: true hace que el dev server escuche en todas las interfaces (no solo
// localhost), necesario para poder abrir la app desde el celular usando la
// IP LAN de la Mac cuando estan en la misma WiFi.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
