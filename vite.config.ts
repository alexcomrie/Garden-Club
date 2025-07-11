import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Create a function to dynamically load plugins
const loadPlugins = async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay()
  ];
  
  // Conditionally add Replit cartographer plugin
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographerModule = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographerModule.cartographer());
  }
  
  return plugins;
};

export default defineConfig(async () => {
  // Fix path resolution to avoid double drive prefix on Windows
  const currentDir = new URL('.', import.meta.url).pathname;
  // Remove leading slash on Windows paths that start with drive letter
  const normalizedDir = process.platform === 'win32' && currentDir.startsWith('/') ? 
    currentDir.substring(1) : currentDir;
    
  return {
    plugins: await loadPlugins(),
    // Plugins are loaded dynamically via the loadPlugins function
    resolve: {
      alias: {
        "@": path.resolve(normalizedDir, "client", "src"),
        "@shared": path.resolve(normalizedDir, "shared"),
        "@assets": path.resolve(normalizedDir, "attached_assets"),
      },
    },
    root: path.resolve(normalizedDir, "client"),
    build: {
      outDir: path.resolve(normalizedDir, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
