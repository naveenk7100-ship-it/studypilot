# StudyPilot - Production Backend Deployment Guide

StudyPilot is designed with a decoupled, zero-secret student architecture:

- **Frontend:** Hosted securely on GitHub Pages ([https://naveenk7100-ship-it.github.io/studypilot/](https://naveenk7100-ship-it.github.io/studypilot/)). Contains **zero** API keys or secrets.
- **Backend:** Node.js Express API. Manages provider streaming, document grounding, and rate limiting. Holds `GEMINI_API_KEY` in private environment variables.

---

## 🚀 Deploying the Backend (Option 1: Render)

1. Sign in to [Render](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `naveenk7100-ship-it/studypilot`.
4. Configure the service:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   AI_PROVIDER=gemini
   GEMINI_API_KEY=<your-secret-google-gemini-key>
   GEMINI_MODEL=gemini-1.5-flash
   FRONTEND_URL=https://naveenk7100-ship-it.github.io
   ```
6. Click **Create Web Service**.
7. Once deployed, copy your service URL (e.g., `https://studypilot-api.onrender.com`).

---

## 🚀 Deploying the Backend (Option 2: Railway)

1. Sign in to [Railway](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `naveenk7100-ship-it/studypilot`.
4. Add the environment variables:
   - `AI_PROVIDER=gemini`
   - `GEMINI_API_KEY=<your-secret-google-gemini-key>`
   - `FRONTEND_URL=https://naveenk7100-ship-it.github.io`
5. Railway will automatically detect the `Dockerfile` or `Procfile` and deploy your service.
6. Generate a public domain under Settings.

---

## 🔗 Connecting the Frontend to Your Live Backend

1. Open the StudyPilot live app: [https://naveenk7100-ship-it.github.io/studypilot/](https://naveenk7100-ship-it.github.io/studypilot/)
2. Navigate to **Settings** (gear icon in sidebar).
3. Under **AI Backend Provider**, enter your backend URL in **Connected Backend URL** (e.g., `https://studypilot-api.onrender.com`).
4. Click **Save & Connect**.
5. The badge in the top navigation will immediately change from `DEMO MODE` to `LIVE AI (GEMINI)`.

---

## 🔒 Security Best Practices

- **Never** commit `.env` or paste real API keys into GitHub issues, PRs, or client-side files.
- The backend sanitizes all error responses and rate-limits client requests.
- When no backend or key is present, StudyPilot functions autonomously in honest **Demo Mode** using its built-in curriculum engine.
