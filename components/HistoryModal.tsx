import React from 'react';
import { X, Clock, Trash2, MessageSquare, ChevronRight, Calendar } from 'lucide-react';
import { ChatSession, Lang } from '../types';
import { getIcon } from '../constants';

interface HistoryModalProps {
  onClose: () => void;
  history: ChatSession[];
  onResume: (session: ChatSession) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  t: (k: string) => string;
  lang: Lang;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, history, onResume, onDelete, onClear, t, lang }) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('history_title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{history.length} {t('recent').toLowerCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
           {history.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                   <Clock className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-sm font-medium opacity-50">{t('history_empty')}</p>
               </div>
           ) : (
               history.map(session => (
                   <div key={session.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group relative">
                       <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                               <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                                   {getIcon(session.topic.icon, "w-4 h-4")}
                               </span>
                               <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                   <Calendar className="w-3 h-3" /> {formatDate(session.timestamp)}
                               </span>
                           </div>
                           <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                           >
                               <Trash2 className="w-4 h-4" />
                           </button>
                       </div>
                       
                       <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">
                           {lang === 'zh' ? session.topic.titleZh : session.topic.titleEn}
                       </h3>
                       
                       <div className="flex items-center gap-2 mb-3">
                           <img 
                                src={`https://api.dicebear.com/9.x/micah/svg?seed=${session.persona.name}&mouth=smile,pucker,laughing&baseColor=f9c9b6,ac6651`} 
                                className="w-5 h-5 rounded-full bg-slate-100" 
                                alt="avatar"
                            />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                with {session.persona.name}
                            </span>
                       </div>

                       <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl line-clamp-2 mb-3 border border-slate-100 dark:border-slate-700/50 italic">
                           "{session.summary || session.messages[session.messages.length - 1]?.textEn || '...'}"
                       </div>

                       <button 
                           onClick={() => onResume(session)}
                           className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 hover:bg-slate-800 dark:hover:bg-slate-600"
                       >
                           {t('history_resume')} <ChevronRight className="w-3 h-3" />
                       </button>
                   </div>
               ))
           )}
        </div>
        
        {history.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button onClick={onClear} className="w-full py-3 text-red-500 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    {t('history_clear')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;