import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, FileText, Book, MoreHorizontal, Settings, Clock, BookOpen, Zap, TrendingUp, ChevronRight, Upload, X, Trash2, AudioWaveform, Sparkles, Globe, Loader2 } from 'lucide-react';
import { I18N, STATIC_TOPICS, getIcon, PROVIDER_MAP } from './constants';
import { ViewState, Topic, LessonData, AIConfig, AudioConfig, Persona, Lang, Theme, ThemeMode, Message, ChatSession } from './types';
import { callLLM, parseJSON } from './utils';

import LessonView from './components/LessonView';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import TranslationModal from './components/TranslationModal';
import HistoryModal from './components/HistoryModal';

declare const process: { env: { API_KEY: string } };

const Logo = ({ className }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className || ''}`}>
     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl rotate-6 opacity-20 blur-sm"></div>
     <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 p-2.5 rounded-xl shadow-xl flex items-center justify-center">
        <AudioWaveform className="w-5 h-5" strokeWidth={2.5} />
     </div>
  </div>
);

// Artistic Loader Component - Compact & Dynamic
const AuroraLoader = ({ text }: { text: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center">
          {/* Animated Kinetic Core */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              {/* Spinning Ring 1 */}
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-purple-500 animate-spin-slow opacity-90 filter drop-shadow-sm"></div>
              {/* Spinning Ring 2 (Counter) */}
              <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-pink-500 border-l-cyan-500 animate-spin-reverse-slower opacity-90 filter drop-shadow-sm"></div>
              
              {/* Central Floating Icon Container */}
              <div className="absolute inset-0 flex items-center justify-center animate-float">
                  <div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-3.5 rounded-full shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] border border-white/50 dark:border-white/10 ring-1 ring-indigo-500/10">
                    <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-900/30" />
                  </div>
              </div>
              
              {/* Orbiting Particles */}
              <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              </div>
          </div>

          {/* Artistic Typography */}
          <div className="text-center relative z-10">
              <h3 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-shimmer bg-[length:200%_auto]">
                {text}
              </h3>
              <div className="flex items-center justify-center gap-1 mt-3">
                  <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/2 animate-[shimmer_1s_infinite]"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase">
                    Thinking
                  </p>
                  <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/2 animate-[shimmer_1s_infinite_reverse]"></div>
                  </div>
              </div>
          </div>
      </div>
  </div>
);

function App() {
  // State
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('app_lang') as Lang) || 'zh');
  const t = (k: string) => I18N[lang][k as keyof typeof I18N['zh']] || k;

  // Theme Logic
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('app_theme_mode') as ThemeMode) || 'system');
  
  // Helper to determine system preference
  const getSystemTheme = (): Theme => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme());

  // Listen for system changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Calculate Active Theme
  const activeTheme = themeMode === 'system' ? systemTheme : themeMode;

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme_mode', themeMode);
  }, [activeTheme, themeMode]);

  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState(''); // New state for custom loading text
  
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'persona'|'chat'|'live'|'content'|'audio'|'image'|'video'|'translator'>('persona');
  const [textbook, setTextbook] = useState<string>(() => localStorage.getItem('textbook_content') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History & Session State
  const [history, setHistory] = useState<ChatSession[]>(() => {
      try {
          const s = localStorage.getItem('chat_history');
          return s ? JSON.parse(s) : [];
      } catch (e) { return []; }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [initialHistory, setInitialHistory] = useState<Message[]>([]);

  // Cache State
  const [lessonCache, setLessonCache] = useState<Record<string, LessonData>>(() => {
      try {
        const s = localStorage.getItem('lesson_cache');
        return s ? JSON.parse(s) : {};
      } catch (e) { return {}; }
  });

  // Configs - Initialize from LocalStorage OR Environment Variable
  const [chatConfig, setChatConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('chat_provider') as any) || 'gemini',
    // Priority: User's saved key -> Env Var -> Empty
    key: localStorage.getItem('chat_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('chat_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('chat_model') || 'gemini-3-flash-preview'
  }));

  const [liveConfig, setLiveConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('live_provider') as any) || 'gemini',
    key: localStorage.getItem('live_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('live_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('live_model') || 'gemini-2.5-flash-native-audio-preview-12-2025'
  }));

  const [contentConfig, setContentConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('content_provider') as any) || 'gemini',
    key: localStorage.getItem('content_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('content_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('content_model') || 'gemini-3-flash-preview'
  }));
  
  const [imageConfig, setImageConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('image_provider') as any) || 'gemini',
    key: localStorage.getItem('image_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('image_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('image_model') || 'gemini-2.5-flash-image'
  }));

  const [videoConfig, setVideoConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('video_provider') as any) || 'gemini',
    key: localStorage.getItem('video_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('video_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('video_model') || 'veo-3.1-fast-generate-preview'
  }));

  const [translatorConfig, setTranslatorConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('translator_provider') as any) || 'gemini',
    key: localStorage.getItem('translator_key') || process.env.API_KEY || '',
    baseUrl: localStorage.getItem('translator_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('translator_model') || 'gemini-3-flash-preview'
  }));

  const [audioConfig, setAudioConfig] = useState<AudioConfig>(() => ({
    provider: (localStorage.getItem('tts_provider') as any) || 'browser',
    voiceID: localStorage.getItem('tts_voice') || '',
    key: localStorage.getItem('tts_key') || process.env.API_KEY || '',
    model: localStorage.getItem('tts_model') || '',
    baseUrl: localStorage.getItem('tts_base') || ''
  }));

  const [persona, setPersona] = useState<Persona>(() => {
    const defaultPersona = {
        name: "Aria", 
        nameZh: "艾瑞亚 (Aria)",
        age: "26", 
        gender: "Female", 
        nationality: "Cosmopolitan",
        profession: "Creative Director", 
        professionZh: "创意总监",
        personality: "Vibrant, Imaginative, Empathetic", 
        interests: "Modern Art, Jazz, Deep Conversations",
        voiceId: "Kore"
    };
    
    try {
        const s = localStorage.getItem('ai_persona');
        const parsed = s ? JSON.parse(s) : null;
        
        // Migration logic
        if (parsed && parsed.name === 'Jenny' && parsed.profession === 'ESL Tutor') {
            return defaultPersona;
        }
        return parsed ? { ...defaultPersona, ...parsed, voiceId: parsed.voiceId || 'Kore' } : defaultPersona;
    } catch (e) {
        return defaultPersona;
    }
  });

  const [trending, setTrending] = useState<Topic[]>(() => {
      try {
          const s = localStorage.getItem('trending_topics');
          const data = s ? JSON.parse(s) : [];
          return Array.isArray(data) ? data : [];
      } catch (e) { return []; }
  });

  // Check for Missing Key on Startup
  useEffect(() => {
    // If no key is found in storage OR env vars for the main chat engine, prompt the user
    if (!chatConfig.key) {
        setSettingsTab('chat');
        setShowSettings(true);
    }
  }, []);

  // Persistence
  useEffect(() => localStorage.setItem('app_lang', lang), [lang]);
  useEffect(() => localStorage.setItem('ai_persona', JSON.stringify(persona)), [persona]);
  useEffect(() => localStorage.setItem('textbook_content', textbook), [textbook]);
  useEffect(() => localStorage.setItem('lesson_cache', JSON.stringify(lessonCache)), [lessonCache]);
  useEffect(() => localStorage.setItem('chat_history', JSON.stringify(history)), [history]);
  
  useEffect(() => {
     localStorage.setItem('chat_provider', chatConfig.provider);
     localStorage.setItem('chat_key', chatConfig.key);
     localStorage.setItem('chat_base', chatConfig.baseUrl);
     localStorage.setItem('chat_model', chatConfig.model);
  }, [chatConfig]);
  useEffect(() => {
     localStorage.setItem('live_provider', liveConfig.provider);
     localStorage.setItem('live_key', liveConfig.key);
     localStorage.setItem('live_base', liveConfig.baseUrl);
     localStorage.setItem('live_model', liveConfig.model);
  }, [liveConfig]);
  useEffect(() => {
     localStorage.setItem('content_provider', contentConfig.provider);
     localStorage.setItem('content_key', contentConfig.key);
     localStorage.setItem('content_base', contentConfig.baseUrl);
     localStorage.setItem('content_model', contentConfig.model);
  }, [contentConfig]);
  useEffect(() => {
     localStorage.setItem('image_provider', imageConfig.provider);
     localStorage.setItem('image_key', imageConfig.key);
     localStorage.setItem('image_base', imageConfig.baseUrl);
     localStorage.setItem('image_model', imageConfig.model);
  }, [imageConfig]);
  useEffect(() => {
     localStorage.setItem('video_provider', videoConfig.provider);
     localStorage.setItem('video_key', videoConfig.key);
     localStorage.setItem('video_base', videoConfig.baseUrl);
     localStorage.setItem('video_model', videoConfig.model);
  }, [videoConfig]);
  useEffect(() => {
     localStorage.setItem('translator_provider', translatorConfig.provider);
     localStorage.setItem('translator_key', translatorConfig.key);
     localStorage.setItem('translator_base', translatorConfig.baseUrl);
     localStorage.setItem('translator_model', translatorConfig.model);
  }, [translatorConfig]);
  
  useEffect(() => {
     localStorage.setItem('tts_provider', audioConfig.provider);
     localStorage.setItem('tts_key', audioConfig.key);
     localStorage.setItem('tts_voice', audioConfig.voiceID);
     localStorage.setItem('tts_base', audioConfig.baseUrl || '');
     localStorage.setItem('tts_model', audioConfig.model || '');
  }, [audioConfig]);

  // Textbook Logic
  const handleImportTextbook = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) {
              setTextbook(text);
              alert(t('update_success'));
          }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveTextbook = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(t('remove_textbook') + '?')) {
          setTextbook('');
      }
  };

  const handleOpenSettings = (tab: 'persona'|'chat'|'live'|'content'|'audio'|'image'|'video'|'translator' = 'persona') => {
      setSettingsTab(tab);
      setShowSettings(true);
  };

  // Logic
  const handleGenerateLesson = async (topic: Topic) => {
    setActiveTopic(topic);
    setCurrentSessionId(null); // New session start
    setInitialHistory([]);
    
    // Check Cache
    const cacheKey = `${topic.id}_${lang}`;
    if (lessonCache[cacheKey]) {
        console.log("Cache hit for", cacheKey);
        setLessonData(lessonCache[cacheKey]);
        setViewState('WARMUP');
        return;
    }

    setIsGenerating(true);
    setLoadingText(t('creating')); // Set context-specific loading text
    
    try {
        const explainLang = lang === 'zh' ? 'Chinese' : 'English definition';
        const textbookContext = textbook 
            ? `\n[CRITICAL: Use the following TEXTBOOK CONTENT to generate vocabulary, grammar, and dialogue. Prioritize words and patterns found here.]\nTEXTBOOK CONTENT:\n"${textbook.substring(0, 3000)}..."\n` 
            : "";

        const prompt = `Generate an ESL lesson plan for: "${topic.titleEn}".
        Scenario: ${topic.prompt}. 
        Role/Style: ${topic.role}.
        ${textbookContext}
        
        STRICTLY RETURN PURE JSON ONLY. No markdown. No comments.
        Structure:
        {
           "vocabulary": [{"en": "word", "type": "n./v./adj.", "zh": "${explainLang}"}],
           "expressions": [{"en": "idiom or phrase", "zh": "${explainLang}", "explanation": "brief usage note"}],
           "grammar": [{"title": "Grammar/Skill Point", "explanation": "Short explanation", "exampleEn": "Example sentence", "exampleZh": "Translation"}],
           "dialogue": [{"role": "${topic.role}", "en": "sentence (match style/tone of role)", "zh": "${explainLang}"}, {"role": "Student", "en": "...", "zh": "..."}] (min 4 lines)
        }`;
        
        const jsonStr = await callLLM(contentConfig, prompt, "", true);
        const data = parseJSON(jsonStr);
        
        // Ensure arrays exist
        if (!data.grammar) data.grammar = [];
        if (!data.expressions) data.expressions = [];
        
        setLessonData(data);
        
        // Update Cache
        setLessonCache(prev => ({ ...prev, [cacheKey]: data }));

        setViewState('WARMUP');
    } catch (e) {
        alert(`${t('error_fetch')}: ${(e as Error).message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const updateTrending = async () => {
      setIsGenerating(true);
      setLoadingText(t('searching')); // Set context-specific loading text
      
      try {
          // Provide strictly formatted example in prompt to ensure validity
          const prompt = `Generate 4 trending discussion topics for ESL students. Date: ${new Date().toDateString()}.
          STRICTLY RETURN PURE JSON ARRAY. No markdown.
          Example:
          [{"id": "t1", "titleZh": "AI Impact", "titleEn": "AI Impact", "icon": "cpu", "prompt": "Talk about AI", "role": "Expert"}]
          
          Icons can be: sparkles, plane, coins, coffee, user, briefcase, banknote, book, message-circle, clock, zap, trending-up, rocket, skull, ghost, heart, gamepad, music, camera.`;
          
          const jsonStr = await callLLM(contentConfig, prompt, "", true);
          const data = parseJSON(jsonStr);
          if (Array.isArray(data)) {
              setTrending(data);
              localStorage.setItem('trending_topics', JSON.stringify(data));
              // Removed simple alert, the visual feedback is enough
          } else {
              throw new Error("Invalid Format");
          }
      } catch (e) {
          alert((e as Error).message);
      } finally {
          setIsGenerating(false);
      }
  };

  const saveHistory = (messages: Message[]) => {
      if (messages.length === 0) return;
      if (!activeTopic) return;
      
      const timestamp = Date.now();
      const summary = messages[messages.length - 1].textEn;

      setHistory(prev => {
          // If we have a current Session ID, update that session
          if (currentSessionId) {
              return prev.map(s => s.id === currentSessionId ? { ...s, messages, timestamp, summary } : s).sort((a,b) => b.timestamp - a.timestamp);
          }
          // Else create new
          const newSession: ChatSession = {
              id: Date.now().toString(),
              timestamp,
              topic: activeTopic,
              persona,
              messages,
              lessonData,
              summary
          };
          return [newSession, ...prev].slice(0, 50); // Keep last 50
      });
  };

  const handleResumeSession = (session: ChatSession) => {
      setActiveTopic(session.topic);
      setPersona(session.persona);
      setLessonData(session.lessonData || null);
      setInitialHistory(session.messages);
      setCurrentSessionId(session.id);
      setShowHistory(false);
      setViewState('CHAT');
  };

  const handleDeleteSession = (id: string) => {
      if(confirm(t('delete_confirm'))) {
          setHistory(prev => prev.filter(s => s.id !== id));
      }
  };

  // Determine initial message for Active Start
  const getInitialMessage = () => {
      if (!activeTopic) return undefined;
      
      // If we have lesson data, try to use the first line of dialogue if it belongs to the AI role
      if (lessonData && lessonData.dialogue && lessonData.dialogue.length > 0) {
          const firstLine = lessonData.dialogue[0];
          // Simple check: if the role matches the topic role or is generic 'A'/'Teacher' etc
          // But safer is just to have a standard opening based on the topic.
          return `Let's practice the conversation about "${activeTopic.titleEn}". I'll start:\n\n"${firstLine.en}"`;
      }
      
      return `Hello! I'm ready to talk about "${activeTopic.titleEn}". Shall we begin?`;
  };

  if (viewState === 'WARMUP' && lessonData && activeTopic) {
    return (
        <>
            {isGenerating && <AuroraLoader text={loadingText} />}
            <LessonView 
                topic={activeTopic} 
                data={lessonData} 
                persona={persona}
                lang={lang}
                audioConfig={audioConfig}
                t={t}
                onBack={() => setViewState('HOME')} 
                onStartChat={() => {
                    setCurrentSessionId(null); // Explicitly new session
                    setInitialHistory([]);
                    setViewState('CHAT');
                }}
            />
        </>
    );
  }

  if (viewState === 'CHAT' && activeTopic) {
    return <ChatInterface 
        topic={activeTopic} 
        persona={persona} 
        chatConfig={chatConfig}
        liveConfig={liveConfig}
        audioConfig={audioConfig}
        translatorConfig={translatorConfig}
        lessonData={lessonData}
        initialMessage={getInitialMessage()}
        initialHistory={initialHistory}
        lang={lang}
        t={t}
        onBack={(msgs) => {
            saveHistory(msgs);
            setViewState('HOME');
        }}
        onOpenSettings={handleOpenSettings}
    />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors relative overflow-hidden">
      {/* Loading Overlay */}
      {isGenerating && <AuroraLoader text={loadingText} />}

      {/* Background Decorative Blurs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent dark:from-indigo-950/30 pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          initialTab={settingsTab}
          lang={lang} setLang={setLang}
          themeMode={themeMode} setThemeMode={setThemeMode}
          chatConfig={chatConfig} setChatConfig={setChatConfig}
          liveConfig={liveConfig} setLiveConfig={setLiveConfig}
          contentConfig={contentConfig} setContentConfig={setContentConfig}
          imageConfig={imageConfig} setImageConfig={setImageConfig}
          videoConfig={videoConfig} setVideoConfig={setVideoConfig}
          translatorConfig={translatorConfig} setTranslatorConfig={setTranslatorConfig}
          audioConfig={audioConfig} setAudioConfig={setAudioConfig}
          persona={persona} setPersona={setPersona}
          t={t}
        />
      )}

      {showTranslator && (
        <TranslationModal 
          onClose={() => setShowTranslator(false)}
          config={translatorConfig}
          t={t}
        />
      )}

      {showHistory && (
          <HistoryModal 
            onClose={() => setShowHistory(false)}
            history={history}
            onResume={handleResumeSession}
            onDelete={handleDeleteSession}
            onClear={() => { if(confirm(t('delete_confirm'))) setHistory([]); }}
            t={t}
            lang={lang}
          />
      )}

      {/* Header */}
      <div className="pt-8 pb-2 px-6 sticky top-0 z-20 backdrop-blur-sm bg-slate-50/80 dark:bg-slate-950/80 transition-colors">
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
               <Logo />
               <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    {t('app_title')}
                  </h1>
                  <p className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 uppercase tracking-[0.15em] mt-1">
                    {t('slogan')}
                  </p>
               </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowTranslator(true)} className="w-10 h-10 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-white dark:hover:bg-slate-800">
                   <Globe className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button onClick={() => handleOpenSettings('persona')} className="w-10 h-10 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-white dark:hover:bg-slate-800">
                   <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
            </div>
         </div>
      </div>

      <div className="px-6 space-y-8 relative z-10">
         {/* Persona Card - Glassmorphism Style */}
         <div className="relative group cursor-pointer" onClick={() => {
                setActiveTopic({ id: 'free', titleEn: 'Free Talk', titleZh: '自由对话', prompt: 'Casual conversation', role: 'Friend', icon: 'message-circle' });
                setLessonData(null); // Clear previous lesson data for free talk
                setViewState('CHAT');
                setCurrentSessionId(null);
                setInitialHistory([]);
         }}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] transform rotate-1 group-hover:rotate-2 transition-transform opacity-70 blur-sm"></div>
            <div className="relative bg-white/10 dark:bg-black/20 backdrop-filter backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] p-6 text-white overflow-hidden shadow-2xl">
                
                {/* Content */}
                <div className="relative z-10 pr-24">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-300" /> {t('current_partner')}
                        </span>
                    </div>
                    <h2 className="text-4xl font-black mb-1 tracking-tight">
                        {lang === 'zh' ? (persona.nameZh || persona.name) : persona.name}
                    </h2>
                    <p className="text-sm font-medium text-indigo-100 mb-6 flex items-center gap-2">
                        {persona.nationality} <span className="w-1 h-1 rounded-full bg-white/40"></span> 
                        {lang === 'zh' ? (persona.professionZh || persona.profession) : persona.profession}
                    </p>
                    
                    <button className="bg-white text-indigo-600 text-xs font-bold px-6 py-3 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-transform hover:bg-indigo-50 flex items-center gap-2">
                        {t('chat_now')} <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Avatar - Updated to 'micah' style for a creative look */}
                <img 
                    src={`https://api.dicebear.com/9.x/micah/svg?seed=${persona.name}&mouth=smile,pucker,laughing&baseColor=f9c9b6,ac6651`} 
                    className="absolute -bottom-6 -right-6 w-48 h-48 drop-shadow-2xl filter brightness-110 contrast-125 transform group-hover:scale-105 transition-transform duration-500" 
                    alt="persona"
                />
            </div>
         </div>
         
         {/* Quick Actions */}
         <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <button 
                onClick={() => setShowHistory(true)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-28 group hover:border-orange-200 dark:hover:border-orange-900 transition-all active:scale-[0.98]"
            >
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('recent')}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {history.length > 0 ? `${history.length} chats` : t('no_history')}
                    </p>
                </div>
            </button>
            
            <div className="relative">
                <input 
                    type="file" 
                    accept=".txt" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImportTextbook} 
                />
                <button 
                    onClick={() => !textbook && fileInputRef.current?.click()}
                    className={`w-full h-28 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border flex flex-col justify-between group transition-all active:scale-[0.98] ${textbook ? 'border-indigo-500/50 ring-2 ring-indigo-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'}`}
                >
                    <div className="flex justify-between items-start w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${textbook ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
                            {textbook ? <Book className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                        {textbook && (
                            <div onClick={handleRemoveTextbook} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div className="text-left w-full">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate w-full">
                            {textbook ? t('textbook_active') : t('textbook')}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {textbook ? (lang === 'zh' ? '已导入内容' : 'Content loaded') : t('new_concept')}
                        </p>
                    </div>
                </button>
            </div>
         </div>

         {/* Trending Section */}
         <section className="animate-in slide-in-from-top-4 duration-500">
            {trending.length > 0 ? (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> {t('trending_now')}
                        </h2>
                        <button onClick={updateTrending} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                            {t('refresh')} <Zap className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {trending.map(t => (
                            <button key={t.id} onClick={() => handleGenerateLesson(t)} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all text-left group">
                                <div className="mb-3 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">{getIcon(t.icon, "w-4 h-4")}</div>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{lang==='zh'?t.titleZh:t.titleEn}</div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                // Hero Button State when Empty
                <button onClick={updateTrending} className="w-full relative overflow-hidden rounded-[2rem] shadow-xl group transition-all active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    
                    <div className="relative p-6 flex items-center justify-between z-10">
                        <div className="text-left space-y-1">
                            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-200 animate-pulse" /> 
                                {t('trending_explore')}
                            </h3>
                            <p className="text-xs font-medium text-indigo-100 max-w-[80%] leading-relaxed">
                                {t('trending_desc')}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner group-hover:rotate-12 transition-transform">
                            <Zap className="w-6 h-6 fill-white" />
                        </div>
                    </div>
                </button>
            )}
         </section>

         {/* Static Topics */}
         <div className="space-y-6 pb-6">
            {STATIC_TOPICS.map((cat, i) => (
                <section key={i} className="animate-in slide-in-from-bottom-4 duration-500" style={{animationDelay: `${i*100}ms`}}>
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-4 ml-1 uppercase tracking-wider">{lang==='zh'?cat.categoryZh:cat.categoryEn}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {cat.items.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => handleGenerateLesson(item)}
                                className="group relative bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">{lang==='zh'?item.titleZh:item.titleEn}</span>
                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all z-10">
                                    {getIcon(item.icon, "w-4 h-4")}
                                </div>
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity z-0"></div>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
         </div>
      </div>
    </div>
  );
}

export default App;