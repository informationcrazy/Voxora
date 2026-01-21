import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Dice5, Moon, Sun, UserPlus, Check, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { PROVIDER_MAP, getPresets, COUNTRIES, GEMINI_VOICES } from '../constants';
import { AIConfig, AudioConfig, Persona, Theme } from '../types';
import { fetchModels, testConnection } from '../utils';

interface SettingsModalProps {
  onClose: () => void;
  lang: 'zh' | 'en';
  setLang: (l: 'zh' | 'en') => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  chatConfig: AIConfig;
  setChatConfig: (c: AIConfig) => void;
  contentConfig: AIConfig;
  setContentConfig: (c: AIConfig) => void;
  audioConfig: AudioConfig;
  setAudioConfig: (c: AudioConfig) => void;
  persona: Persona;
  setPersona: (p: Persona) => void;
  t: (k: string) => string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose, lang, setLang, theme, setTheme,
  chatConfig, setChatConfig,
  contentConfig, setContentConfig,
  audioConfig, setAudioConfig,
  persona, setPersona, t
}) => {
  const [tab, setTab] = useState<'persona'|'chat'|'content'|'audio'>('persona');
  const [availableModels, setAvailableModels] = useState<{chat: string[], content: string[]}>({ chat: [], content: [] });
  const [loadingModels, setLoadingModels] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setBrowserVoices(window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')));
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const handleFetchModels = async (type: 'chat' | 'content') => {
    const config = type === 'chat' ? chatConfig : contentConfig;
    setLoadingModels(true);
    try {
      const list = await fetchModels(config);
      setAvailableModels(prev => ({ ...prev, [type]: list }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoadingModels(false);
    }
  };

  const currentPresets = getPresets(lang);

  const handleRandomPersona = () => {
    const random = currentPresets[Math.floor(Math.random() * currentPresets.length)];
    setPersona(random);
  };

  const ConfigForm = ({ type, config, setConfig }: { type: 'chat'|'content', config: AIConfig, setConfig: (c: AIConfig) => void }) => {
    const models = availableModels[type];
    const [status, setStatus] = useState<'idle'|'testing'|'valid'|'error'>('idle');

    const handleTest = async () => {
        setStatus('testing');
        try {
            await testConnection(config);
            setStatus('valid');
            if (config.provider !== 'gemini') handleFetchModels(type);
        } catch(e) {
            setStatus('error');
            alert((e as Error).message);
        }
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus('idle');
        const newProvider = e.target.value as AIConfig['provider'];
        const preset = PROVIDER_MAP[newProvider];
        
        // Load saved key for this specific provider if it exists
        const savedKey = localStorage.getItem(`kv_${type}_${newProvider}`) || '';

        setConfig({
            ...config, 
            provider: newProvider,
            key: savedKey, // Switch to the key saved for this provider
            baseUrl: preset ? preset.baseUrl : '',
            model: preset ? preset.defaultModel : ''
        });
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setConfig({...config, key: val});
        setStatus('idle');
        // Save key specifically for this provider
        localStorage.setItem(`kv_${type}_${config.provider}`, val);
    };
    
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">{type === 'chat' ? t('engine_chat') : t('engine_content')}</h3>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{PROVIDER_MAP[config.provider]?.name || config.provider}</p>
        </div>
        
        <select 
          value={config.provider} 
          onChange={handleProviderChange}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-bold border-none"
        >
          {Object.entries(PROVIDER_MAP).map(([k,v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>

        <div className="relative">
             <input 
              type="password" 
              value={config.key} 
              onChange={handleKeyChange}
              className={`w-full p-3 pr-24 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all border ${status === 'error' ? 'border-red-500' : status === 'valid' ? 'border-green-500' : 'border-transparent'}`} 
              placeholder={t('api_key')} 
            />
            <button 
                onClick={handleTest}
                disabled={status === 'testing' || !config.key}
                className="absolute right-2 top-2 bottom-2 px-3 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
                {status === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === 'valid' && <Check className="w-3 h-3 text-green-600" />}
                {status === 'error' && <AlertCircle className="w-3 h-3 text-red-600" />}
                {status === 'idle' && t('check_key')}
            </button>
        </div>

        {config.provider !== 'gemini' && (
          <input 
              type="text" 
              value={config.baseUrl} 
              onChange={e => setConfig({...config, baseUrl: e.target.value})} 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder={t('base_url')} 
          />
        )}

        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('model')}</label>
          <button onClick={() => handleFetchModels(type)} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex gap-1 items-center">
              {loadingModels ? t('loading') : t('refresh')} <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <select 
          value={config.model} 
          onChange={e => setConfig({...config, model: e.target.value})} 
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono"
        >
          <option value={config.model}>{config.model || "Select..."}</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <input 
          type="text" 
          value={config.model} 
          onChange={e => setConfig({...config, model: e.target.value})} 
          className="w-full p-2 text-[10px] border-b dark:border-slate-700 outline-none bg-transparent dark:text-white" 
          placeholder={t('manual_model')} 
        />
      </div>
    );
  };

  const handleAudioProviderChange = (newProvider: AudioConfig['provider']) => {
      // Load saved key for this provider
      const savedKey = localStorage.getItem(`kv_audio_${newProvider}`) || '';
      setAudioConfig({ ...audioConfig, provider: newProvider, key: savedKey });
  };

  const handleAudioKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setAudioConfig({ ...audioConfig, key: val });
      localStorage.setItem(`kv_audio_${audioConfig.provider}`, val);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[70] flex flex-col animate-in slide-in-from-bottom-10 transition-colors">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">{t('settings')}</h2>
        <div className="flex gap-3 items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-2 py-1 text-slate-500 dark:text-slate-300 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setLang('zh')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang==='zh'?'bg-white dark:bg-slate-700 shadow dark:text-white':'text-slate-500 dark:text-slate-400'}`}>🇨🇳</button>
            <button onClick={() => setLang('en')} className={`px-2 py-1 text-[10px] font-bold rounded ${lang==='en'?'bg-white dark:bg-slate-700 shadow dark:text-white':'text-slate-500 dark:text-slate-400'}`}>🇺🇸</button>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950 mx-6 mt-4 rounded-xl overflow-x-auto no-scrollbar">
        {['persona', 'chat', 'content', 'audio'].map((tName) => (
            <button 
                key={tName} 
                onClick={() => setTab(tName as any)} 
                className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${tab===tName ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
                {t('tab_'+tName)}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tab === 'persona' && (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-4 items-center">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.name}&gender=${persona.gender.toLowerCase() === 'male' ? 'male' : 'female'}`} 
                        className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-sm bg-white dark:bg-slate-700" 
                        alt="avatar"
                    />
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">{t('persona_profile')}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('persona_desc')}</p>
                    </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-2">
                        <UserPlus className="w-4 h-4" /> {t('role_preset')}
                    </label>
                    <select 
                        onChange={(e) => {
                           const found = currentPresets.find(p => p.name === e.target.value);
                           if (found) setPersona(found);
                        }}
                        className="w-full p-3 bg-white dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none shadow-sm"
                        defaultValue=""
                    >
                        <option value="" disabled>{t('select_preset')}</option>
                        {currentPresets.map(p => (
                            <option key={p.name} value={p.name}>{p.name} ({p.profession})</option>
                        ))}
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('name')}</label>
                        <div className="flex gap-1">
                            <input 
                                value={persona.name} 
                                onChange={e => setPersona({...persona, name: e.target.value})} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none" 
                            />
                            <button 
                                onClick={handleRandomPersona} 
                                className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300 hover:text-blue-600"
                            >
                                <Dice5 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div>
                         <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('age')}</label>
                         <input 
                            value={persona.age} 
                            onChange={e => setPersona({...persona, age: e.target.value})} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none"
                         />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('gender')}</label>
                        <select 
                            value={persona.gender} 
                            onChange={e => setPersona({...persona, gender: e.target.value})} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none"
                        >
                            <option>Female</option>
                            <option>Male</option>
                            <option>Non-binary</option>
                            <option>Other</option>
                            <option>Fluid</option>
                            <option>N/A</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('nationality')}</label>
                        <select 
                            value={persona.nationality} 
                            onChange={e => setPersona({...persona, nationality: e.target.value})} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none"
                        >
                             <option value={persona.nationality}>{persona.nationality}</option>
                             {COUNTRIES.filter(c => c !== persona.nationality).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('profession')}</label>
                    <input value={persona.profession} onChange={e => setPersona({...persona, profession: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('personality')}</label>
                    <input value={persona.personality} onChange={e => setPersona({...persona, personality: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{t('interests')}</label>
                    <input value={persona.interests} onChange={e => setPersona({...persona, interests: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none" />
                </div>
            </div>
        )}

        {tab === 'chat' && <ConfigForm type="chat" config={chatConfig} setConfig={setChatConfig} />}
        {tab === 'content' && <ConfigForm type="content" config={contentConfig} setConfig={setContentConfig} />}
        
        {tab === 'audio' && (
            <div className="space-y-4">
                 <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl"><h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-1">{t('engine_voice')}</h3></div>
                 <div className="grid grid-cols-2 gap-3">
                    {['browser', 'openai', 'gemini', 'custom'].map(p => {
                        const isActive = audioConfig.provider === p;
                        return (
                            <button 
                                key={p} 
                                onClick={() => handleAudioProviderChange(p as any)} 
                                className={`py-4 px-3 rounded-xl text-xs font-bold border-2 flex items-center justify-between transition-all ${isActive ? 
                                    (p==='browser'?'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500':
                                     p==='openai'?'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500':
                                     p==='gemini'?'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-500':
                                     'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500') 
                                    : 'border-transparent bg-slate-50 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <span className="capitalize">{p}</span>
                                {isActive && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                        )
                    })}
                 </div>
                 
                 {audioConfig.provider === 'browser' ? (
                     <select 
                        value={audioConfig.voiceID} 
                        onChange={e => setAudioConfig({...audioConfig, voiceID: e.target.value})} 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none"
                     >
                        {browserVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                     </select>
                 ) : (
                    <div className="space-y-2">
                        {audioConfig.provider === 'custom' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('tts_custom_url')}</label>
                                <input 
                                    type="text" 
                                    value={audioConfig.baseUrl} 
                                    onChange={e => setAudioConfig({...audioConfig, baseUrl: e.target.value})} 
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono" 
                                    placeholder="https://api.custom.com/v1"
                                />
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('tts_model')}</label>
                            {audioConfig.provider === 'gemini' ? (
                                <input 
                                    type="text" 
                                    value={audioConfig.model || 'gemini-2.5-flash-preview-tts'} 
                                    onChange={e => setAudioConfig({...audioConfig, model: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono"
                                    placeholder="gemini-2.5-flash-preview-tts"
                                />
                            ) : (
                                <input 
                                    type="text" 
                                    value={audioConfig.model || 'tts-1'} 
                                    onChange={e => setAudioConfig({...audioConfig, model: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono"
                                    placeholder={audioConfig.provider === 'custom' ? 'model-name' : 'tts-1'}
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('voice_id')}</label>
                             {audioConfig.provider === 'gemini' ? (
                                <select 
                                    value={audioConfig.voiceID} 
                                    onChange={e => setAudioConfig({...audioConfig, voiceID: e.target.value})} 
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm border-none"
                                 >
                                    {GEMINI_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                 </select>
                             ) : (
                                 <input 
                                    type="text" 
                                    value={audioConfig.voiceID} 
                                    onChange={e => setAudioConfig({...audioConfig, voiceID: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono"
                                    placeholder={audioConfig.provider === 'openai' ? 'alloy, echo, shimmer...' : 'Voice ID'}
                                 />
                             )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('api_key')}</label>
                            <input 
                                type="password" 
                                value={audioConfig.key} 
                                onChange={handleAudioKeyChange}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl text-sm font-mono" 
                                placeholder={t('api_key')}
                            />
                        </div>
                    </div>
                 )}
            </div>
        )}
      </div>
      
      <div className="p-6 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform hover:bg-slate-800 dark:hover:bg-slate-600">
            {t('save_close')}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;