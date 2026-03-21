import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No GEMINI_API_KEY');
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log(JSON.stringify(data.models.map((m: any) => m.name), null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
