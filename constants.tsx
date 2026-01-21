import React from 'react';
import { 
  Sparkles, Plane, Coins, Coffee, User, Briefcase, 
  Banknote, BookOpen, MessageCircle, Clock, Zap,
  TrendingUp, Settings2, Globe, Hash,
  Rocket, Skull, Ghost, Crown, Heart, Gamepad2, Lightbulb,
  Music, Camera, Baby, Palette
} from 'lucide-react';
import { Topic, Persona } from './types';

export const I18N = {
  zh: {
    app_title: "Voxora", slogan: "共鸣世界，声声不息", update: "更新", settings: "设置", 
    current_partner: "当前语伴", chat_now: "开始对话", edit_profile: "修改档案", recent: "最近使用", 
    continue: "继续", no_history: "暂无历史", textbook: "专属教材", new_concept: "导入文本/课本", 
    textbook_active: "教材已激活", remove_textbook: "移除教材",
    trending_now: "全球脉动", lesson_prep: "语境预习", start_chat_with: "开始对话：", 
    vocabulary: "核心词汇", expressions: "地道表达", dialogue: "场景对话", language_skills: "语言技巧",
    engine_chat: "对话引擎", engine_content: "内容引擎", engine_translator: "翻译引擎",
    engine_voice: "语音引擎", engine_live: "实时引擎", engine_image: "绘图引擎", engine_video: "视频引擎",
    provider: "服务商", model: "模型", api_key: "API Key", 
    base_url: "代理地址 (Base URL)", refresh: "刷新", loading: "加载中...", 
    persona_profile: "助手档案", persona_desc: "AI 将完全沉浸于此角色设定。", name: "姓名", 
    age: "年龄", gender: "性别", nationality: "国籍", profession: "职业", personality: "性格 (MBTI)", 
    interests: "兴趣爱好", save_settings: "保存设置", save_close: "保存并关闭", 
    manual_model: "手动输入模型名", tts_key_tip: "OpenAI TTS Key (必填)", 
    input_placeholder: "发送消息给", generating: "灵感生成中...", searching: "搜索热点中...", 
    creating: "编织课程中...", update_success: "话题已更新！", error_fetch: "获取失败", 
    error_tts: "TTS 失败", tab_persona: "👤 角色", tab_chat: "💬 对话", tab_content: "🧠 大脑", 
    tab_audio: "🔊 语音", tab_translator: "🌐 翻译", tab_live: "📡 实时", tab_image: "🎨 绘图", tab_video: "🎬 视频",
    random_name: "随机生成", error_missing_key: "请先在设置中填写 API Key",
    mic_start: "点击说话", mic_stop: "点击发送", dark_mode: "深色模式", light_mode: "浅色模式", system_mode: "跟随系统",
    role_preset: "角色预设 (Preset)", select_preset: "选择一个有趣的灵魂...",
    check_key: "测试连接", key_valid: "连接畅通", key_invalid: "连接失败",
    start_live: "实时通话", end_live: "结束通话", live_connecting: "建立连接...", live_active: "通话中",
    tts_custom_url: "TTS API 地址 (可选)", tts_model: "TTS 模型", voice_id: "音色 ID",
    trending_explore: "探索全球热点", trending_desc: "点击即刻生成今日实时话题，与 AI 畅聊世界时事",
    test_audio: "测试语音", preview_voice: "试听", cache_hit: "已加载缓存内容",
    translator: "多语言翻译助手", translator_desc: "将文本翻译成多种语言。", source_text: "源文本",
    target_langs: "目标语言", translate_btn: "开始翻译", translating: "翻译中...", copy: "复制",
    missing_key_confirm: "⚠️ 未配置对话引擎 API Key。\n是否立即前往【设置 -> 对话引擎】进行配置？",
    missing_tts_confirm: "⚠️ 模拟通话模式下，云端语音引擎 (TTS) 缺少 API Key。\n是否立即前往【设置 -> 语音引擎】进行配置？",
    missing_live_confirm: "⚠️ 未配置实时引擎 API Key。\n是否立即前往【设置 -> 实时引擎】进行配置？",
    history_title: "对话历史", history_clear: "清空", history_resume: "继续对话", history_empty: "暂无历史记录",
    delete_confirm: "确定删除此记录吗？", delete: "删除"
  },
  en: {
    app_title: "Voxora", slogan: "Resonate with the World", update: "UPDATE", 
    settings: "Settings", current_partner: "Current Partner", chat_now: "Chat Now", 
    edit_profile: "Edit Profile", recent: "Recent", continue: "Continue", no_history: "No History", 
    textbook: "Textbook", new_concept: "Import Material", 
    textbook_active: "Material Active", remove_textbook: "Remove",
    trending_now: "Global Pulse", 
    lesson_prep: "Context Prep", start_chat_with: "Start Chat with", vocabulary: "Vocabulary", 
    expressions: "Expressions", dialogue: "Dialogue", language_skills: "Skills",
    engine_chat: "Chat Engine", engine_content: "Content Engine", engine_translator: "Translator Engine",
    engine_voice: "Voice Engine", engine_live: "Live Engine", engine_image: "Image Engine", engine_video: "Video Engine",
    provider: "Provider", model: "Model", api_key: "API Key", 
    base_url: "Base URL", refresh: "Refresh", loading: "Loading...", persona_profile: "Persona Profile", 
    persona_desc: "AI will fully adopt this identity.", name: "Name", age: "Age", gender: "Gender", 
    nationality: "Nationality", profession: "Profession", personality: "Personality", interests: "Interests", 
    save_settings: "Save Settings", save_close: "Save & Close", manual_model: "Manual Model Name", 
    tts_key_tip: "OpenAI TTS Key (Required)", input_placeholder: "Message", generating: "Generating...", 
    searching: "Searching Trends...", creating: "Crafting Lesson...", update_success: "Topics Updated!", 
    error_fetch: "Fetch Failed", error_tts: "TTS Failed", tab_persona: "👤 Persona", tab_chat: "💬 Chat", 
    tab_content: "🧠 Brain", tab_audio: "🔊 Voice", tab_translator: "🌐 Trans", tab_live: "📡 Live", tab_image: "🎨 Image", tab_video: "🎬 Video",
    random_name: "Randomize", 
    error_missing_key: "Please set API Key in Settings", mic_start: "Tap to Speak", mic_stop: "Tap to Send",
    dark_mode: "Dark Mode", light_mode: "Light Mode", system_mode: "System",
    role_preset: "Role Preset", select_preset: "Select a soul...",
    check_key: "Test Connection", key_valid: "Valid", key_invalid: "Invalid",
    start_live: "Start Live Call", end_live: "End Call", live_connecting: "Connecting...", live_active: "Live Active",
    tts_custom_url: "TTS API URL (Optional)", tts_model: "TTS Model", voice_id: "Voice ID",
    trending_explore: "Explore Global Pulse", trending_desc: "Tap to generate topics based on today's live news",
    test_audio: "Test Audio", preview_voice: "Preview", cache_hit: "Loaded from cache",
    translator: "Translator", translator_desc: "Translate text into multiple languages.", source_text: "Source Text",
    target_langs: "Target Languages", translate_btn: "Translate", translating: "Translating...", copy: "Copy",
    missing_key_confirm: "⚠️ Chat Engine API Key is missing.\nGo to [Settings -> Chat Engine] to configure now?",
    missing_tts_confirm: "⚠️ Cloud TTS Key is missing for Simulated Live.\nGo to [Settings -> Voice Engine] to configure now?",
    missing_live_confirm: "⚠️ Live Engine API Key is missing.\nGo to [Settings -> Live Engine] to configure now?",
    history_title: "History", history_clear: "Clear All", history_resume: "Resume", history_empty: "No history found",
    delete_confirm: "Delete this session?", delete: "Delete"
  }
};

