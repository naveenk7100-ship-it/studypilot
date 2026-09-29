# StudyPilot 🧭

> **“Understand. Practice. Remember.”**  
> A production-quality AI Study Copilot and learning workspace for students.

StudyPilot is **not** a generic chatbot wrapper. It is a comprehensive, premium AI learning workspace engineered for students to comprehend difficult academic topics, upload course notes and lecture slides, practice with spaced-repetition flashcards, generate targeted quizzes from mistakes, and construct personalized exam preparation roadmaps.

> [!CAUTION]
> **Never commit your `.env` file or API keys.** StudyPilot is preconfigured to strictly ignore `.env` files via `.gitignore`. Always keep your API keys local and use host environment variable configuration for production deployments.

---

## 📸 Screenshots & Preview

*Screenshots and UI walkthrough diagrams will appear here.*

| Dashboard & AI Tutor | Flashcards & Spaced Repetition (SM-2) |
| :---: | :---: |
| *Personalized Learning Hub & 6 Study Modes* | *3D Interactive Flip Cards & SM-2 Mastery* |

| Targeted Quiz Engine | Exam Roadmap & Milestones |
| :---: | :---: |
| *Automated Question Generation & Weakness Diagnosis* | *Day-by-Day Adaptive Exam Prep Timelines* |

---

## 🌟 Key Highlights & Features

### 1. 🎓 Premium Student UI
- **Design Philosophy**: Clean, distraction-free educational SaaS interface. Professional typography, subtle micro-interactions, accessible focus rings, and high contrast.
- **Dark & Light Mode**: Seamless theme switching with persistent localStorage preference and OS color-scheme auto-detection.
- **Mobile-First Responsiveness**: Tailored layouts for 320px, 375px, 768px, 1024px, and 1440px+ displays with a sticky bottom navigation bar on mobile.

### 2. ⚡ AI Study Tutor (6 Dedicated Study Modes)
- **Streaming UI**: Real-time server-sent event (SSE) token streaming.
- **Markdown & Math Friendly**: Built-in KaTeX LaTeX rendering for complex mathematical and algorithmic expressions (e.g. $CWND = 2^t \cdot \text{MSS}$).
- **Syntax-Highlighted Code Blocks**: With single-click copy buttons.
- **Interactive Tools**: Copy answer, Regenerate, Save to Study Notes, Thumbs up/down feedback, Read Aloud via Speech Synthesis.
- **Modes**:
  1. **ASK**: Direct academic inquiries.
  2. **EXPLAIN**: Comprehensive 8-part structured explanation engine.
  3. **SUMMARIZE**: Condenses materials into core takeaways and definitions.
  4. **QUIZ**: Self-testing mode with instant feedback.
  5. **FLASHCARDS**: Quick revision cards extraction.
  6. **EXAM PREP**: Structured roadmap planning.

### 3. 🧠 8-Part Explanation Engine
When explaining a complex concept (e.g., *"Explain TCP congestion control"*), StudyPilot breaks down the topic into 8 rigorous, standardized sections:
1. **Simple Explanation** (Intuitive summary for initial mental model)
2. **Why It Matters** (Academic & real-world importance)
3. **Step-by-Step Explanation** (Phases, state transitions, algorithms)
4. **Real-World Analogy** (Relatable physical parallel)
5. **Practical Example & Math** (Formula derivation, sample inputs/outputs)
6. **Key Points to Remember** (High-yield exam facts)
7. **Quick Revision Checklist** (Interactive checklist items)
8. **Check Your Understanding** (Diagnostic question to test retention)

### 4. 📄 Study Materials & Document-Aware AI
- **Multi-Format Extraction**: Genuine parsing for **PDF** (`pdf-parse`), **Word DOCX** (`mammoth`), **TXT**, and **Markdown**.
- **Automated Artifact Generation**: Upon processing, automatically extracts:
  - Executive Document Summary
  - Extracted Core Concepts & Headings
  - Academic Definitions Dictionary
  - Key Mathematical / Physical Formulas
  - Crucial Exam Questions
  - Flashcard Decks & Practice MCQs
  - Chapter / Topic Breakdown
- **Document-Aware Grounding**:
  - Distinguishes document-derived information from general knowledge.
  - Cites verified section excerpts and estimated page markers.
  - **Zero Fabrication**: If the answer is not found in the uploaded text, StudyPilot states this explicitly rather than hallucinating citations.

