import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { BG_REMOVAL_MODEL } from "./src/config/constants";

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

// Copia a `destDir` solo lo que necesita la eliminación de fondo offline:
//  - del paquete de datos de imgly: resources.json (el manifiesto) y únicamente
//    los chunks del modelo en uso y de los binarios de ONNX (el paquete trae 3
//    modelos, ~300 MB, y la app solo usa uno);
//  - de onnxruntime-web: solo los .wasm/.mjs del motor (no sus ~40 bundles .js).
function copyBackgroundRemovalAssets(destDir: string) {
  const dataDist = path.join(
    getPackagePath("@imgly/background-removal-data"),
    "dist",
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dataDist, "resources.json"), "utf-8"),
  ) as Record<string, { chunks: { name: string }[] }>;

  const wanted = Object.keys(manifest).filter(
    (key) =>
      key.startsWith("/onnxruntime-web/") ||
      key === `/models/${BG_REMOVAL_MODEL}`,
  );
  if (!wanted.some((key) => key === `/models/${BG_REMOVAL_MODEL}`)) {
    throw new Error(
      `El modelo "${BG_REMOVAL_MODEL}" no está en resources.json de @imgly/background-removal-data`,
    );
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(
    path.join(dataDist, "resources.json"),
    path.join(destDir, "resources.json"),
  );
  for (const key of wanted) {
    for (const { name } of manifest[key].chunks) {
      fs.copyFileSync(path.join(dataDist, name), path.join(destDir, name));
    }
  }

  const onnxDist = path.join(getPackagePath("onnxruntime-web"), "dist");
  for (const file of fs.readdirSync(onnxDist)) {
    if (/^ort-wasm-simd-threaded(\.jsep)?\.(wasm|mjs)$/.test(file)) {
      fs.copyFileSync(path.join(onnxDist, file), path.join(destDir, file));
    }
  }
}

// https://vite.dev/config/
let outDir = "dist";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "imgly-offline-magic",
      enforce: "pre", // Ejecutarse ANTES que los bloqueos de Vite
      configResolved(config) {
        outDir = path.resolve(config.root, config.build.outDir);
      },
      closeBundle() {
        try {
          // Copia los archivos de IA a la carpeta de producción al terminar de compilar
          copyBackgroundRemovalAssets(outDir);
        } catch (err) {
          console.error("[AI-Magic] Error en closeBundle:", err);
          // Sin estos archivos el despliegue no tendría eliminación de fondo.
          process.exitCode = 1;
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
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
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
        // PNG 192/512 (requeridos para instalar en Android/Chrome) + versión
        // "maskable" a sangre; "any" y "maskable" van separados a propósito.
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
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
