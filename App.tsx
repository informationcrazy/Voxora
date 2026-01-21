import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, FileText, Book, MoreHorizontal, Settings, Clock, BookOpen, Zap, TrendingUp, ChevronRight, Upload, X, Trash2, AudioWaveform, Sparkles } from 'lucide-react';
import { I18N, STATIC_TOPICS, getIcon, PROVIDER_MAP } from './constants';
import { ViewState, Topic, LessonData, AIConfig, AudioConfig, Persona, Lang, Theme } from './types';
import { callLLM, parseJSON } from './utils';

import LessonView from './components/LessonView';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';

const Logo = ({ className }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl rotate-6 opacity-20 blur-sm"></div>
     <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 p-2.5 rounded-xl shadow-xl flex items-center justify-center">
        <AudioWaveform className="w-5 h-5" strokeWidth={2.5} />
     </div>
  </div>
);

function App() {
  // State
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('app_lang') as Lang) || 'zh');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'light');
  const t = (k: string) => I18N[lang][k as keyof typeof I18N['zh']] || k;

  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [textbook, setTextbook] = useState<string>(() => localStorage.getItem('textbook_content') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configs
  const [chatConfig, setChatConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('chat_provider') as any) || 'gemini',
    key: localStorage.getItem('chat_key') || '',
    baseUrl: localStorage.getItem('chat_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('chat_model') || 'gemini-3-flash-preview'
  }));

  const [contentConfig, setContentConfig] = useState<AIConfig>(() => ({
    provider: (localStorage.getItem('content_provider') as any) || 'gemini',
    key: localStorage.getItem('content_key') || '',
    baseUrl: localStorage.getItem('content_base') || 'https://generativelanguage.googleapis.com',
    model: localStorage.getItem('content_model') || 'gemini-3-flash-preview'
  }));

  const [audioConfig, setAudioConfig] = useState<AudioConfig>(() => ({
    provider: (localStorage.getItem('tts_provider') as any) || 'browser',
    voiceID: localStorage.getItem('tts_voice') || '',
    key: localStorage.getItem('tts_key') || ''
  }));

  const [persona, setPersona] = useState<Persona>(() => {
    const s = localStorage.getItem('ai_persona');
    return s ? JSON.parse(s) : {
        name: "Jenny", age: "24", gender: "Female", nationality: "British",
        profession: "ESL Tutor", personality: "Friendly & Encouraging", interests: "Travel"
    };
  });

  const [trending, setTrending] = useState<Topic[]>(() => {
      const s = localStorage.getItem('trending_topics');
      return s ? JSON.parse(s) : [];
  });

  // Persistence
  useEffect(() => localStorage.setItem('app_lang', lang), [lang]);
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => localStorage.setItem('ai_persona', JSON.stringify(persona)), [persona]);
  useEffect(() => localStorage.setItem('textbook_content', textbook), [textbook]);
  
  useEffect(() => {
     localStorage.setItem('chat_provider', chatConfig.provider);
     localStorage.setItem('chat_key', chatConfig.key);
     localStorage.setItem('chat_base', chatConfig.baseUrl);
     localStorage.setItem('chat_model', chatConfig.model);
  }, [chatConfig]);
  useEffect(() => {
     localStorage.setItem('content_provider', contentConfig.provider);
     localStorage.setItem('content_key', contentConfig.key);
     localStorage.setItem('content_base', contentConfig.baseUrl);
     localStorage.setItem('content_model', contentConfig.model);
  }, [contentConfig]);

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

  // Logic
  const handleGenerateLesson = async (topic: Topic) => {
    setActiveTopic(topic);
    setIsGenerating(true);
    
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
        setViewState('WARMUP');
    } catch (e) {
        alert(`${t('error_fetch')}: ${(e as Error).message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const updateTrending = async () => {
      setIsGenerating(true);
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
              alert(t('update_success'));
          } else {
              throw new Error("Invalid Format");
          }
      } catch (e) {
          alert((e as Error).message);
      } finally {
          setIsGenerating(false);
      }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent dark:from-indigo-950/30 pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

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
                <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-white dark:hover:bg-slate-800">
                   <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
            </div>
         </div>
      </div>

      <div className="px-6 space-y-8 relative z-10">
         {/* Persona Card - Glassmorphism Style */}
         <div className="relative group cursor-pointer" onClick={() => {
                setActiveTopic({ id: 'free', titleEn: 'Free Talk', titleZh: '自由对话', prompt: 'Casual conversation', role: 'Friend', icon: 'message-circle' });
                setViewState('CHAT');
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
                    <h2 className="text-4xl font-black mb-1 tracking-tight">{persona.name}</h2>
                    <p className="text-sm font-medium text-indigo-100 mb-6 flex items-center gap-2">
                        {persona.nationality} <span className="w-1 h-1 rounded-full bg-white/40"></span> {persona.profession}
                    </p>
                    
                    <button className="bg-white text-indigo-600 text-xs font-bold px-6 py-3 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-transform hover:bg-indigo-50 flex items-center gap-2">
                        {t('chat_now')} <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                {/* Avatar */}
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.name}&gender=${persona.gender.toLowerCase() === 'male' ? 'male' : 'female'}`} 
                    className="absolute -bottom-6 -right-6 w-48 h-48 drop-shadow-2xl filter brightness-110 contrast-125 transform group-hover:scale-105 transition-transform duration-500" 
                    alt="persona"
                />
            </div>
         </div>
         
         {/* Quick Actions */}
         <div className="grid grid-cols-2 gap-4">
            <button className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-28 group hover:border-orange-200 dark:hover:border-orange-900 transition-all active:scale-[0.98]">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('recent')}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t('no_history')}</p>
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
         {trending.length > 0 && (
             <section className="animate-in slide-in-from-top-4 duration-500">
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
             </section>
         )}

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

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-950 min-h-screen shadow-2xl overflow-hidden relative font-sans transition-colors">
      {viewState === 'HOME' && renderHome()}
      
      {viewState === 'WARMUP' && activeTopic && lessonData && (
        <LessonView 
            topic={activeTopic} 
            data={lessonData} 
            persona={persona}
            lang={lang}
            t={t}
            onBack={() => setViewState('HOME')}
            onStartChat={() => setViewState('CHAT')}
        />
      )}

      {viewState === 'CHAT' && activeTopic && (
        <ChatInterface 
            topic={activeTopic}
            persona={persona}
            chatConfig={chatConfig}
            audioConfig={audioConfig}
            lang={lang}
            t={t}
            initialMessage={viewState === 'CHAT' && activeTopic.id !== 'free' ? `Hi! I'm ${persona.name}. Ready to talk about ${activeTopic.titleEn}?` : undefined}
            onBack={() => setViewState(activeTopic.id === 'free' ? 'HOME' : 'WARMUP')}
        />
      )}

      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)} 
            lang={lang} setLang={setLang}
            theme={theme} setTheme={setTheme}
            chatConfig={chatConfig} setChatConfig={setChatConfig}
            contentConfig={contentConfig} setContentConfig={setContentConfig}
            audioConfig={audioConfig} setAudioConfig={setAudioConfig}
            persona={persona} setPersona={setPersona}
            t={t}
        />
      )}

      {isGenerating && (
         <div className="fixed inset-0 z-[80] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center flex-col">
            <div className="relative w-20 h-20 mb-6">
                 <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                 <div className="absolute inset-2 bg-indigo-600 rounded-full opacity-30 animate-pulse"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" style={{animationDuration: '3s'}} />
                 </div>
            </div>
            <p className="text-base font-bold text-slate-800 dark:text-white tracking-wide">{t('generating')}</p>
         </div>
      )}
    </div>
  );
}

export default App;