import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Use gemini-1.5-flash as stable public model (gemini-2.5-flash not yet available)
const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
  return new GoogleGenerativeAI(key);
};

export const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  return getGenAI().getGenerativeModel({ model: modelName });
};
