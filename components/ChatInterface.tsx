import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, Send, Volume2, Phone, PhoneOff, Activity, MicOff, Sparkles, MoreHorizontal } from 'lucide-react';
import { Topic, Persona, AIConfig, AudioConfig, Message, Lang, LessonData } from '../types';
import { callLLM, getAudioContext } from '../utils';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

interface ChatInterfaceProps {
  topic: Topic;
  persona: Persona;
  chatConfig: AIConfig;
  audioConfig: AudioConfig;
  initialMessage?: string;
  initialHistory?: Message[];
  lessonData?: LessonData | null;
  lang: Lang;
  t: (k: string) => string;
  onBack: (messages: Message[]) => void;
  onOpenSettings: (tab: 'chat' | 'audio') => void;
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

// Visualizer Component
const AudioVisualizer = ({ isActive, analyser, mode }: { isActive: boolean, analyser: AnalyserNode | null, mode: 'user' | 'ai' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        if (!canvasRef.current || !isActive) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const bufferLength = analyser ? analyser.frequencyBinCount : 0;
        const dataArray = new Uint8Array(bufferLength);
        let animationId: number;
        
        const draw = () => {
            animationId = requestAnimationFrame(draw);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 60; // Base radius matching the avatar

            // Color Palette
            const rgbColor = mode === 'ai' ? '99, 102, 241' : '74, 222, 128'; // Indigo vs Green

            let average = 0;
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
                average = sum / bufferLength;
            }

            const scale = 1 + (average / 256) * 0.4;
            
            // Draw glowing concentric circle (Halo)
            if (average > 10) {
                 ctx.beginPath();
                 ctx.arc(centerX, centerY, radius * scale * 1.15, 0, 2 * Math.PI);
                 ctx.fillStyle = `rgba(${rgbColor}, ${0.1 + average/1000})`; 
                 ctx.fill();
            }

            // Draw main ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * scale, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(${rgbColor}, ${0.5 + average/512})`; 
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw particles/bars
            if (analyser) {
                const bars = 30;
                const step = (Math.PI * 2) / bars;
                for(let i = 0; i < bars; i++) {
                    const value = dataArray[i * 2] || 0;
                    const barHeight = (value / 255) * 40;
                    const angle = i * step - (Math.PI/2); // Start from top
                    
                    const x1 = centerX + Math.cos(angle) * (radius * scale + 5);
                    const y1 = centerY + Math.sin(angle) * (radius * scale + 5);
                    const x2 = centerX + Math.cos(angle) * (radius * scale + 5 + barHeight);
                    const y2 = centerY + Math.sin(angle) * (radius * scale + 5 + barHeight);
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(${rgbColor}, ${value/255})`; 
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        };
        
        draw();
        
        return () => cancelAnimationFrame(animationId);
    }, [isActive, analyser, mode]);

    return <canvas ref={canvasRef} width={400} height={400} className="absolute inset-0 pointer-events-none z-0" />;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  topic, persona, chatConfig, audioConfig, initialMessage, initialHistory, lessonData, lang, t, onBack, onOpenSettings
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  // Visual & Subtitle State
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveTranscriptSource, setLiveTranscriptSource] = useState<'user' | 'ai'>('ai');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [userMicActive, setUserMicActive] = useState(false);
  
  // Audio Analysis
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null); // Input
  const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null); // Output
  // Use a ref to access the analyser inside closures (like onresult/onmessage)
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  const setOutputAnalyserSafe = (node: AnalyserNode | null) => {
      setOutputAnalyser(node);
      outputAnalyserRef.current = node;
  };

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
  const transcriptBufferRef = useRef<{user: string, ai: string, lastSource: 'user'|'ai'}>({user: '', ai: '', lastSource: 'user'});

  // Simulated Live (STT Loop)
  const isSimulatedLiveRef = useRef(false);

  useEffect(() => {
    // Priority: History > Initial Message
    if (initialHistory && initialHistory.length > 0) {
        setMessages(initialHistory);
    } else if (initialMessage && !isLiveMode) {
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
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onstart = () => {
            setIsListening(true);
            if (isSimulatedLiveRef.current) {
                 setLiveStatus("Listening...");
                 setUserMicActive(true);
            }
        };
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
            setUserMicActive(false);
        };

        recognitionRef.current.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
            
            if (isSimulatedLiveRef.current) {
                setLiveTranscript(transcript);
                setLiveTranscriptSource('user');
                setIsAiSpeaking(false);

                if (event.results[0].isFinal) {
                    setLiveStatus("Thinking...");
                    handleSend(transcript); 
                }
            } else {
                setInput(transcript);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            setUserMicActive(false);
        };
    }
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isThinking]);

  // Clean up Live Session on unmount
  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  const handleBack = () => {
      // Pass the current messages back to App to save history
      onBack(messages);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setIsAiSpeaking(false);
  };

  const playAudio = async (text: string, onEnded?: () => void) => {
    if (!text) return;
    if (isLiveMode && !isSimulatedLiveRef.current) return; // Don't play TTS if Native Live is active

    stopAudio();
    setIsAiSpeaking(true);

    const handleEnded = () => {
        setIsAiSpeaking(false);
        if (onEnded) onEnded();
    };

    audioRef.current.onended = handleEnded;

    // 1. Gemini TTS (Native)
    if (audioConfig.provider === 'gemini') {
        const apiKey = audioConfig.key || chatConfig.key;
        if (!apiKey) {
            setIsAiSpeaking(false);
            return alert(t('error_missing_key'));
        }

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
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const ctx = getAudioContext();
                const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                
                // Route through analyser if available (Live Mode)
                if (outputAnalyserRef.current) {
                    source.connect(outputAnalyserRef.current);
                } else {
                    source.connect(ctx.destination);
                }
                
                source.onended = handleEnded;
                source.start();
            } else {
                handleEnded();
            }
        } catch (e) { 
            console.error("Gemini TTS Error", e); 
            handleEnded();
        }
    } 
    // 2. OpenAI / Custom TTS (Generic Endpoint)
    else if (audioConfig.provider === 'openai' || audioConfig.provider === 'custom') {
        const baseUrl = audioConfig.baseUrl || "https://api.openai.com/v1";
        const apiKey = audioConfig.key;
        if (!apiKey && audioConfig.provider === 'openai') {
            setIsAiSpeaking(false);
            return alert(t('tts_key_tip'));
        }

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
        } catch (e) { 
            console.error(e); 
            handleEnded(); 
        }
    } 
    // 3. Browser TTS (Fallback)
    else {
        const u = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(v => v.voiceURI === audioConfig.voiceID);
        if (v) u.voice = v;
        u.lang = 'en-US';
        u.onend = handleEnded;
        window.speechSynthesis.speak(u);
    }
  };

  const startLiveSession = async () => {
    const apiKey = chatConfig.key?.trim();
    if (!apiKey) {
         if (confirm(t('missing_key_confirm'))) {
             onOpenSettings('chat');
         }
         return;
    }

    // Common output analyser setup
    const outputCtx = getAudioContext();
    const outAna = outputCtx.createAnalyser();
    outAna.fftSize = 256;
    outAna.smoothingTimeConstant = 0.5;
    outAna.connect(outputCtx.destination);
    setOutputAnalyserSafe(outAna);

    const isGemini = chatConfig.provider === 'gemini';

    // Specific Simulated Live Check (OpenAI/Others)
    if (!isGemini) {
        if (!isSpeechSupported) {
            alert(lang === 'zh' ? "您的浏览器不支持语音识别，无法使用模拟通话。" : "Speech recognition is not supported in this browser.");
            setOutputAnalyserSafe(null);
            return;
        }
        if (audioConfig.provider !== 'browser' && !audioConfig.key) {
             if (confirm(t('missing_tts_confirm'))) {
                 onOpenSettings('audio');
             }
             setOutputAnalyserSafe(null);
             return;
        }
    }

    stopAudio();
    setIsLiveMode(true);
    setLiveStatus(t('live_connecting'));
    setLiveTranscript('');
    transcriptBufferRef.current = {user: '', ai: '', lastSource: 'user'};

    // Build context-aware instructions
    let contextInstructions = "";
    if (lessonData) {
        const vocabList = lessonData.vocabulary.map(v => v.en).join(', ');
        const exprList = lessonData.expressions.map(e => e.en).join(', ');
        contextInstructions = `
        CONTEXT: The user is learning about "${topic.titleEn}".
        TARGET VOCABULARY: ${vocabList}.
        TARGET EXPRESSIONS: ${exprList}.
        INSTRUCTION: Try to naturally use the target vocabulary and expressions in your responses. Correct the user gently if they misuse them.
        `;
    }

    // MODE A: Gemini Native Live
    if (chatConfig.provider === 'gemini') {
        isSimulatedLiveRef.current = false;

        try {
            const ai = new GoogleGenAI({ apiKey });

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioCtxRef.current = inputCtx;
            outputAudioCtxRef.current = outputCtx;
            nextStartTimeRef.current = 0;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const analyzerNode = inputCtx.createAnalyser();
            analyzerNode.fftSize = 64;
            setAnalyser(analyzerNode);

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setLiveStatus(t('live_active'));
                        setUserMicActive(true);
                        
                        const source = inputCtx.createMediaStreamSource(stream);
                        source.connect(analyzerNode);
                        
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
                        if (msg.serverContent?.inputTranscription) {
                            const text = msg.serverContent.inputTranscription.text;
                            if (text) {
                                if (transcriptBufferRef.current.lastSource === 'ai') {
                                    transcriptBufferRef.current.user = '';
                                    transcriptBufferRef.current.lastSource = 'user';
                                    setLiveTranscriptSource('user');
                                }
                                transcriptBufferRef.current.user += text;
                                setLiveTranscript(transcriptBufferRef.current.user);
                                setIsAiSpeaking(false);
                            }
                        }
                        
                        if (msg.serverContent?.outputTranscription) {
                             const text = msg.serverContent.outputTranscription.text;
                             if (text) {
                                 if (transcriptBufferRef.current.lastSource === 'user') {
                                     transcriptBufferRef.current.ai = '';
                                     transcriptBufferRef.current.lastSource = 'ai';
                                     setLiveTranscriptSource('ai');
                                 }
                                 transcriptBufferRef.current.ai += text;
                                 setLiveTranscript(transcriptBufferRef.current.ai);
                                 setIsAiSpeaking(true);
                             }
                        }

                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            setIsAiSpeaking(true);
                            const ctx = outputCtx;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            
                            // Connect to pre-created output analyser
                            source.connect(outAna);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => stopLiveSession(),
                    onerror: (e) => {
                         console.error("Live API Error:", e);
                         let errMsg = "Connection Failed";
                         if (e instanceof Error) errMsg = e.message;
                         else if ((e as any).message) errMsg = (e as any).message;
                         if (errMsg.includes("403") || errMsg.includes("401")) {
                            errMsg += lang === 'zh' ? "\n鉴权失败。请检查 API Key 权限。" : "\nAuth failed. Check API Key.";
                         }
                         alert(`Live Error: ${errMsg}`);
                         stopLiveSession(); 
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {}, 
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: (audioConfig.provider === 'gemini' ? audioConfig.voiceID : 'Puck') || 'Puck' } }
                    },
                    systemInstruction: `You are ${persona.name}. Role: ${topic.role}. Prompt: ${topic.prompt}. ${contextInstructions}`
                }
            });
            
            sessionPromise.catch(e => {
                console.error("Session Handshake Failed", e);
                alert(lang === 'zh' ? `连接无法建立: ${e.message}` : `Connection Failed: ${e.message}`);
                stopLiveSession();
            });

            liveSessionRef.current = sessionPromise;

        } catch (e) {
            alert(lang === 'zh' ? `初始化错误: ${(e as Error).message}` : `Init Error: ${(e as Error).message}`);
            stopLiveSession();
        }
    } 
    // MODE B: Simulated Live
    else {
        isSimulatedLiveRef.current = true;
        setLiveStatus("Simulated Live Active");
        if (isSpeechSupported) {
            recognitionRef.current?.start();
        }
    }
  };

  const stopLiveSession = () => {
    setIsLiveMode(false);
    setLiveStatus('');
    isSimulatedLiveRef.current = false;
    setLiveTranscript('');
    setIsAiSpeaking(false);
    setUserMicActive(false);
    setAnalyser(null);
    setOutputAnalyserSafe(null);

    // Stop Native Live
    inputAudioCtxRef.current?.close();
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
    
    let contextContext = "";
    if (lessonData) {
        const vocabList = lessonData.vocabulary.map(v => v.en).join(', ');
        contextContext = `CONTEXT: User is learning "${topic.titleEn}". VOCAB: ${vocabList}. Use these words naturally.`;
    }

    const systemPrompt = `
    IDENTITY: ${persona.name}, Age: ${persona.age}, Gender: ${persona.gender}, From: ${persona.nationality}, Job: ${persona.profession}.
    PERSONALITY: ${persona.personality}.
    SCENARIO: ${topic.prompt}. My Role: ${topic.role}.
    ${contextContext}
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
        
        if (isLiveMode && isSimulatedLiveRef.current) {
            setLiveStatus("Speaking...");
            setLiveTranscript(en); 
            setLiveTranscriptSource('ai');
            playAudio(en, () => {
                if (isLiveMode && isSimulatedLiveRef.current) {
                    setLiveStatus("Listening...");
                    setLiveTranscript(""); 
                    try { recognitionRef.current?.start(); } catch(e){}
                }
            });
        } else {
            playAudio(en);
        }

    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', textEn: "Connection Error", textZh: (error as Error).message }]);
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
          <div className="flex flex-col h-screen bg-slate-900 text-white relative overflow-hidden font-sans">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black z-0"></div>
              
              {/* Header */}
              <div className="relative z-20 flex items-center justify-between p-6">
                 <button onClick={() => { stopLiveSession(); handleBack(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-colors border border-white/5">
                    <ArrowLeft className="w-6 h-6" />
                 </button>
                 <div className="flex items-center gap-3 bg-black/30 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                     <div className={`w-2 h-2 rounded-full ${userMicActive || isAiSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                     <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                        {isAiSpeaking ? 'AI Speaking' : userMicActive ? 'Listening' : 'Live Active'}
                     </span>
                 </div>
              </div>

              {/* Central Visual */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-6">
                   {/* Avatar Container */}
                   <div className="relative mb-12 flex justify-center items-center w-64 h-64">
                       
                       {/* Visualizer Canvas Layer */}
                       <AudioVisualizer 
                           isActive={true} 
                           analyser={isAiSpeaking ? outputAnalyser : (userMicActive ? analyser : null)} 
                           mode={isAiSpeaking ? 'ai' : 'user'}
                       />

                       {/* Speaking Ripple (AI) */}
                       {isAiSpeaking && (
                           <>
                             <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 duration-2000"></div>
                             <div className="absolute -inset-8 bg-indigo-500/20 rounded-full animate-pulse blur-3xl"></div>
                           </>
                       )}
                       
                       <div className={`relative z-10 transition-all duration-300 ${isAiSpeaking ? 'scale-110 drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]' : 'scale-100'}`}>
                           {/* Updated Avatar to Micah Style */}
                           <img 
                                src={`https://api.dicebear.com/9.x/micah/svg?seed=${persona.name}&mouth=smile,pucker,laughing&baseColor=f9c9b6,ac6651`} 
                                className={`w-40 h-40 rounded-full border-4 shadow-2xl bg-indigo-950 transition-colors ${isAiSpeaking ? 'border-indigo-400' : 'border-slate-700'}`}
                                alt="avatar"
                            />
                            {/* Status Icon Badge */}
                            <div className={`absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-full border shadow-lg transition-colors ${isAiSpeaking ? 'border-indigo-500' : 'border-slate-700'}`}>
                                {isAiSpeaking ? <Volume2 className="w-5 h-5 text-indigo-400 animate-bounce" /> : userMicActive ? <Mic className="w-5 h-5 text-green-400" /> : <MoreHorizontal className="w-5 h-5 text-slate-500" />}
                            </div>
                       </div>
                   </div>

                   {/* Persona Info */}
                   <div className="text-center space-y-2 mb-8">
                       <h2 className="text-3xl font-black tracking-tight">{persona.name}</h2>
                       <p className="text-indigo-300/80 font-medium text-sm tracking-wide uppercase">{topic.role}</p>
                   </div>
                   
                   {/* Subtitles Area - Enhanced for Distinction */}
                   <div className="w-full min-h-[140px] flex items-center justify-center p-4">
                       {liveTranscript ? (
                           <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-2xl">
                               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md border transition-colors duration-300 ${
                                   liveTranscriptSource === 'user' 
                                   ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-900/20' 
                                   : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-900/20'
                               }`}>
                                   {liveTranscriptSource === 'user' ? 'You' : persona.name}
                               </div>
                               <p className="text-xl md:text-3xl font-medium text-center leading-relaxed text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm">
                                   {liveTranscript}
                               </p>
                           </div>
                       ) : (
                           <div className="flex gap-1.5 opacity-30">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                           </div>
                       )}
                   </div>
              </div>

              {/* Footer Controls */}
              <div className="relative z-20 p-8 flex justify-center pb-safe items-center gap-8">
                  <button 
                    onClick={() => {
                         // Toggle Mic Mute logic
                         setUserMicActive(!userMicActive);
                    }}
                    className={`p-4 rounded-full backdrop-blur-md border transition-all ${userMicActive ? 'bg-white/10 border-white/10 text-white' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}
                  >
                      {userMicActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </button>

                  <button 
                    onClick={() => { stopLiveSession(); handleBack(); }}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40 hover:bg-red-600 active:scale-95 transition-all ring-4 ring-red-500/20"
                  >
                      <PhoneOff className="w-9 h-9 fill-current" />
                  </button>
                  
                  {/* Placeholder for future features or mute audio out */}
                  <div className="w-14"></div> 
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10">
        <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
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