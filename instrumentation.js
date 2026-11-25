import * as Sentry from "@sentry/nextjs";

let telemetrySdk;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Temps supplies the OTLP endpoint, protocol and authentication headers.
    // Do not replace or hardcode those values here.
    const hasOtlpEndpoint = Boolean(
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
        process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
        process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT
    );

    if (hasOtlpEndpoint) {
      process.env.OTEL_TRACES_EXPORTER ||= "otlp";
      process.env.OTEL_METRICS_EXPORTER ||= "otlp";
      process.env.OTEL_LOGS_EXPORTER ||= "otlp";
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||= "http/protobuf";
    } else {
      // Keep local development quiet when no collector is configured.
      process.env.OTEL_TRACES_EXPORTER ||= "none";
      process.env.OTEL_METRICS_EXPORTER ||= "none";
      process.env.OTEL_LOGS_EXPORTER ||= "none";
    }

    process.env.OTEL_SERVICE_NAME ||= "temps-chatbot";

    const [sdkModule, autoInstrumentationModule, resourcesModule] =
      await Promise.all([
        import("@opentelemetry/sdk-node"),
        import("@opentelemetry/auto-instrumentations-node"),
        import("@opentelemetry/resources"),
      ]);

    telemetrySdk = new sdkModule.NodeSDK({
      resource: resourcesModule.resourceFromAttributes({
        "service.name": process.env.OTEL_SERVICE_NAME,
        "service.version": "1.0.0",
        "deployment.environment.name": process.env.NODE_ENV || "development",
      }),
      instrumentations: [autoInstrumentationModule.getNodeAutoInstrumentations()],
    });
    telemetrySdk.start();

    // Initialize Sentry after OpenTelemetry has registered its providers.
    await import("./sentry.server.config.js");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config.js");
  }
}

// Next.js 15+ calls this for errors from server components, route handlers,
// middleware and other request-scoped server work.
export const onRequestError = Sentry.captureRequestError;
