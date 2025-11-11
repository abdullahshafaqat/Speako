import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth_routes.js";
import messageRouter from "./routes/message_routes.js";
import { app, server } from "./utils/socket.js";

// ✅ CORS configuration
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const corsOptions = {
  origin: CLIENT_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Core middlewares with increased size limits
app.use(express.json({ limit: "25mb" })); 
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// ✅ Health check
app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);

// ✅ Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "../../frontend/dist");

  app.use(express.static(distPath));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
