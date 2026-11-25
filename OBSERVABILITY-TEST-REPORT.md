# Observability package validation report

## Included

- Temps React Analytics provider with pageview, page-leave, speed and engagement tracking.
- Metadata-only chatbot events: `chat_started`, `message_sent`, `response_received`, `chat_error`, `conversation_cleared`.
- OpenTelemetry Node auto-instrumentation, custom chat span, request counter, duration histogram and structured log events.
- OTLP exporter configuration reads the endpoint/protocol/headers injected by the deployment platform. No collector IP, gateway, host or token is hardcoded.
- Optional Sentry browser, Node.js and Edge setup. Configure `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to enable it.
- Request/message bodies, prompts, completions and provider credentials are not intentionally attached to custom analytics, custom telemetry or explicit Sentry exception events. Session Replay and Temps session recording are disabled.
- Cross-platform production start script uses `PORT` or defaults to 3000.

## Checks executed while preparing this archive

- Node syntax checks: passed for server-side JavaScript files and startup script.
- Automated Node tests: 3 passed, 0 failed.
- `package.json` / `package-lock.json` dependency and Node engine consistency: passed.
- Static check: no hardcoded local OTLP collector address in instrumentation setup.

## Checks not possible in this build environment

- A fresh `npm ci` did not complete because package installation timed out in this environment; the partial `node_modules` directory was not used for a build.
- Therefore a fresh production build of this merged archive was not independently completed here.
- The user previously reported a successful production build and `/api/health` response on the locally extracted patch, but that does not prove the final merged archive builds.
- Actual delivery to Temps, OTLP collector acceptance, dashboard arrival of traces/metrics/logs, and Sentry event ingestion require deployment credentials/runtime and must be confirmed after push.

## Required Temps environment values

- One LLM key: `OPENAI_API_KEY`, `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`.
- Temps-provided OTEL variables: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, and `OTEL_EXPORTER_OTLP_HEADERS` (or signal-specific equivalents where supplied by Temps).
- Optional Sentry DSNs: `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`.

Never commit `.env.local`, `.env`, or real credentials.
