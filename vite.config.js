import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `npm run build:preview` makes one self-contained HTML file (hash URLs, demo
// data) for sharing a clickable preview. `npm run build` is the real site.
export default defineConfig(({ mode }) => {
  const preview = mode === "preview";
  return {
    plugins: [react(), ...(preview ? [viteSingleFile()] : [])],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    build: preview
      ? { outDir: "preview-dist", emptyOutDir: true, assetsInlineLimit: 100000000, cssCodeSplit: false }
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                react: ["react", "react-dom", "react-router-dom"],
                radix: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-toast", "@radix-ui/react-label", "@radix-ui/react-slot"],
              },
            },
          },
        },
  };
});
