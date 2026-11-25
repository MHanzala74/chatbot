const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('production start script reads PORT and validates it before spawning Next.js', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'start.js'), 'utf8');
  assert.match(script, /process\.env\.PORT\s*\|\|\s*'3000'/);
  assert.match(script, /Number\.isInteger\(port\)/);
  assert.match(script, /'start'/);
  assert.match(script, /0\.0\.0\.0/);
});

test('observability wiring is present without hardcoded collector endpoints', () => {
  const root = path.join(__dirname, '..');
  const instrumentation = fs.readFileSync(path.join(root, 'instrumentation.js'), 'utf8');
  const analytics = fs.readFileSync(path.join(root, 'components', 'analytics-provider.jsx'), 'utf8');
  const telemetry = fs.readFileSync(path.join(root, 'lib', 'telemetry.js'), 'utf8');
  assert.match(instrumentation, /OTEL_EXPORTER_OTLP_ENDPOINT/);
  assert.match(instrumentation, /getNodeAutoInstrumentations/);
  assert.match(analytics, /TempsAnalyticsProvider/);
  assert.match(analytics, /enableSessionRecording=\{false\}/);
  assert.match(telemetry, /chat_requests_total/);
  assert.match(telemetry, /chat_request_duration_ms/);
  assert.doesNotMatch(instrumentation, /172\.20\.0\.1|localhost:\d+|127\.0\.0\.1/);
});

test('chat telemetry and explicit Sentry capture do not attach message content', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'app', 'api', 'chat', 'route.js'), 'utf8');
  assert.match(route, /withChatTelemetry/);
  assert.match(route, /Sentry\.captureException\(new Error\("LLM provider request failed"\)/);
  assert.doesNotMatch(route, /captureException\(err\)|captureException\(error\)/);
});
