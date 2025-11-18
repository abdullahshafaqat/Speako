import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  aiAssistantId: process.env.AI_ASSISTANT_ID,
  aiAssistantName: process.env.AI_ASSISTANT_NAME || "SpeakBot",
  aiAssistantAvatar:
    process.env.AI_ASSISTANT_AVATAR ||
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO42z2p6t2s8Sv8gkV_R1aMeIyfmIQR_ss7w&s",
  
  aiModel: process.env.AI_MODEL || "gemini-2.5-flash",
  aiSystemPrompt:
    process.env.AI_SYSTEM_PROMPT ||
    "You are a friendly AI assistant embedded inside a private chat application. Provide concise, conversational replies and avoid mentioning that you are an AI model unless explicitly asked.",
  aiTemperature: parseNumber(process.env.AI_TEMPERATURE, 0.7),
  aiHistoryLimit: parseNumber(process.env.AI_HISTORY_LIMIT, 15),
  aiMaxOutputTokens: parseNumber(process.env.AI_MAX_OUTPUT_TOKENS, 600),
};
