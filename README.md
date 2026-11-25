# Simple Chatbot with Temps Observability

A Next.js App Router chatbot supporting OpenAI, Google Gemini and Anthropic Claude. LLM API keys stay on the server.

## Observability included

- **Temps Analytics:** automatic pageviews, page-leave, speed and engagement tracking, plus metadata-only chat events.
- **OpenTelemetry:** Node.js auto-instrumentation, custom chat spans, request counters, duration histograms and structured logs. When deployed on Temps, the SDK uses the OTLP endpoint/protocol/headers injected by Temps. No endpoint or gateway is hardcoded.
- **Sentry:** optional browser, Node.js and Edge error capture. Configure a Sentry project DSN to enable it.
- **Privacy:** prompts, replies, API keys, provider response bodies and request bodies are not added to custom analytics events, custom OTel spans/metrics/logs or explicit Sentry error events. Session recording and Sentry Replay are disabled. Chat content is marked `rr-block` as an additional safeguard.

## 1. Configure an LLM provider

Set one of `OPENAI_API_KEY`, `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` in your local `.env.local` or Temps project environment. Optionally set `LLM_PROVIDER`, `LLM_MODEL` and `SYSTEM_PROMPT`.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# Add one LLM API key to .env.local
npm run dev
```

Open `http://localhost:3000`. Local OTel exporters remain disabled unless an OTLP endpoint is configured. Temps Analytics ignores localhost by default.

Health endpoint: `GET /api/health` returns `{ "status": "ok" }`.

## 3. Configure Temps

Connect the repository to Temps and deploy the Dockerfile on port `3000`.

Set the LLM provider key in the Temps project environment. Temps should inject its own `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL` and `OTEL_EXPORTER_OTLP_HEADERS`. The app reads these values and does not hardcode a Docker gateway, hostname, token or endpoint.

The OpenTelemetry SDK selects OTLP exporters for traces, metrics and logs when an OTLP endpoint is present. If no endpoint is present, those exporters are disabled to avoid sending to an assumed localhost collector.

## 4. Configure Sentry (optional)

Create a Sentry project for Next.js and add its DSN to both:

- `SENTRY_DSN` for Node.js/Edge server errors.
- `NEXT_PUBLIC_SENTRY_DSN` for browser errors.

Do not put a Sentry auth token in either DSN variable. Source-map upload is not configured because it requires a separate Sentry organization/project/auth-token setup.

## 5. Analytics events

The client sends these event names with metadata only:

- `chat_started`
- `message_sent` (message count only)
- `response_received` (message count and latency only)
- `chat_error` (generic error category only)
- `conversation_cleared` (message count only)

No prompt or assistant response text is sent to Temps Analytics.

## 6. Deploy

```bash
git add .
git commit -m "Add Temps analytics and observability"
git push
```

Temps can then build and deploy the pushed revision. Confirm traces, metrics and logs separately in the Temps dashboard; adding exporters does not itself prove that the remote collector accepted the data.

## 7. Verify before deployment

Run the automated source checks and production build together:

```bash
npm ci
npm run verify
```

The `start` script is cross-platform and uses the platform-provided `PORT` value, falling back to `3000` for local use. Do not hardcode a port in the Temps project configuration.
