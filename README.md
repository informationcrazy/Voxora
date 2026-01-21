# Voxora 🎙️

> **Resonate with the World | 共鸣世界，声声不息**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg?logo=tailwind-css)
![Gemini API](https://img.shields.io/badge/Google-Gemini_API-8E75B2.svg?logo=google)

**Voxora** is an immersive, AI-powered language learning companion designed to help you practice languages through natural conversation, scenario-based roleplay, and structured lesson generation.

Whether you want to chat with a fictional character, simulate a job interview, or study vocabulary from your own textbook, Voxora adapts to your needs.

---

## ✨ Key Features

### 🗣️ Immersive Chat & Roleplay
*   **Custom Personas**: Define your AI partner's name, age, profession, and personality.
*   **Role Presets**: Choose from diverse presets like "Sherlock Holmes", "Dracula", or a "Strict Teacher".
*   **Bilingual Support**: Seamless switching between English and Chinese interfaces.

### 📞 Live Voice Mode
*   **Real-time Conversation**: Experience low-latency voice chats powered by **Gemini Live API** (Native) or browser-based speech recognition (Simulated).
*   **Audio Visualization**: Beautiful, reactive audio visualizers for both user and AI.
*   **TTS Integration**: High-quality Text-to-Speech support via Gemini, OpenAI, or Browser Native API.

### 📚 Contextual Learning Engine
*   **Lesson Generation**: Automatically generates vocabulary lists, expressions, grammar points, and sample dialogues based on the chosen topic.
*   **Textbook Import**: Upload your own `.txt` learning materials (e.g., "New Concept English"), and the AI will prioritize that content for teaching.
*   **Trending Topics**: Fetches and generates discussion topics based on current global trends.

### 🛠️ Useful Tools
*   **Translator**: Built-in multi-language translation tool.
*   **Chat History**: Auto-saves conversations locally; resume or review past sessions anytime.
*   **Settings Persistence**: All configurations (API keys, personas, themes) are saved locally in your browser.

---

## 🛠️ Tech Stack

*   **Frontend Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism design)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **AI Integration**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
*   **Deployment**: Static Site (compatible with GitHub Pages, Vercel, Netlify)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Gemini API Key (Get one [here](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/voxora.git
    cd voxora
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run locally**
    ```bash
    npm run dev
    ```

4.  **Open in browser**
    Visit `http://localhost:5173`

### Configuration
Upon launching the app, click the **Settings (Gear Icon)** button.
*   Navigate to the **Chat Engine** tab.
*   Select **Google Gemini** (recommended).
*   Enter your **API Key**.
*   (Optional) Configure TTS settings in the **Voice Engine** tab.

---

## 📦 Deployment

### Deploy to GitHub Pages

1.  Update `vite.config.ts` with your base URL (if not at root):
    ```ts
    export default defineConfig({
      base: '/voxora/', // Replace with your repo name
      // ...
    })
    ```

2.  Build the project:
    ```bash
    npm run build
    ```

3.  Upload the contents of the `dist` folder to your hosting provider, or use a GitHub Action to deploy automatically.

### Deploy to Vercel / Netlify
Connect your GitHub repository to Vercel or Netlify. The build settings are usually auto-detected:
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for language learners everywhere.*
