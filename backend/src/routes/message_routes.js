import express from "express";
const router = express.Router();
import { protectRoute } from "../middleware/auth_middleware.js";
import { getAllUsers, getChats, sendMessage } from "../controllers/messages_controller.js";

router.get("/users", protectRoute, getAllUsers);
router.get("/:id", protectRoute, getChats);

// Fix: add missing slash before :id
router.post("/send/:id", protectRoute, sendMessage);

export default router;