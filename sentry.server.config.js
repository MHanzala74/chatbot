import * as Sentry from "@sentry/nextjs";

function scrubEvent(event) {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
  }
  delete event.user;
  return event;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  enableOpenTelemetrySetup: false,
  integrations: [Sentry.openTelemetryIntegration()],
  beforeSend: scrubEvent,
});
