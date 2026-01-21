import React, { useState } from 'react';
import { X, Languages, ArrowRight, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { AIConfig } from '../types';
import { callLLM, parseJSON } from '../utils';

interface TranslationModalProps {
  onClose: () => void;
  config: AIConfig;
  t: (k: string) => string;
}

const TranslationModal: React.FC<TranslationModalProps> = ({ onClose, config, t }) => {
  const [inputText, setInputText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [results, setResults] = useState<{lang: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleLang = (code: string) => {
    setSelectedLangs(prev => 
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (!inputText.trim() || selectedLangs.length === 0) return;
    setLoading(true);
    setResults([]);

    try {
      // Map codes to full English names for the prompt
      const targetLangNames = selectedLangs.map(code => 
        SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code
      );

      const prompt = `Translate the following source text into these languages: ${targetLangNames.join(', ')}.
      
      SOURCE TEXT:
      "${inputText}"

      STRICTLY RETURN JSON ARRAY. No markdown blocks.
      Format: [{"lang": "Language Name", "text": "Translated Text"}]
      `;

      const jsonStr = await callLLM(config, prompt, "", true);
      const data = parseJSON(jsonStr);
      
      if (Array.isArray(data)) {
        setResults(data);
      }
    } catch (e) {
      alert(`Translation failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('translator')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('translator_desc')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('source_text')}</label>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none transition-all text-sm leading-relaxed"
              placeholder="..."
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between">
                {t('target_langs')}
                <span className="text-indigo-500">{selectedLangs.length} selected</span>
             </label>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = selectedLangs.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => toggleLang(lang.code)}
                      className={`p-2 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  )
                })}
             </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText || selectedLangs.length === 0}
            className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg disabled:opacity-50 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
            {loading ? t('translating') : t('translate_btn')}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2 animate-in slide-in-from-bottom-4">
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full mb-4"></div>
              {results.map((res, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-600">
                      {res.lang}
                    </span>
                    <button 
                      onClick={() => handleCopy(res.text, idx)}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={t('copy')}
                    >
                      {copiedIndex === idx ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed pr-8 whitespace-pre-wrap">
                    {res.text}
                  </p>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;