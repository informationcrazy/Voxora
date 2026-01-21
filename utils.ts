import { GoogleGenAI } from "@google/genai";
import { AIConfig } from "./types";

const cleanUrl = (url: string) => url ? url.replace(/\/+$/, "") : "";

export const fetchModels = async (config: AIConfig) => {
  if (!config.key) throw new Error("Missing API Key");

  if (config.provider === 'gemini') {
    // Basic hardcoded list for Gemini to avoid complex permissions/proxy issues in client
    return ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash-latest'];
  } else {
    const res = await fetch(`${cleanUrl(config.baseUrl)}/models`, { 
      headers: { "Authorization": `Bearer ${config.key}` } 
    });
    const data = await res.json();
    return (Array.isArray(data.data) ? data.data : data).map((m: any) => m.id || m.model || m).sort();
  }
};

export const testConnection = async (config: AIConfig) => {
  if (!config.key) throw new Error("API Key is missing");

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.key });
    // Minimal request to verify key
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
    });
  } else {
    const res = await fetch(`${cleanUrl(config.baseUrl)}/models`, { 
      headers: { "Authorization": `Bearer ${config.key}` } 
    });
    if (!res.ok) throw new Error("Request failed");
  }
};

export const callLLM = async (
  config: AIConfig, 
  prompt: string, 
  systemPrompt: string = "",
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.key) throw new Error("Please set API Key in settings");

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.key });
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: jsonMode ? "application/json" : "text/plain"
      }
    });
    return response.text || "";
  } else {
    const headers = { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.key}`
    };
    const messages = systemPrompt 
      ? [{role:"system", content: systemPrompt}, {role:"user", content: prompt}] 
      : [{role:"user", content: prompt}];
    
    const body: any = { model: config.model, messages };
    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${cleanUrl(config.baseUrl)}/chat/completions`, { 
      method: "POST", 
      headers, 
      body: JSON.stringify(body) 
    });
    
    if (!res.ok) {
       const err = await res.text();
       throw new Error(`API Error: ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }
};

export const parseJSON = (str: string) => {
  try {
      const match = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/); 
      return JSON.parse(match ? match[0] : str);
  } catch (e) { 
      console.error("JSON Parse Error", e);
      throw new Error("Failed to parse AI response"); 
  }
};
