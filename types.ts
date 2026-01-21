
export interface Vocabulary {
  en: string;
  type: string;
  zh: string;
}

export interface Expression {
  en: string;
  zh: string;
  explanation?: string;
}

export interface DialogueLine {
  role: string;
  en: string;
  zh: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  exampleEn: string;
  exampleZh: string;
}

export interface LessonData {
  vocabulary: Vocabulary[];
  expressions: Expression[];
  grammar: GrammarPoint[];
  dialogue: DialogueLine[];
}

export interface Topic {
  id: string;
  titleZh: string;
  titleEn: string;
  icon: string;
  prompt: string;
  role: string;
  category?: string;
}

export interface Persona {
  name: string;
  nameZh?: string;
  age: string;
  gender: string;
  nationality: string;
  profession: string;
  professionZh?: string;
  personality: string;
  interests: string;
  voiceId?: string;
}

export interface AIConfig {
  provider: 'gemini' | 'openai' | 'deepseek' | 'zhipu' | 'custom';
  key: string;
  baseUrl: string;
  model: string;
}

export interface AudioConfig {
  provider: 'browser' | 'openai' | 'gemini' | 'custom';
  voiceID: string;
  key: string;
  baseUrl?: string;
  model?: string;
}

export interface Message {
  role: 'user' | 'ai';
  textEn: string;
  textZh: string;
}

export interface ChatSession {
  id: string;
  timestamp: number;
  topic: Topic;
  persona: Persona;
  messages: Message[];
  lessonData?: LessonData | null;
  summary?: string; // Short preview text
}

export type ViewState = 'HOME' | 'WARMUP' | 'CHAT';
export type Lang = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';