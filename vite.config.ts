import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const plugins: Plugin[] = [react() as unknown as Plugin];
  if (command === "serve") {
    plugins.push(expressPlugin());
  }

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries
            react: ["react", "react-dom", "react-router-dom"],
            ui: [
              "@radix-ui/react-dialog",
              "@radix-ui/react-popover",
              "@radix-ui/react-dropdown-menu",
            ],
            utils: ["clsx", "tailwind-merge"],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      const require = createRequire(import.meta.url);
      const { createServer } = require("./server");
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
