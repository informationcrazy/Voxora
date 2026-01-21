import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, Send, Volume2, Phone, PhoneOff, Activity } from 'lucide-react';
import { Topic, Persona, AIConfig, AudioConfig, Message, Lang } from '../types';
import { callLLM } from '../utils';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

interface ChatInterfaceProps {
  topic: Topic;
  persona: Persona;
  chatConfig: AIConfig;
  audioConfig: AudioConfig;
  initialMessage?: string;
  lang: Lang;
  t: (k: string) => string;
  onBack: () => void;
}

// Helpers for Live API
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  topic, persona, chatConfig, audioConfig, initialMessage, lang, t, onBack 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  
  // Live API Refs
  const liveSessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext|null>(null);
  const outputAudioCtxRef = useRef<AudioContext|null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode|null>(null);
  const processorRef = useRef<ScriptProcessorNode|null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Simulated Live (STT Loop)
  const isSimulatedLiveRef = useRef(false);
  const silenceTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialMessage && !isLiveMode) {
        setMessages([{ role: 'ai', textEn: initialMessage, textZh: '' }]);
        playAudio(initialMessage);
    }
  }, []);

  // Initialize Speech Recognition (Browser)
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
        setIsSpeechSupported(true);
        recognitionRef.current = new SR();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = false; // We manage restart manually for better control
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onstart = () => {
            setIsListening(true);
            if (isSimulatedLiveRef.current) setLiveStatus("Listening...");
        };
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
            // If in simulated live mode and not thinking/speaking, restart listening?
            // Actually, we restart after TTS ends or if silence.
            // But if user stopped speaking, onresult is called.
            // If no result (silence timeout), this might trigger.
        };

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (isSimulatedLiveRef.current) {
                setLiveStatus("Thinking...");
                handleSend(transcript); // Auto send in live mode
            } else {
                setInput(prev => (prev ? prev + ' ' : '') + transcript);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
    }
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isThinking]);

  // Clean up Live Session on unmount
  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  const playAudio = async (text: string, onEnded?: () => void) => {
    if (!text) return;
    if (isLiveMode && !isSimulatedLiveRef.current) return; // Don't play TTS if Native Live is active

    stopAudio();

    // Setup onEnded for Audio Element
    audioRef.current.onended = () => {
        if (onEnded) onEnded();
    };

    // 1. Gemini TTS (Native)
    if (audioConfig.provider === 'gemini') {
        const apiKey = audioConfig.key || chatConfig.key;
        if (!apiKey) return alert(t('error_missing_key'));

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: audioConfig.model || "gemini-2.5-flash-preview-tts",
              contents: { parts: [{ text }] },
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: audioConfig.voiceID || 'Puck' },
                    },
                },
              },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                // Using AudioContext for PCM to ensure compatibility
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => {
                    if (onEnded) onEnded();
                };
                source.start();
            }
        } catch (e) { console.error("Gemini TTS Error", e); if(onEnded) onEnded(); }
    }
    // 2. OpenAI / Custom TTS (Generic Endpoint)
    else if (audioConfig.provider === 'openai' || audioConfig.provider === 'custom') {
        const baseUrl = audioConfig.baseUrl || "https://api.openai.com/v1";
        const apiKey = audioConfig.key;
        if (!apiKey && audioConfig.provider === 'openai') return alert(t('tts_key_tip'));

        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/audio/speech`, { 
                method: "POST", 
                headers: { 
                    "Authorization": `Bearer ${apiKey}`, 
                    "Content-Type": "application/json" 
                }, 
                body: JSON.stringify({ 
                    model: audioConfig.model || "tts-1", 
                    input: text, 
                    voice: audioConfig.voiceID || "alloy" 
                }) 
            });
            if (!res.ok) throw new Error("TTS API Error");
            const blob = await res.blob();
            audioRef.current.src = URL.createObjectURL(blob);
            audioRef.current.play();
        } catch (e) { console.error(e); if(onEnded) onEnded(); }
    } 
    // 3. Browser TTS (Fallback)
    else {
        const u = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(v => v.voiceURI === audioConfig.voiceID);
        if (v) u.voice = v;
        u.lang = 'en-US';
        u.onend = () => {
            if (onEnded) onEnded();
        }
        window.speechSynthesis.speak(u);
    }
  };

  const startLiveSession = async () => {
    stopAudio();
    setIsLiveMode(true);
    setLiveStatus(t('live_connecting'));

    // MODE A: Gemini Native Live (If Chat Provider is Gemini)
    if (chatConfig.provider === 'gemini') {
        isSimulatedLiveRef.current = false;
        const apiKey = chatConfig.key;
        if (!apiKey) {
            alert("Gemini Chat Key required");
            stopLiveSession();
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Setup Audio Contexts
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioCtxRef.current = inputCtx;
            outputAudioCtxRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setLiveStatus(t('live_active'));
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                        sourceNodeRef.current = source;
                        processorRef.current = scriptProcessor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputAudioCtxRef.current) {
                            const ctx = outputAudioCtxRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => stopLiveSession(),
                    onerror: (e) => { console.error(e); stopLiveSession(); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: (audioConfig.provider === 'gemini' ? audioConfig.voiceID : 'Puck') || 'Puck' } }
                    },
                    systemInstruction: `You are ${persona.name}. Role: ${topic.role}. Prompt: ${topic.prompt}.`
                }
            });
            liveSessionRef.current = sessionPromise;

        } catch (e) {
            alert("Live Error: " + (e as Error).message);
            stopLiveSession();
        }
    } 
    // MODE B: Simulated Live (For OpenAI, DeepSeek, Zhipu, etc.)
    else {
        isSimulatedLiveRef.current = true;
        setLiveStatus("Simulated Live Active");
        // Start Cycle: Listen -> Text -> LLM -> Text -> TTS -> Listen
        if (isSpeechSupported) {
            recognitionRef.current?.start();
        } else {
            alert("Browser Speech Recognition not supported.");
            stopLiveSession();
        }
    }
  };

  const stopLiveSession = () => {
    setIsLiveMode(false);
    setLiveStatus('');
    isSimulatedLiveRef.current = false;

    // Stop Native Live
    inputAudioCtxRef.current?.close();
    outputAudioCtxRef.current?.close();
    sourceNodeRef.current?.disconnect();
    processorRef.current?.disconnect();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    // Stop Simulated Live
    recognitionRef.current?.stop();
    stopAudio();
  };

  const handleSend = async (textOverride?: string) => {
    const userText = textOverride || input.trim();
    if (!userText) return;

    if (!textOverride) setInput('');
    if (!isLiveMode) stopAudio();
    
    setMessages(prev => [...prev, { role: 'user', textEn: userText, textZh: '' }]);
    setIsThinking(true);

    const translationInstruction = lang === 'zh' ? 'Chinese translation' : 'Simple English definition';
    
    const systemPrompt = `
    IDENTITY: ${persona.name}, Age: ${persona.age}, Gender: ${persona.gender}, From: ${persona.nationality}, Job: ${persona.profession}.
    PERSONALITY: ${persona.personality}.
    SCENARIO: ${topic.prompt}. My Role: ${topic.role}.
    INSTRUCTION: Act fully as ${persona.name}. Keep responses concise (under 50 words) unless asked otherwise.
    OUTPUT FORMAT: Provide the English response, followed by the ${translationInstruction} in parentheses at the end.
    Example: "That sounds great! (听起来不错！)"
    `;

    try {
        const responseText = await callLLM(chatConfig, userText, systemPrompt);
        
        const match = responseText.match(/^(.*)\s*[\(（]([\s\S]*)[\)）]$/s);
        const en = match ? match[1].trim() : responseText;
        const zh = match ? match[2].trim() : "";

        setMessages(prev => [...prev, { role: 'ai', textEn: en, textZh: zh }]);
        
        // Play Audio (Simulated Live or Normal Chat)
        if (isLiveMode && isSimulatedLiveRef.current) {
            setLiveStatus("Speaking...");
            playAudio(en, () => {
                // When TTS ends, restart listening
                if (isLiveMode && isSimulatedLiveRef.current) {
                    setLiveStatus("Listening...");
                    try { recognitionRef.current?.start(); } catch(e){}
                }
            });
        } else {
            playAudio(en);
        }

    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', textEn: "Connection Error", textZh: (error as Error).message }]);
        // If error in live mode, maybe restart listening anyway?
        if (isLiveMode && isSimulatedLiveRef.current) {
             setTimeout(() => { try { recognitionRef.current?.start(); } catch(e){} }, 2000);
        }
    } finally {
        setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopAudio();
      recognitionRef.current?.start();
    }
  };

  if (isLiveMode) {
      return (
          <div className="flex flex-col h-screen bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 to-slate-900 z-0"></div>
              
              {/* Header */}
              <div className="relative z-10 flex items-center justify-between p-6">
                 <button onClick={() => { stopLiveSession(); onBack(); }} className="p-2 bg-white/10 rounded-full backdrop-blur-md"><ArrowLeft className="w-6 h-6" /></button>
                 <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50 animate-pulse">
                     <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                     <span className="text-xs font-bold tracking-wider text-red-200 uppercase">LIVE ({chatConfig.provider})</span>
                 </div>
              </div>

              {/* Central Visual */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8">
                   <div className="relative">
                       <div className={`absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full ${isThinking || liveStatus==='Speaking...' ? 'animate-pulse scale-150' : 'scale-100'} transition-all duration-700`}></div>
                       <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.name}&gender=${persona.gender.toLowerCase() === 'male' ? 'male' : 'female'}`} 
                            className="w-48 h-48 rounded-full border-4 border-white/10 shadow-2xl bg-indigo-900 relative z-10" 
                            alt="avatar"
                        />
                   </div>
                   
                   <div className="text-center">
                       <h2 className="text-3xl font-black mb-2">{persona.name}</h2>
                       <p className="text-indigo-300 font-medium text-lg min-h-[2rem]">{liveStatus}</p>
                   </div>
                   
                   {(isThinking || liveStatus === 'Speaking...') && (
                       <div className="flex gap-1 h-8 items-end">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{height: `${Math.random()*100}%`, animationDuration: `${0.5 + Math.random()}s`}}></div>
                            ))}
                       </div>
                   )}
              </div>

              {/* Controls */}
              <div className="relative z-10 p-10 flex justify-center pb-safe">
                  <button 
                    onClick={stopLiveSession}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 hover:bg-red-600 active:scale-95 transition-all"
                  >
                      <PhoneOff className="w-8 h-8 fill-current" />
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
            <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white">{lang==='zh' ? topic.titleZh : topic.titleEn}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">with <span className="text-indigo-600 dark:text-indigo-400 font-bold">{persona.name}</span></p>
            </div>
        </div>
        
        <button 
            onClick={startLiveSession}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-green-600 transition-colors animate-in fade-in"
        >
            <Phone className="w-3 h-3 fill-current" />
            {t('start_live')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 pb-24">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm relative shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
            }`}>
              <div className="font-medium leading-relaxed">{msg.textEn}</div>
              {msg.textZh && (
                  <div className={`mt-2 pt-2 text-xs border-t ${msg.role === 'user' ? 'border-white/20 text-indigo-100' : 'border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                      {msg.textZh}
                  </div>
              )}
              {msg.role === 'ai' && (
                 <button onClick={() => playAudio(msg.textEn)} className="absolute -right-8 top-1 p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400">
                   <Volume2 className="w-4 h-4" />
                 </button>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 px-4 animate-pulse">{persona.name} is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 fixed bottom-0 w-full max-w-md z-20 pb-safe">
        <div className="flex gap-2 items-center">
            {isSpeechSupported && (
              <button 
                  onClick={toggleListening}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${isListening ? 'bg-red-500 border-red-500 text-white animate-pulse ring-4 ring-red-100 dark:ring-red-900' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title={isListening ? "Stop Recording" : "Start Recording"}
              >
                 <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : `${t('input_placeholder')} ${persona.name}...`}
              className={`flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors ${isListening ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 placeholder-red-400' : 'placeholder:text-slate-400 dark:placeholder:text-slate-500'}`}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'}`}
            >
              <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
