# Simple Chatbot (Next.js)

A minimal chatbot: a chat UI plus a server route (`/api/chat`) that calls an
LLM API. It works with **OpenAI, Google Gemini or Claude**. Your API key stays on
the server and is never sent to the browser.

Flow: **push to GitHub → Temps pulls from GitHub → build → deploy.**

## 1. Get an API key (pick one)

| Provider | Where to get a key | Environment variable |
| --- | --- | --- |
| OpenAI | https://platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| Claude | https://console.anthropic.com | `ANTHROPIC_API_KEY` |

Set only the one you have. If you set several, add `LLM_PROVIDER` to choose.

## 2. Run locally

```bash
npm install
cp .env.example .env.local     # then fill in your key
npm run dev                    # http://localhost:3000
```

## 3. Push to GitHub

Create an empty GitHub repo (e.g. `temps-chatbot`), then run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/temps-chatbot.git
git push -u origin main
```

`.env.local` is git-ignored, so your key will not be pushed.

## 4. Deploy on Temps

If your Temps server is not set up yet, run this once on a fresh Ubuntu VPS:

```bash
curl -fsSL https://temps.sh/deploy.sh | bash
```

Then in the Temps console:

1. Click **New project** and connect your `temps-chatbot` repo from GitHub.
2. Choose the `main` branch. Temps builds from the `Dockerfile` (port `3000`).
3. Add your key as an environment variable in the project settings
   (e.g. `OPENAI_API_KEY` or `GEMINI_API_KEY`). Without it the chat shows an error.
4. Deploy. Temps gives you a URL, and every `git push` redeploys automatically.

Docs: https://temps.sh/docs/your-first-deployment

## Configuration (environment variables)

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | One of them | Your API key |
| `LLM_PROVIDER` | No | `openai`, `gemini` or `anthropic`. Only needed if several keys are set |
| `LLM_MODEL` | No | Override the model. Defaults: `gpt-4o-mini`, `gemini-2.5-flash`, `claude-sonnet-5-5` |
| `SYSTEM_PROMPT` | No | Changes the bot's personality or instructions |

## Files

| File | Purpose |
| --- | --- |
| `app/page.js` | Chat UI |
| `app/api/chat/route.js` | Server route that calls OpenAI, Gemini or Claude |
| `Dockerfile` | Production build (Next.js standalone) |
| `.env.example` | Example environment variables |