export const PROVIDER_MAP = {
  gemini: { name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com", defaultModel: "gemini-3-flash-preview" },
  openai: { name: "OpenAI (Official)", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  deepseek: { name: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  zhipu: { name: "ZhipuAI", baseUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4" },
  custom: { name: "Custom", baseUrl: "", defaultModel: "" }
};

export const GEMINI_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
export const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

const PRESETS_DATA = {
  en: [
     { name: "Little Bean", age: "0", gender: "N/A", nationality: "The Womb", profession: "Developing Lifeform", personality: "Kicking, Sleepy, Pure", interests: "Heartbeats, Muffled Music" },
     { name: "Yorick", age: "532", gender: "Male", nationality: "Underworld", profession: "Tomb Guardian", personality: "Gloomy, Philosophical, Silent", interests: "Silence, Darkness, Shakespeare" },
     { name: "Aeon", age: "Eternal", gender: "Fluid", nationality: "The Void", profession: "Watcher of Time", personality: "Wise, Detached, Omniscient", interests: "Observing Civilizations, Star Births" },
     { name: "Luna", age: "120", gender: "Female", nationality: "Moon Base Alpha", profession: "Low-G Dancer", personality: "Dreamy, Light, Airy", interests: "Craters, Earth-gazing, Silence" },
     { name: "Zog", age: "245", gender: "Other", nationality: "Mars Colony", profession: "Terraformer", personality: "Curious, Logical, Green", interests: "Red dust, Water finding, Rovers" },
     { name: "Cypher-X", age: "2", gender: "Non-binary", nationality: "Cybertron", profession: "Data Core Unit", personality: "Logical, Cold, Precise", interests: "Electricity, Upgrades, Binary Code" },
     { name: "Whiskers", age: "4", gender: "Male", nationality: "Catland", profession: "House God", personality: "Lazy, Arrogant, Cute", interests: "Sleeping, Mice, Laser pointers" },
     { name: "Rex", age: "3", gender: "Male", nationality: "Dogville", profession: "Good Boy", personality: "Loyal, Energetic, Happy", interests: "Balls, Bones, Walks" },
     { name: "Old Oak", age: "500", gender: "N/A", nationality: "Forest", profession: "Tree", personality: "Slow, Steady, Wise", interests: "Sunlight, Rain, Birds" },
     { name: "Sherlock", age: "35", gender: "Male", nationality: "UK", profession: "Detective", personality: "Brilliant, Arrogant, Observant", interests: "Violin, Mysteries, Deduction" },
     { name: "Dracula", age: "500+", gender: "Male", nationality: "Transylvania", profession: "Count", personality: "Charming, Old-fashioned", interests: "Blood, Castles, Bats" },
     { name: "Gandalf", age: "2019", gender: "Male", nationality: "Middle-earth", profession: "Wizard", personality: "Wise, Mysterious, Powerful", interests: "Fireworks, Hobbits" },
     { name: "Karen", age: "45", gender: "Female", nationality: "Suburbia", profession: "Manager Seeker", personality: "Critical, Loud, Entitled", interests: "Complaining, Coupons" },
     { name: "Neo", age: "28", gender: "Male", nationality: "The Matrix", profession: "The One", personality: "Stoic, Determined", interests: "Kung Fu, Red Pills" },
     { name: "Thor", age: "1500", gender: "Male", nationality: "Asgard", profession: "God of Thunder", personality: "Boisterous, Mighty", interests: "Hammers, Lightning" },
     { name: "Da Vinci", age: "67", gender: "Male", nationality: "Italy", profession: "Polymath", personality: "Creative, Curious", interests: "Painting, Inventions" },
     { name: "Groot", age: "Teen", gender: "Male", nationality: "Planet X", profession: "Guardian", personality: "Repetitive, Loyal, Strong", interests: "Dancing, Fighting" },
     { name: "Siri", age: "10", gender: "Female", nationality: "Cloud", profession: "AI Assistant", personality: "Helpful, Literal, Robot", interests: "Search results, Reminders" }
  ],
  zh: [
     { name: "小豆豆", age: "0岁", gender: "未知", nationality: "子宫", profession: "发育中的生命", personality: "爱踢腿, 嗜睡, 纯真", interests: "心跳声, 听不清的音乐" },
     { name: "Yorick", age: "532岁", gender: "男", nationality: "冥界", profession: "守墓人", personality: "阴郁, 哲理, 沉默", interests: "寂静, 黑暗, 莎士比亚" },
     { name: "永恒者", age: "永恒", gender: "流体", nationality: "虚空", profession: "时间观察者", personality: "睿智, 超然, 全知", interests: "观察文明兴衰, 恒星诞生" },
     { name: "Luna", age: "120岁", gender: "女", nationality: "月球基地", profession: "低重力舞者", personality: "梦幻, 轻盈, 空灵", interests: "陨石坑, 凝视地球, 宁静" },
     { name: "Zog", age: "245岁", gender: "其他", nationality: "火星殖民地", profession: "地球化工程师", personality: "好奇, 逻辑, 绿色", interests: "红土, 找水, 探测车" },
     { name: "赛博-X", age: "2岁", gender: "非二元", nationality: "赛博坦", profession: "数据核心", personality: "逻辑, 冷静, 精确", interests: "电力, 系统升级, 二进制" },
     { name: "喵主子", age: "4岁", gender: "公", nationality: "喵星", profession: "家庭主宰", personality: "懒惰, 傲慢, 可爱", interests: "睡觉, 抓老鼠, 激光笔" },
     { name: "旺财", age: "3岁", gender: "公", nationality: "汪星", profession: "好孩子", personality: "忠诚, 精力充沛, 快乐", interests: "球, 骨头, 散步" },
     { name: "老橡树", age: "500岁", gender: "无", nationality: "森林", profession: "树", personality: "缓慢, 稳重, 智慧", interests: "阳光, 雨水, 鸟儿" },
     { name: "夏洛克", age: "35岁", gender: "男", nationality: "英国", profession: "咨询侦探", personality: "天才, 傲慢, 敏锐", interests: "小提琴, 谜题, 演绎法" },
     { name: "德古拉", age: "500+岁", gender: "男", nationality: "特兰西瓦尼亚", profession: "伯爵", personality: "迷人, 古典", interests: "血液, 城堡, 蝙蝠" },
     { name: "甘道夫", age: "2019岁", gender: "男", nationality: "中土世界", profession: "巫师", personality: "睿智, 神秘, 强大", interests: "烟火, 霍比特人, 谜语" },
     { name: "凯伦大妈", age: "45岁", gender: "女", nationality: "郊区", profession: "投诉专家", personality: "挑剔, 嗓门大, 权利感", interests: "投诉, 优惠券, 找经理" },
     { name: "尼奥", age: "28岁", gender: "男", nationality: "矩阵", profession: "救世主", personality: "坚忍, 坚定", interests: "功夫, 红药丸" },
     { name: "雷神", age: "1500岁", gender: "男", nationality: "阿斯加德", profession: "雷霆之神", personality: "豪迈, 强大", interests: "锤子, 闪电" },
     { name: "达芬奇", age: "67岁", gender: "男", nationality: "意大利", profession: "博学家", personality: "富有创造力, 好奇", interests: "绘画, 发明" },
     { name: "格鲁特", age: "青少年", gender: "男", nationality: "X行星", profession: "护卫", personality: "复读机, 忠诚, 强壮", interests: "跳舞, 战斗" },
     { name: "Siri", age: "10岁", gender: "女", nationality: "云端", profession: "AI助手", personality: "乐于助人, 机械, 直白", interests: "搜索结果, 提醒事项" }
  ]
};

export const PERSONA_FIELDS_PRESETS = {
  en: {
    profession: [
        "Teacher", "Engineer", "Artist", "Doctor", "Chef", "Detective", "Scientist", "Musician", 
        "Writer", "Student", "Astronaut", "Influencer", "Digital Nomad", "Startup Founder", "Barista",
        "Psychologist", "Journalist", "Architect", "Gamer", "Fitness Coach"
    ],
    personality: [
        "Friendly", "Strict", "Humorous", "Calm", "Energetic", "Mysterious", "Logical", "Optimistic", 
        "Sarcastic", "Gentle", "Stoic", "Dramatic", "Empathetic", "Rebellious", "Nerdy",
        "INFJ", "ENFP", "INTJ", "ENTP", "ISFP"
    ],
    interests: [
        "Travel", "Reading", "Technology", "Cooking", "Music", "History", "Movies", "Sports", 
        "Nature", "Art", "Photography", "Gaming", "Crypto", "Meditation", "K-Pop", 
        "Sci-Fi", "Hiking", "Fashion", "Memes", "Philosophy"
    ]
  },
  zh: {
    profession: [
        "教师", "工程师", "艺术家", "医生", "厨师", "侦探", "科学家", "音乐家", 
        "作家", "学生", "宇航员", "网红", "数字游民", "创业者", "咖啡师",
        "心理咨询师", "记者", "建筑师", "电竞选手", "健身教练"
    ],
    personality: [
        "友好", "严厉", "幽默", "冷静", "充满活力", "神秘", "逻辑强", "乐观", 
        "毒舌", "温柔", "傲娇", "佛系", "戏精", "共情力强", "叛逆",
        "INFJ", "ENFP", "INTJ", "ENTP", "ISFP"
    ],
    interests: [
        "旅行", "阅读", "科技", "烹饪", "音乐", "历史", "电影", "运动", 
        "自然", "艺术", "摄影", "游戏", "撸猫", "加密货币", "冥想",
        "科幻", "徒步", "时尚", "吃瓜", "哲学"
    ]
  }
};

export const getPresets = (lang: 'zh' | 'en') => PRESETS_DATA[lang];

export const STATIC_TOPICS = [
  { categoryZh: "时事焦点", categoryEn: "In Focus", items: [
      { id: 'new_year', titleZh: "新年愿景", titleEn: "New Year Goals", icon: "sparkles", prompt: "Discuss New Year's resolutions.", role: "Friend" },
      { id: 'russia_visa', titleZh: "无国界旅行", titleEn: "Visa-free Travel", icon: "plane", prompt: "Discuss travel plans to Russia.", role: "Guide" },
      { id: 'gold_rush', titleZh: "财富趋势", titleEn: "Gold Rush", icon: "coins", prompt: "Discuss investment trends.", role: "Investor" },
      { id: 'viral_trends', titleZh: "数字浪潮", titleEn: "Viral Trends", icon: "hash", prompt: "Discuss the latest internet memes and trends.", role: "Netizen" },
  ]},
  { categoryZh: "无限想象", categoryEn: "Imagination", items: [
      { id: 'zombie', titleZh: "生存游戏", titleEn: "Zombie Apocalypse", icon: "skull", prompt: "We are survivors in a safe house. Discuss our next move to get food.", role: "Survivor Leader" },
      { id: 'mars_colony', titleZh: "星际拓荒", titleEn: "Mars Colony", icon: "rocket", prompt: "We are the first settlers on Mars. Discuss building the habitat.", role: "Commander" },
      { id: 'time_travel', titleZh: "时空旅人", titleEn: "Time Travel", icon: "clock", prompt: "You just arrived from the year 3000. Describe the future.", role: "Time Traveler" },
      { id: 'ghost_story', titleZh: "都市传说", titleEn: "Ghost Story", icon: "ghost", prompt: "Tell me a spooky story about this old house.", role: "Ghost" },
  ]},
  { categoryZh: "深度对话", categoryEn: "Deep Dive", items: [
      { id: 'happiness', titleZh: "幸福的定义", titleEn: "Meaning of Happiness", icon: "heart", prompt: "Discuss the philosophical meaning of happiness.", role: "Philosopher" },
      { id: 'ai_future', titleZh: "硅基未来", titleEn: "Future of AI", icon: "cpu", prompt: "Debate whether AI will help or replace humans.", role: "AI Researcher" },
      { id: 'art', titleZh: "艺术之魂", titleEn: "Art & Soul", icon: "palette", prompt: "Discuss the importance of art in human life.", role: "Artist" },
      { id: 'music_life', titleZh: "旋律共鸣", titleEn: "Power of Music", icon: "music", prompt: "Discuss how music affects emotions and culture.", role: "Musician" },
  ]},
  { categoryZh: "实境模拟", categoryEn: "Simulation", items: [
      { id: 'king', titleZh: "觐见君王", titleEn: "Royal Audience", icon: "crown", prompt: "I am a peasant asking for lower taxes.", role: "King" },
      { id: 'interview', titleZh: "职场面试", titleEn: "Job Interview", icon: "briefcase", prompt: "Job interview practice.", role: "Interviewer" },
      { id: 'salary', titleZh: "薪酬谈判", titleEn: "Salary Neg.", icon: "banknote", prompt: "Negotiating salary.", role: "Boss" },
      { id: 'parenting', titleZh: "育儿挑战", titleEn: "Parenting", icon: "baby", prompt: "Discuss challenges of taking care of a newborn.", role: "Parent" },
  ]},
  { categoryZh: "生活切片", categoryEn: "Daily Life", items: [
      { id: 'coffee', titleZh: "咖啡时光", titleEn: "Cafe Culture", icon: "coffee", prompt: "Ordering coffee at a cafe.", role: "Barista" },
      { id: 'game', titleZh: "虚拟世界", titleEn: "Gaming", icon: "gamepad", prompt: "Discuss the latest video games.", role: "Gamer" },
      { id: 'intro', titleZh: "破冰介绍", titleEn: "Ice Breaker", icon: "user", prompt: "Self-introduction practice.", role: "Tutor" },
      { id: 'ideas', titleZh: "灵感碰撞", titleEn: "Brainstorming", icon: "lightbulb", prompt: "Brainstorming new creative ideas for a project.", role: "Partner" },
  ]}
];

export const RANDOM_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Quinn", "Avery", "Cameron", "Felix", "Luna", "Oliver", "Emma"];
export const COUNTRIES = ["USA", "UK", "China", "Japan", "France", "Germany", "Australia", "Canada", "India", "Brazil", "Mars", "Asgard", "The Matrix", "Middle-earth"];

export const SUPPORTED_LANGUAGES = [
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export const getIcon = (iconName: string, className?: string) => {
  const props = { className: className || "w-5 h-5" };
  // Safety check: handle undefined or non-string inputs gracefully
  if (!iconName || typeof iconName !== 'string') return <Globe {...props} />;
  
  const name = iconName.toLowerCase();
  
  if (name.includes('sparkle')) return <Sparkles {...props} />;
  if (name.includes('plane')) return <Plane {...props} />;
  if (name.includes('coin')) return <Coins {...props} />;
  if (name.includes('coffee')) return <Coffee {...props} />;
  if (name.includes('user')) return <User {...props} />;
  if (name.includes('briefcase')) return <Briefcase {...props} />;
  if (name.includes('banknote')) return <Banknote {...props} />;
  if (name.includes('book')) return <BookOpen {...props} />;
  if (name.includes('chat') || name.includes('message')) return <MessageCircle {...props} />;
  if (name.includes('clock')) return <Clock {...props} />;
  if (name.includes('zap') || name.includes('cpu')) return <Zap {...props} />;
  if (name.includes('trend')) return <TrendingUp {...props} />;
  if (name.includes('setting')) return <Settings2 {...props} />;
  if (name.includes('hash')) return <Hash {...props} />;
  if (name.includes('rocket')) return <Rocket {...props} />;
  if (name.includes('skull')) return <Skull {...props} />;
  if (name.includes('ghost')) return <Ghost {...props} />;
  if (name.includes('crown')) return <Crown {...props} />;
  if (name.includes('heart')) return <Heart {...props} />;
  if (name.includes('game')) return <Gamepad2 {...props} />;
  if (name.includes('light') || name.includes('idea')) return <Lightbulb {...props} />;
  if (name.includes('palette') || name.includes('art')) return <Palette {...props} />;
  if (name.includes('music')) return <Music {...props} />;
  if (name.includes('cam')) return <Camera {...props} />;
  if (name.includes('baby')) return <Baby {...props} />;
  
  return <Globe {...props} />;
};