import { metrics, SpanStatusCode, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const meter = metrics.getMeter("temps-chatbot", "1.0.0");
const tracer = trace.getTracer("temps-chatbot", "1.0.0");
const logger = logs.getLogger("temps-chatbot", "1.0.0");

const requestCounter = meter.createCounter("chat_requests_total", {
  description: "Number of completed chatbot provider requests",
});
const requestDuration = meter.createHistogram("chat_request_duration_ms", {
  description: "Chatbot provider request duration in milliseconds",
  unit: "ms",
});

/**
 * Trace and measure an LLM request. Only low-cardinality metadata is recorded;
 * message contents, API keys, provider response bodies and raw errors are never
 * added to spans, metrics or OpenTelemetry logs.
 */
export async function withChatTelemetry({ provider, model, operation }) {
  const startedAt = performance.now();
  const attributes = { "app.provider": provider, "app.model": model };

  return tracer.startActiveSpan("chat.completion", { attributes }, async (span) => {
    let outcome = "success";
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      outcome = "error";
      span.addEvent("chat.provider.error", { "app.provider": provider });
      span.setStatus({ code: SpanStatusCode.ERROR, message: "LLM provider request failed" });
      throw error;
    } finally {
      const durationMs = Math.max(0, performance.now() - startedAt);
      const metricAttributes = { ...attributes, "app.outcome": outcome };
      requestCounter.add(1, metricAttributes);
      requestDuration.record(durationMs, metricAttributes);
      logger.emit({
        severityNumber: outcome === "success" ? SeverityNumber.INFO : SeverityNumber.ERROR,
        severityText: outcome === "success" ? "INFO" : "ERROR",
        body: outcome === "success" ? "chat.request.completed" : "chat.request.failed",
        attributes: { ...metricAttributes, "app.duration_ms": Math.round(durationMs) },
      });
      span.end();
    }
  });
}
