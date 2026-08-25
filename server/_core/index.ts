import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { sdk } from "./sdk";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { isKnownCleanupTask, runCommerceCleanup } from "../scheduledCleanup";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { apiRateLimiter, logTrpcError, securityHeaders } from "./security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  // The managed deployment terminates TLS at one trusted proxy before Express.
  // This lets rate limiting use the real client address from X-Forwarded-For.
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.use("/api", apiRateLimiter);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/commerce-cleanup", async (req, res) => {
    let taskUid: string | undefined;
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      taskUid = user.taskUid;
    } catch {
      return res.status(403).json({ error: "cron-only" });
    }
    try {
      if (!(await isKnownCleanupTask(taskUid))) return res.json({ ok: true, skipped: "orphan" });
      const result = await runCommerceCleanup();
      return res.json({ ok: true, taskUid, ...result });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        context: { taskUid, path: "/api/scheduled/commerce-cleanup" },
        timestamp: new Date().toISOString(),
      });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, req }) {
        logTrpcError(req, path, error.message);
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
