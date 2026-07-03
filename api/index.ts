// Vercel Serverless Function — wraps the Express app
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Serve static frontend
import path from "path";
import fs from "fs";
const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
}

export default app;
