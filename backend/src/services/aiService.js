import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/config.js";

let geminiClient = null;

if (config.geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
}

export const isAiAssistantEnabled = () => Boolean(geminiClient && config.aiAssistantId);


const VALID_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "models/gemini-2.5-flash",
  "models/gemini-2.5-pro",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro",
  "models/gemini-pro",
];

async function tryGenerateWithModel(modelName, geminiHistory, currentUserMessage) {

  const modelConfig = {
    model: modelName,
    generationConfig: {
      temperature: config.aiTemperature,
      maxOutputTokens: config.aiMaxOutputTokens,
    },
  };
  
  
  if (modelName.includes("1.5") || modelName.includes("2.0") || modelName.includes("2.5")) {
    modelConfig.systemInstruction = config.aiSystemPrompt;
  }
  
  const model = geminiClient.getGenerativeModel(modelConfig);

  
  const chat = model.startChat({
    history: geminiHistory,
  });

 
  const result = await chat.sendMessage(currentUserMessage);
  const response = await result.response;
  const aiMessage = response.text().trim();

  if (!aiMessage) {
    throw new Error("AI provider returned an empty response");
  }

  return aiMessage;
}

export async function generateAssistantReply(conversationMessages) {
  if (!geminiClient) {
    throw new Error("Gemini client is not configured. Provide GEMINI_API_KEY in the .env file.");
  }

  try {
    
    const geminiHistory = [];
    let currentUserMessage = null;

    
    for (let i = 0; i < conversationMessages.length - 1; i++) {
      const msg = conversationMessages[i];
      if (msg.role === "user") {
        geminiHistory.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === "assistant") {
        geminiHistory.push({
          role: "model",
          parts: [{ text: msg.content }],
        });
      }
    }

   
    const lastMsg = conversationMessages[conversationMessages.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      currentUserMessage = lastMsg.content;
    }

    if (!currentUserMessage) {
      throw new Error("No user message found to send");
    }

    
    const needsSystemInHistory = !config.aiModel.includes("1.5") && !config.aiModel.includes("2.0") && !config.aiModel.includes("2.5");
    if (needsSystemInHistory) {
      geminiHistory.unshift({
        role: "model",
        parts: [{ text: "I understand. I'll be a friendly and helpful assistant." }],
      });
      geminiHistory.unshift({
        role: "user",
        parts: [{ text: config.aiSystemPrompt }],
      });
    }

   
    const modelsToTry = [config.aiModel, ...VALID_GEMINI_MODELS.filter(m => m !== config.aiModel)];
    
    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        return await tryGenerateWithModel(modelName, geminiHistory, currentUserMessage);
      } catch (error) {
        lastError = error;
        const errorMessage = error.message || String(error);
      
        if (!errorMessage.includes("404") && !errorMessage.includes("not found") && !errorMessage.includes("is not found")) {
          throw error;
        }
        
        continue;
      }
    }

    
    if (lastError) {
      const errorMessage = lastError.message || String(lastError);
      throw new Error(`INVALID_MODEL: None of the tried Gemini models worked. Tried: ${modelsToTry.join(", ")}. Error: ${errorMessage}. Please check your GEMINI_API_KEY and ensure it has access to Gemini models.`);
    }

    throw new Error("Failed to generate response with any Gemini model");
  } catch (error) {
 
    const errorMessage = error.message || String(error);
    const statusCode = error.status || error.statusCode || (error.response && error.response.status);
    
   
    if (statusCode === 404 || errorMessage.includes("404") || errorMessage.includes("not found") || errorMessage.includes("is not found") || errorMessage.includes("INVALID_MODEL")) {
      throw new Error(`INVALID_MODEL: ${errorMessage}`);
    } else if (statusCode === 429 || errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota")) {
      throw new Error("QUOTA_EXCEEDED: You've exceeded your Gemini API quota. Please check your billing and plan at https://makersuite.google.com/app/apikey");
    } else if (statusCode === 401 || statusCode === 403 || errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key") || errorMessage.includes("Invalid API key")) {
      throw new Error("INVALID_API_KEY: Your Gemini API key is invalid. Please check your GEMINI_API_KEY in the .env file. Get a key at https://makersuite.google.com/app/apikey");
    } else if (statusCode === 500 || statusCode === 503 || errorMessage.includes("500") || errorMessage.includes("503")) {
      throw new Error("SERVICE_UNAVAILABLE: Gemini service is temporarily unavailable. Please try again in a moment");
    } else if (errorMessage.includes("safety") || errorMessage.includes("Safety")) {
      throw new Error("SAFETY_FILTER: Your message was blocked by Gemini's safety filters. Please rephrase your message.");
    } else {
      throw new Error(errorMessage || "Unknown error occurred while calling Gemini service");
    }
  }
}
