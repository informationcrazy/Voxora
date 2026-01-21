import React from 'react';
import { ArrowLeft, Volume2, BookOpen, MessageCircle, PenTool, Sparkles, Quote } from 'lucide-react';
import { LessonData, Topic, Persona, Lang } from '../types';

interface LessonViewProps {
  topic: Topic;
  data: LessonData;
  persona: Persona;
  lang: Lang;
  t: (k: string) => string;
  onBack: () => void;
  onStartChat: () => void;
}

const LessonView: React.FC<LessonViewProps> = ({ topic, data, persona, lang, t, onBack, onStartChat }) => {
  const playAudio = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] dark:bg-slate-950 pb-24 transition-colors">
      <div className="sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-20 px-4 h-14 flex items-center gap-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white">{t('lesson_prep')}</h1>
      </div>

      <div className="p-5 space-y-8">
        <div>
           <h2 className="text-2xl font-black text-slate-800 dark:text-white">{lang==='zh' ? topic.titleZh : topic.titleEn}</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{lang==='zh' ? topic.titleEn : topic.titleZh}</p>
        </div>

        {/* 1. Vocabulary */}
        <section>
           <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
             <span className="text-lg">✍️</span>
             <h3 className="font-bold text-base">{t('vocabulary')}</h3>
           </div>
           <div className="grid grid-cols-2 gap-3">
             {data.vocabulary.map((item, idx) => (
               <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-start group transition-colors">
                 <div className="flex-1 min-w-0 pr-2">
                   <div className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">{item.en}</div>
                   <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{item.type} {item.zh}</div>
                 </div>
                 <button onClick={() => playAudio(item.en)} className="mt-0.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    <Volume2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
        </section>

        {/* 2. Expressions (New Section) */}
        {data.expressions && data.expressions.length > 0 && (
          <section>
             <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
               <Sparkles className="w-5 h-5 text-yellow-500" />
               <h3 className="font-bold text-base">{t('expressions')}</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
               {data.expressions.map((item, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-start group transition-colors">
                   <div className="flex-1 min-w-0 pr-2">
                     <div className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.en}</div>
                     <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.zh}</div>
                     {item.explanation && (
                       <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1.5 font-medium bg-indigo-50 dark:bg-indigo-900/30 inline-block px-1.5 py-0.5 rounded">
                         💡 {item.explanation}
                       </div>
                     )}
                   </div>
                   <button onClick={() => playAudio(item.en)} className="mt-0.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      <Volume2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
          </section>
        )}

        {/* 3. Language Skills / Grammar */}
        {data.grammar && data.grammar.length > 0 && (
            <section>
                <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-base">{t('language_skills')}</h3>
                </div>
                <div className="space-y-4">
                    {data.grammar.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-1.5">{item.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{item.explanation}</p>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 relative">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 pr-8 text-sm leading-relaxed">{item.exampleEn}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{item.exampleZh}</p>
                                <button onClick={() => playAudio(item.exampleEn)} className="absolute right-3 top-3.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400">
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* 4. Dialogue */}
        <section>
            <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                <Quote className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base">{t('dialogue')}</h3>
            </div>
            <div className="space-y-3">
                {data.dialogue.map((line, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${line.role === topic.role || line.role === 'A' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'}`}>
                            {line.role}
                        </span>
                        <button onClick={() => playAudio(line.en)} className="text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400">
                            <Volume2 className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 leading-snug">{line.en}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 border-t border-slate-50 dark:border-slate-800 pt-2">{line.zh}</p>
                    </div>
                ))}
            </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 safe-area-bottom z-30 max-w-md mx-auto">
        <button 
          onClick={onStartChat}
          className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-indigo-700"
        >
          {t('start_chat_with')} {persona.name}
        </button>
      </div>
    </div>
  );
};

export default LessonView;
