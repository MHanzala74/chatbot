
import * as Sentry from "@sentry/nextjs";

let telemetrySdk;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Correct the Temps collector hostname while preserving its endpoint path.
    const collectorHost =
      process.env.TEMPS_OTEL_COLLECTOR_HOST || "192.168.9.47";

    const endpointVariables = [
      "OTEL_EXPORTER_OTLP_ENDPOINT",
      "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
      "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT",
      "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT",
    ];

    for (const variable of endpointVariables) {
      const value = process.env[variable];

      if (value) {
        try {
          const endpoint = new URL(value);

          if (endpoint.hostname === "console.127-0-0-1.sslip.io") {
            endpoint.hostname = collectorHost;
            process.env[variable] = endpoint.toString();
          }
        } catch {
          console.error(`[OTel] Invalid endpoint in ${variable}`);
        }
      }
    }

    const hasOtlpEndpoint = endpointVariables.some(
      (variable) => Boolean(process.env[variable])
    );

    if (hasOtlpEndpoint) {
      process.env.OTEL_TRACES_EXPORTER ||= "otlp";
      process.env.OTEL_METRICS_EXPORTER ||= "otlp";
      process.env.OTEL_LOGS_EXPORTER ||= "otlp";
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL ||= "http/protobuf";
    } else {
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
      instrumentations: [
        autoInstrumentationModule.getNodeAutoInstrumentations(),
      ],
    });

    telemetrySdk.start();

    await import("./sentry.server.config.js");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config.js");
  }
}

export const onRequestError = Sentry.captureRequestError;
