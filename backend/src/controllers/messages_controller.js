import User from "../models/User.js";
import Message from "../models/message.js";
import cloudinary from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../utils/socket.js";
import { config } from "../config/config.js";
import { generateAssistantReply,isAiAssistantEnabled } from "../services/aiService.js";

export async function getAllUsers(req, res) {
  try {
    const loggedInUser = req.user._id;
    const [regularUsers, aiAssistant] = await Promise.all([
      User.find({
        _id: { $ne: loggedInUser },
        isAiAssistant: { $ne: true },
      }).select("-password"),
      User.findOne({ isAiAssistant: true }).select("-password"),
    ]);

    const usersList = aiAssistant
      ? [aiAssistant, ...regularUsers]
      : regularUsers;

    return res.status(200).json(usersList);
  } catch (error) {
    console.log("Error in getAllUsers ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChats(req, res) {
  try {
    const { id: userChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userChatId },
        { senderId: userChatId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    const normalizedMessages = messages.map(normalizeMessage);

    return res.status(200).json(normalizedMessages);
  } catch (error) {
    console.log("Error in getChats ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
        chunk_size: 6000000,
        timeout: 120000,
      });

      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const messageToEmit = normalizeMessage(newMessage);

    emitMessageToParticipants(messageToEmit);

    const isAiChat =
      config.aiAssistantId &&
      receiverId?.toString() === config.aiAssistantId.toString();

    if (isAiChat) {
      handleAiAssistantReply({
        userId: senderId.toString(),
      }).catch((error) => {
        console.error("Failed to queue AI assistant reply:", error.message);
      });
    }

    return res.status(201).json(messageToEmit);
  } catch (error) {
    console.log("Error in sendMessage ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

function normalizeMessage(messageDoc) {
  const raw =
    typeof messageDoc.toObject === "function" ? messageDoc.toObject() : messageDoc;

  return {
    ...raw,
    senderId: raw.senderId.toString(),
    receiverId: raw.receiverId.toString(),
    _id: raw._id.toString(),
  };
}

function emitMessageToParticipants(message) {
  const receiverSocketId = getReceiverSocketId(message.receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", message);
  }

  const senderSocketId = getReceiverSocketId(message.senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", message);
  }
}

function mapMessageForPrompt(message) {
  if (message.text && message.text.trim()) {
    return message.text.trim();
  }

  if (message.image) {
    return "[User shared an image attachment]";
  }

  return "[User sent an empty message]";
}

async function handleAiAssistantReply({ userId }) {
  if (!config.aiAssistantId) {
    return;
  }

  const conversationHistory = await Message.find({
    $or: [
      { senderId: userId, receiverId: config.aiAssistantId },
      { senderId: config.aiAssistantId, receiverId: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(config.aiHistoryLimit)
    .lean();

  const orderedHistory = conversationHistory.reverse();

  const promptMessages = orderedHistory.map((message) => ({
    role:
      message.senderId.toString() === config.aiAssistantId ? "assistant" : "user",
    content: mapMessageForPrompt(message),
  }));

  let aiReply =
    "Hi! I'm online but the AI brain has not been configured yet. Please add a GEMINI_API_KEY in the .env file.";

  if (isAiAssistantEnabled()) {
    try {
      aiReply = await generateAssistantReply(promptMessages);
    } catch (error) {
      console.error("AI provider error:", error.message);
      
      if (error.message.includes("INVALID_MODEL")) {
        aiReply = "I'm having a configuration issue. The AI model name is incorrect. Please check the server settings - the model should be a valid Gemini model (gemini-pro, gemini-1.5-pro, or gemini-1.5-flash).";
      } else if (error.message.includes("SAFETY_FILTER")) {
        aiReply = "I couldn't process that message due to safety guidelines. Could you rephrase it?";
      } else if (error.message.includes("INSUFFICIENT_BALANCE")) {
        aiReply = "I'm currently unavailable due to insufficient account balance. Please recharge your Gemini API account to continue chatting with me!";
      } else if (error.message.includes("QUOTA_EXCEEDED")) {
        aiReply = "I'm currently unavailable due to API quota limits. Please check your Gemini API billing settings. I'll be back once the quota is restored!";
      } else if (error.message.includes("INVALID_API_KEY")) {
        aiReply = "I'm having trouble with my API configuration. Please check the GEMINI_API_KEY in the server settings.";
      } else if (error.message.includes("SERVICE_UNAVAILABLE")) {
        aiReply = "I'm experiencing temporary service issues. Please try again in a moment!";
      } else {
        aiReply = "I ran into an issue reaching my AI service. Could you try again in a bit?";
      }
    }
  }

  const lastAssistantMessage = orderedHistory
    .filter((m) => m.senderId.toString() === config.aiAssistantId)
    .slice(-1)[0];
  if (lastAssistantMessage && String(lastAssistantMessage.text || "").trim() === String(aiReply).trim()) {
    return;
  }
  await createAndEmitAiMessage({
    receiverId: userId,
    text: aiReply,
  });
}

async function createAndEmitAiMessage({ receiverId, text }) {
  const aiMessage = new Message({
    senderId: config.aiAssistantId,
    receiverId,
    text,
  });

  await aiMessage.save();

  const formattedMessage = normalizeMessage(aiMessage);

  emitMessageToParticipants(formattedMessage);
}
