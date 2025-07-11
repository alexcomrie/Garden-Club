import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // This middleware should only handle HTML navigation requests.
  // Other assets (.js, .css, .tsx, images) should be handled by vite.middlewares or other specific routes.
  app.use("*", async (req, res, next) => {
    // If the request is not for HTML, or looks like a file asset Vite should handle,
    // or is an API call, let other middlewares (like Vite's) handle it.
    // This is a simplified check; a more robust check might inspect extensions or req.path.
    if (!req.accepts('html') || req.path.includes('.') || req.path.startsWith('/api')) {
      return next();
    }

    const url = req.originalUrl;
    log(`Serving index.html for ${url}`);

    try {
      // Fix path resolution to avoid double drive prefix on Windows
      const currentDir = new URL('.', import.meta.url).pathname;
      // Remove leading slash on Windows paths that start with drive letter
      const normalizedDir = process.platform === 'win32' && currentDir.startsWith('/') ? 
        currentDir.substring(1) : currentDir;
      
      const clientTemplate = path.resolve(
        normalizedDir,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Restore manual cache busting as it might be intentional for this custom server
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Fix path resolution to avoid double drive prefix on Windows
  const currentDir = new URL('.', import.meta.url).pathname;
  // Remove leading slash on Windows paths that start with drive letter
  const normalizedDir = process.platform === 'win32' && currentDir.startsWith('/') ? 
    currentDir.substring(1) : currentDir;
  
  const distPath = path.resolve(normalizedDir, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
