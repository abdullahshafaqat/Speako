import dotenv from "dotenv";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

dotenv.config();

import { connectDB } from "./src/utils/db.js";
import app from "./src/app.js";
import { server } from "./src/utils/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
