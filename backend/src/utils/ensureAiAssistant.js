import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { config } from "../config/config.js";

function buildAssistantEmail(id) {
  return `assistant-${id}@virtual.local`;
}

export async function ensureAiAssistantUser() {
  if (!config.aiAssistantId) {
    console.warn("AI assistant disabled: no AI_ASSISTANT_ID provided.");
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(config.aiAssistantId)) {
    throw new Error(
      "AI_ASSISTANT_ID must be a valid 24-character Mongo ObjectId string."
    );
  }

  const assistantObjectId = new mongoose.Types.ObjectId(config.aiAssistantId);

  let assistant = await User.findById(assistantObjectId);

  if (!assistant) {
    const hashedPassword = await bcrypt.hash(
      `${config.aiAssistantId}-${Date.now()}`,
      10
    );

    assistant = await User.create({
      _id: assistantObjectId,
      fullName: config.aiAssistantName,
      email: buildAssistantEmail(config.aiAssistantId),
      password: hashedPassword,
      profilePic: config.aiAssistantAvatar,
      isAiAssistant: true,
    });

    console.log("AI assistant user created:", assistant._id.toString());
    return assistant;
  }

  if (!assistant.isAiAssistant) {
    assistant.isAiAssistant = true;
    assistant.fullName = config.aiAssistantName;
    assistant.profilePic = config.aiAssistantAvatar;
    await assistant.save();
    console.log("Existing assistant user updated to AI assistant profile");
  }

  return assistant;
}

