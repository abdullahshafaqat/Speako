import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth_routes.js";
import messageRouter from "./routes/message_routes.js";
import { app, server } from "./utils/socket.js";

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "25mb" })); 
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);

export default app;