### 5. 🗂️ Flashcard Engine with Spaced Repetition (SM-2)
- **3D Flip Card Animation**: Tap to reveal the answer with smooth CSS 3D perspective transforms.
- **SuperMemo SM-2 Algorithm**:
  - Quality Ratings: **Difficult** (Again), **Review** (Good), **Know** (Easy).
  - Dynamically computes repetitions, interval days, ease factors, and next review timestamps.
- **Progress Tracking**: Organizes decks by *New*, *Learning*, and *Mastered*.
- **Creation Sources**: AI topic generation, automatic document extraction, or manual entry.

### 6. 🎯 Targeted Quiz Engine
- **Flexible Parameters**: Generate quizzes by Topic, Document Context, Subject, Difficulty (Easy, Medium, Hard), and Question Count (5, 10, 20).
- **Question Types**: Multiple Choice (MCQ), True/False, and Short Answer.
- **Mistake-to-Revision Loop**:
  - Displays score, accuracy, and detailed rationales for every question.
  - Pinpoints specific **Weak Topics**.
  - One-click **"Review Weak Topics in AI Tutor"** button to immediately address gaps in understanding.

### 7. 📅 Structured Exam Preparation Roadmap
- Enter exam name, subject, target date, available daily study hours, and syllabus topics.
- Generates a day-by-day milestone roadmap (Day 1: OSI Model, Day 2: TCP/IP, Day 3: Routing, Day 4: Practice Exam).
- Interactive, checkable daily task lists and customizable study tasks.

### 8. 📊 Adaptive Learning & Honest Analytics
- Tracks study hours, questions attempted, accuracy rate, flashcard reviews, and study streaks.
- Transparent mastery thresholds:
  - **Needs Review**: Accuracy < 60% or difficult cards pending.
  - **Learning**: Moderate recall accuracy (60–80%).
  - **Strong**: Demonstrated $\ge 80\%$ accuracy across multiple sessions.
- Generates targeted recommendations (*"Review this topic"*, *"Practice 5 more questions"*, *"Ready for advanced questions"*).

### 9. 🎙️ Voice-Ready Architecture
- Integrated Web Speech API microphone button with active listening states.
- Speech synthesis text-to-speech button to read explanations aloud.
- Honest capability detection: if the user's browser lacks speech recognition, provides helpful guidance without pretending to record audio.

### 10. 🔒 AI Backend Security & Honest Architecture
- **Zero Frontend Secrets**: API keys are **never** bundled or exposed in client-side code. All AI queries pass through the Node.js Express server.
- **Strict In-Memory Rate Limiting**: Sliding window rate limiters (40 req/min for conversational endpoints, 25 req/min for generation endpoints) mitigate denial of service and API quota abuse.
- **Input Validation & Sanitization**: Strict payload limits (max 4,000 characters for queries, max 250 characters for topics, 1–30 questions for quizzes, 1–16 daily study hours).
- **Hardened File Uploads**: Memory-only parsing via `multer` (zero temp file leaks to disk), strict 25MB file size limit, path traversal defense via `path.basename()`, and strict MIME/extension whitelisting (`.pdf`, `.docx`, `.txt`, `.md`).
- **Prompt Injection Isolation**: Untrusted uploaded documents are isolated within `<untrusted_student_document_content>` security boundaries with explicit instructions instructing the AI model to ignore overriding commands.
- **XSS Sanitization**: Markdown and math rendering sanitize dangerous `<script>`, `<iframe>`, and `javascript:` URIs before DOM insertion.
- **Multi-Provider Support**: Pluggable provider abstraction (`GeminiProvider`, `OpenAIProvider`, `GroqProvider`, `AnthropicProvider`, `OllamaProvider`, `DemoProvider`).
- **Honest Demo Mode**: When no API key is configured, StudyPilot operates in high-yield Demo Mode with clear UI indicators, complete curriculum generation, and zero broken features.

### 11. 🛡️ Safe Study Memory & Privacy
- **Client Autonomy**: All user study progress, history, flashcard review intervals, and uploaded document artifacts are stored exclusively in the browser (`localStorage`), never persisted to a centralized tracking database.
- **Full Portability**: One-click JSON backup export and restore.
- **Granular Deletion**: Clear conversation history, purge saved documents, or wipe all data with one click.
- **Privacy Advisory**: Clear in-app disclosures advising students not to upload sensitive personal or confidential information.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** version 18 or higher (Tested on Node v20 & v24).
- **npm** version 9 or higher.

