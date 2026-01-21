import { GoogleGenAI, Modality } from "@google/genai";
import { AIConfig, AudioConfig } from "./types";

const cleanUrl = (url: string) => url ? url.replace(/\/+$/, "") : "";

// Singleton AudioContext to prevent hitting browser limits (usually 6)
let globalAudioCtx: AudioContext | null = null;
export const getAudioContext = () => {
    if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
    }
    return globalAudioCtx;
}

export const fetchModels = async (config: AIConfig | AudioConfig, type: 'chat' | 'content' | 'audio' = 'chat') => {
  if (!config.key) throw new Error("Missing API Key");

  let models: string[] = [];

  if (config.provider === 'gemini') {
    // Expanded hardcoded list for Gemini to include Audio/TTS models
    models = [
        'gemini-3-flash-preview', 
        'gemini-3-pro-preview', 
        'gemini-2.5-flash-latest',
        'gemini-2.5-flash-preview-tts',
        'gemini-2.5-flash-native-audio-preview-12-2025'
    ];
  } else {
    try {
        const res = await fetch(`${cleanUrl(config.baseUrl || "https://api.openai.com/v1")}/models`, { 
            headers: { "Authorization": `Bearer ${config.key}` } 
        });
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        models = (Array.isArray(data.data) ? data.data : data).map((m: any) => m.id || m.model || m).sort();
    } catch (e) {
        throw new Error(`Fetch failed: ${(e as Error).message}`);
    }
  }

  // Filter based on type
  if (type === 'audio') {
      const audioKeywords = ['tts', 'audio', 'speech', 'realtime', 'live', 'voice', 'whisper', 'omni'];
      return models.filter(m => audioKeywords.some(k => m.toLowerCase().includes(k)));
  }

  return models;
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

export const playTTSPreview = async (config: AudioConfig, text: string = "Hello, this is a test.") => {
    // 1. Browser TTS
    if (config.provider === 'browser') {
        return new Promise<void>((resolve, reject) => {
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                const voices = window.speechSynthesis.getVoices();
                const v = voices.find(v => v.voiceURI === config.voiceID);
                if (v) u.voice = v;
                u.lang = 'en-US';
                u.onend = () => resolve();
                u.onerror = (e) => reject(e);
                window.speechSynthesis.speak(u);
            } catch (e) { reject(e); }
        });
    }

    if (!config.key) throw new Error("Missing API Key for Audio");

    // 2. Gemini TTS
    if (config.provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: config.key });
        const response = await ai.models.generateContent({
            model: config.model || "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: config.voiceID || 'Puck' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio returned from Gemini");
        
        // Decode and Play
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const ctx = getAudioContext();
        const dataInt16 = new Int16Array(bytes.buffer);
        // Create buffer: Gemini TTS usually returns 24kHz mono
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        
        // Convert Int16 PCM to Float32
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        return new Promise<void>((resolve) => {
             source.onended = () => resolve();
        });
    }

    // 3. OpenAI / Custom TTS
    if (config.provider === 'openai' || config.provider === 'custom') {
        const baseUrl = config.baseUrl || "https://api.openai.com/v1";
        const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/audio/speech`, { 
            method: "POST", 
            headers: { 
                "Authorization": `Bearer ${config.key}`, 
                "Content-Type": "application/json" 
            }, 
            body: JSON.stringify({ 
                model: config.model || "tts-1", 
                input: text, 
                voice: config.voiceID || "alloy" 
            }) 
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`TTS API Error: ${err}`);
        }
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
        return new Promise<void>((resolve) => {
             audio.onended = () => resolve();
        });
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