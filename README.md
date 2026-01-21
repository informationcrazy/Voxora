# Voxora 🌍

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=flat&logo=typescript)
![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini-8E75B2.svg)

**Voxora** is a next-generation AI language learning application designed to help users master languages through immersion and context. Unlike traditional flashcard apps, Voxora simulates real-world scenarios, creates dynamic lesson plans based on *your* interests or textbooks, and offers real-time voice conversations with distinct AI personalities.

## ✨ Key Features

*   **🗣️ Real-time Live Voice Chat:** Experience low-latency, full-duplex voice conversations using the Google Gemini Live API, complete with a reactive audio visualizer.
*   **🎭 Custom AI Personas:** Chat with diverse characters (e.g., "Aria the Creative Director" or "Yorick the Tomb Guardian") to practice different registers and tones.
*   **📚 Context-Aware Lesson Generation:** Upload your own textbook content (`.txt`) or choose a trending topic. Voxora generates structured lesson plans including:
    *   Target Vocabulary & Expressions
    *   Grammar Point Explanations
    *   Scenario-based Dialogue
*   **🧠 Multi-Model Support:** Flexible configuration allowing you to switch between:
    *   **Google Gemini** (Recommended for Live Mode & Multimodal)
    *   **OpenAI** (GPT-4o)
    *   **DeepSeek** / **ZhipuAI**
    *   Custom OpenAI-compatible endpoints
*   **🎨 Modern Glassmorphism UI:** A beautiful, responsive interface built with Tailwind CSS, featuring dark mode support and smooth animations.
*   **🔊 High-Quality TTS:** Integrated support for OpenAI TTS, Gemini Audio, and browser-native speech synthesis for natural-sounding pronunciation.

## 🛠️ Tech Stack

*   **Frontend Framework:** [React 18](https://reactjs.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **AI Integration:** [`@google/genai` SDK](https://www.npmjs.com/package/@google/genai) & REST APIs
*   **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn
*   API Keys for your preferred AI provider (Google Gemini API Key recommended for full features).

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

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173`.

## ⚙️ Configuration

Voxora is designed to be privacy-first. API keys are stored locally in your browser's `localStorage` and are never sent to our servers.

1.  Click the **Settings (⚙️)** icon in the top right corner.
2.  Navigate to the **Chat Engine** tab.
3.  Select **Google Gemini** (recommended) or your preferred provider.
4.  Enter your API Key.
5.  (Optional) Configure **Voice Engine** settings for high-quality Text-to-Speech.

## 📸 Screenshots

*(Add your screenshots here, for example:)*

| Home Dashboard | Lesson View | Live Chat Interface |
|:---:|:---:|:---:|
| ![Home](https://via.placeholder.com/200x400?text=Home) | ![Lesson](https://via.placeholder.com/200x400?text=Lesson) | ![Live](https://via.placeholder.com/200x400?text=Live) |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ using React & Gemini</p>
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