### 1. Installation
Clone the repository and install dependencies for both server and client:

```bash
# Clone the repository
git clone https://github.com/your-username/studypilot.git
cd studypilot

# Install root & server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
copy .env.example .env
```

#### Demo Mode (Default — No Keys Required)
By default, StudyPilot runs in **Demo Mode** out of the box with zero external dependencies or API keys needed:
```env
PORT=3001
NODE_ENV=development
AI_PROVIDER=demo
```
In Demo Mode:
- All 6 Study Modes, document parsing, quizzes, flashcards, and exam plans work seamlessly with curriculum-accurate educational algorithms.
- The UI transparently displays the `DEMO MODE` badge so students and evaluators always know the exact AI state.

#### Real AI Provider Configuration
To connect a live AI provider, update `.env` with your provider and API key:

##### Google Gemini (Recommended)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

##### OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

##### Groq
```env
AI_PROVIDER=groq
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

##### Anthropic
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

##### Local Ollama (Self-Hosted / Offline)
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 3. Run the Development Server
Run both the Express backend (port 3001) and Vite frontend (port 5173) concurrently:

```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### 4. Build and Run in Production
To generate an optimized production build and serve the client directly from Express:

```bash
# Builds client into client/dist/ and runs server
npm run build
npm start
```

Visit **`http://localhost:3001`** in your browser.

---

## 🔒 Security & Privacy Architecture

| Security Domain | Implementation | Benefit |
| :--- | :--- | :--- |
| **Credential Safety** | Environment variables on Node backend only (`process.env`); zero client Vite prefixes (`VITE_API_KEY` banned) | Prevents API key exposure in public client bundles |
| **DDoS / Abuse** | In-memory sliding window rate limiting (40 req/min chat, 25 req/min generate) | Prevents resource exhaustion and runaway API costs |
| **File Processing** | `multer.memoryStorage()`, 25MB cap, extension whitelist, `path.basename()` | Mitigates disk bombs, directory traversal, and malicious file types |
| **Prompt Injection** | Isolated XML tagging (`<untrusted_student_document_content>`) & system delimiters | Prevents document contents from overriding core AI tutor rules |
| **Client XSS** | Regex sanitizer stripping `<script>`, `<iframe>`, and `javascript:` URIs | Protects client DOM from malicious payload injection |
| **Data Privacy** | Local browser storage for study state; zero user telemetry or tracking trackers | Complete user ownership and data autonomy |

---

## 📁 Project Architecture

```
studypilot/
├── .env.example               # Template environment configuration (no secrets)
├── .env                       # Local environment file (git-ignored)
├── .gitignore                 # Git ignore rules protecting keys and build output
├── package.json               # Root scripts (dev, build, start) and server dependencies
├── README.md                  # Comprehensive project documentation
├── server/
│   ├── index.js               # Express application entrypoint, CORS, static serving
│   ├── middleware/
│   │   └── rateLimiter.js     # Sliding window rate limiting middleware
│   ├── ai/
│   │   └── providers.js       # BaseAIProvider, DemoProvider, GeminiProvider, OpenAIProvider, GroqProvider, etc.
│   ├── document/
│   │   └── processor.js       # PDF, DOCX, TXT parser & study artifact generator
│   └── routes/
│       └── api.js             # /status, /chat, /explain, /materials/upload, /quiz, /flashcards, /exam
└── client/
    ├── index.html             # SEO tags, fonts, KaTeX styles
    ├── package.json           # React 19, Tailwind v4, Lucide, KaTeX
    ├── vite.config.ts         # Vite bundler configuration & API proxy
    └── src/
        ├── App.tsx            # Main application assembly & view routing
        ├── main.tsx           # React DOM root entrypoint
        ├── index.css          # Tailwind CSS v4 & 3D flip card styles
        ├── types/
        │   └── index.ts       # Shared TypeScript data models
        ├── services/
        │   ├── api.ts         # Server API client (streaming chat, file upload)
        │   ├── storage.ts     # Local study memory (export/import, demo data)
        │   ├── speech.ts      # Web Speech Recognition & Synthesis wrapper
        │   └── spacedRepetition.ts # SuperMemo SM-2 interval calculation
        └── components/
            ├── common/        # Header, Sidebar, MobileNav, MarkdownRenderer, TrustBanner, Modal
            ├── dashboard/     # Personalized Dashboard view, metric cards, quick actions
            ├── tutor/         # AI Study Tutor with 6 modes, streaming chat, voice controls
            ├── materials/     # Study Materials workspace, document upload, grounded insights
            ├── flashcards/    # Flashcard deck view, 3D flip card, SM-2 rating buttons
            ├── quiz/          # Quiz player, confetti, weakness diagnosis & recommendations
            ├── exam/          # Day-by-day exam roadmap generator & checklist
            ├── progress/      # Adaptive learning recommendations & weekly charts
            └── settings/      # Backup export/import, backend diagnostic, privacy policy
```

