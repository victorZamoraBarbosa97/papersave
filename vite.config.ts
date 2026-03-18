import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function getPackagePath(packageName: string) {
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    let dir = path.dirname(require.resolve(packageName));
    while (!fs.existsSync(path.join(dir, "package.json"))) {
      dir = path.dirname(dir);
    }
    return dir;
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "imgly-offline-magic",
      enforce: "pre", // Ejecutarse ANTES que los bloqueos de Vite
      closeBundle() {
        try {
          // Copiamos los archivos automáticamente a la carpeta de producción (dist) al terminar de compilar
          const pkgDir = getPackagePath("@imgly/background-removal-data");
          const destDir = path.join(process.cwd(), "dist");
          fs.cpSync(path.join(pkgDir, "dist"), destDir, { recursive: true });

          // También copiamos los archivos del motor neuronal (ONNX) para producción
          const onnxDir = getPackagePath("onnxruntime-web");
          fs.cpSync(path.join(onnxDir, "dist"), destDir, { recursive: true });
        } catch (err) {
          console.error("[AI-Magic] Error en closeBundle:", err);
        }
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const urlPath = req.url.split("?")[0];

          // Solo interceptamos recursos específicos de la IA
          if (
            urlPath === "/resources.json" ||
            /^\/[a-f0-9]{64}$/i.test(urlPath) ||
            urlPath.includes("ort-wasm") || // <-- Interceptamos los Wasm de ONNX
            (urlPath.startsWith("/models/") &&
              !urlPath.includes("tiny_face_detector"))
          ) {
            try {
              let fileInNodeModules;

              if (urlPath.includes("ort-wasm")) {
                const onnxDir = getPackagePath("onnxruntime-web");
                fileInNodeModules = path.join(
                  onnxDir,
                  "dist",
                  urlPath.replace(/^\//, ""), // Quitamos la barra inicial
                );
              } else {
                const pkgDir = getPackagePath("@imgly/background-removal-data");
                fileInNodeModules = path.join(pkgDir, "dist", urlPath);
              }

              if (
                fs.existsSync(fileInNodeModules) &&
                fs.statSync(fileInNodeModules).isFile()
              ) {
                // ES CLAVE usar el MIME type correcto para WebAssembly
                if (urlPath.endsWith(".wasm")) {
                  res.setHeader("Content-Type", "application/wasm");
                } else if (urlPath.endsWith(".json")) {
                  res.setHeader("Content-Type", "application/json");
                } else {
                  res.setHeader("Content-Type", "application/octet-stream");
                }
                res.setHeader("Cache-Control", "public, max-age=31536000");
                res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

                const stat = fs.statSync(fileInNodeModules);
                res.setHeader("Content-Length", stat.size);

                fs.createReadStream(fileInNodeModules).pipe(res);
                return;
              }
            } catch (err) {
              console.error(`[Vite-Middleware] 💥 Error interno:`, err);
            }
          }
          next();
        });
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MB (Permite guardar los modelos pesados de IA en la caché)
        navigateFallbackDenylist: [
          /^\/models\//,
          /ort-wasm/i, // Evita que la PWA intercepte los .wasm de ONNX
          /^\/resources\.json$/,
          /^\/[a-f0-9]{64}$/i, // Evita que la PWA intercepte los fragmentos
        ], // Evita que la PWA intercepte los binarios de la IA
      },
      manifest: {
        name: "PaperSave",
        short_name: "PaperSave",
        description: "Optimiza e imprime tus fotos tamaño infantil fácilmente.",
        theme_color: "#ffffff",
        background_color: "#f8fafc",
        display: "standalone",
        icons: [
          {
            src: "favicon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Subimos el límite de advertencia a 1.5 MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/@imgly") ||
            id.includes("node_modules/face-api.js") ||
            id.includes("node_modules/onnxruntime-web")
          ) {
            return "vendor-ai";
          }
          if (
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/html-to-image")
          ) {
            return "vendor-pdf";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/zustand") ||
            id.includes("node_modules/zundo")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
});
