import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectIndexablePage, renderDynamicSitemap, renderPublishedBookForIndexing } from "../bookIndexing";

async function sendDynamicSitemap(res: express.Response) {
  const sitemap = await renderDynamicSitemap();
  res.status(200).set({ "Content-Type": "application/xml", "Cache-Control": "no-cache" }).end(sitemap);
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
    server: serverOptions,
    appType: "custom",
  });

  app.get("/sitemap.xml", async (_req, res, next) => {
    try { await sendDynamicSitemap(res); } catch (error) { next(error); }
  });
  // Vite's history fallback returns the SPA shell before a later catch-all can
  // run. Handle book pages first so crawlers receive the title, description,
  // JSON-LD, and textual book content directly from the server in development.
  app.use(async (req, res, next) => {
    let decodedPath = req.path;
    try { decodedPath = decodeURI(req.path); } catch { /* leave malformed paths to Vite */ }
    if (!decodedPath.startsWith("/كتب-رقمية/")) return next();
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const indexingPage = await renderPublishedBookForIndexing(req.path);
      res.status(indexingPage?.status ?? 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(injectIndexablePage(template, indexingPage));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      const indexingPage = await renderPublishedBookForIndexing(req.path);
      res.status(indexingPage?.status ?? 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(injectIndexablePage(page, indexingPage));
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.get("/sitemap.xml", async (_req, res, next) => {
    try { await sendDynamicSitemap(res); } catch (error) { next(error); }
  });
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const indexingPage = await renderPublishedBookForIndexing(req.path);
      res.status(indexingPage?.status ?? 200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(injectIndexablePage(template, indexingPage));
    } catch (error) {
      next(error);
    }
  });
}