---

## 📄 Supported Documents & File Formats

StudyPilot features an in-memory document parsing and artifact synthesis pipeline:

| Format | Extension | Parser Library | Features Extracted |
| :--- | :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | `pdf-parse` | Page markers, structure, headings, definitions, key formulas, questions |
| **Microsoft Word** | `.docx` | `mammoth` | Headings, formatted paragraphs, bulleted study points |
| **Plain Text** | `.txt` | Native Node Stream | Direct semantic chunking and key-term dictionary creation |
| **Markdown** | `.md` | Native UTF-8 | Section headers, code samples, LaTeX math notation |

*File Upload Safety*: Max upload size is strictly **25 MB**. Files are processed entirely in server RAM with `multer.memoryStorage()`. No student files are written to server disks.

---

## ⚙️ Environment Variables Reference

All configuration is performed on the server via `.env`.

> [!WARNING]
> **Never commit your `.env` file or API keys.** The `.env` file is excluded in `.gitignore`.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3001` | The HTTP port the Express server listens on. |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`). |
| `AI_PROVIDER` | **Required** | `demo` | Provider engine: `demo`, `gemini`, `openai`, `groq`, `anthropic`, or `ollama`. |
| `GEMINI_API_KEY` | Optional | *empty* | Google Gemini API Key (when `AI_PROVIDER=gemini`). |
| `GEMINI_MODEL` | Optional | `gemini-1.5-flash` | Gemini model name. |
| `OPENAI_API_KEY` | Optional | *empty* | OpenAI API Key (when `AI_PROVIDER=openai`). |
| `OPENAI_MODEL` | Optional | `gpt-4o-mini` | OpenAI model name. |
| `GROQ_API_KEY` | Optional | *empty* | Groq API Key (when `AI_PROVIDER=groq`). |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Groq Llama model. |
| `ANTHROPIC_API_KEY` | Optional | *empty* | Anthropic Claude API Key (when `AI_PROVIDER=anthropic`). |
| `ANTHROPIC_MODEL` | Optional | `claude-3-5-sonnet-20241022` | Anthropic model. |
| `OLLAMA_BASE_URL` | Optional | `http://localhost:11434` | Ollama local URL. |
| `OLLAMA_MODEL` | Optional | `llama3` | Ollama local model. |

---

## 🛠️ Development & Verification

### Running Tests and Verification
```bash
# Run security and secret leak scanner
node scripts/security-audit.mjs

# Audit dependencies
npm audit
cd client && npm audit && cd ..

# Verify TypeScript and client build
cd client
npm run build
cd ..
```

---

## 🚢 Production Deployment Architecture

StudyPilot contains a high-performance **Node.js/Express backend** and an optimized **React SPA frontend**.

> [!NOTE]
> **Important Hosting Consideration**: Static site hosts such as **GitHub Pages** only host static HTML/CSS/JS and **cannot** execute the Node.js Express backend. To run StudyPilot in production with document parsing and AI proxying, deploy to a platform that supports Node.js runtimes.

### Recommended Node.js Hosting Targets

1. **Render / Railway / Fly.io / Heroku**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Set environment variables in the platform's Secret / Environment settings (`PORT=3001`, `NODE_ENV=production`, `AI_PROVIDER=gemini`, `GEMINI_API_KEY=...`).
2. **Docker / Self-Hosted VPS**:
   - Containerize using standard Node 20/22 alpine images.
   - Expose port `3001` and map reverse proxy (Nginx / Caddy).

---

## 🤝 Contributing

Contributions to StudyPilot are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

*Please ensure no personal credentials or `.env` files are included in your PR.*

---

## 🛡️ Trust & Safety Disclaimer
*AI-generated explanations can contain mistakes. Verify important academic information with your course material or instructor.*

---

## 📜 License
MIT License — Copyright (c) 2026 StudyPilot Contributors. Built for students worldwide.

