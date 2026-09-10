import { metrics, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

const enabled = process.env.OBSERVABILITY_ENABLED === "true";
const service = process.env.OTEL_SERVICE_NAME ?? "soat-auth-function";
const version = process.env.OTEL_SERVICE_VERSION ?? "local";
const environment = process.env.NODE_ENV ?? "development";

if (enabled) {
  const licenseKey = process.env.NEW_RELIC_LICENSE_KEY;
  if (!licenseKey)
    throw new Error(
      "NEW_RELIC_LICENSE_KEY é obrigatória quando OBSERVABILITY_ENABLED=true",
    );
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "https://otlp.nr-data.net:4318";
  const headers = { "api-key": licenseKey };
  const resource = resourceFromAttributes({
    "service.name": service,
    "service.version": version,
    "deployment.environment.name": environment,
  });
  new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${endpoint}/v1/metrics`,
        headers,
      }),
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-pg": {
          enhancedDatabaseReporting: false,
          requestHook: (span) =>
            span.setAttribute("db.query.text", "[redacted]"),
        },
        "@opentelemetry/instrumentation-http": {
          requestHook: (span) => {
            span.setAttribute("url.full", "[redacted]");
            span.setAttribute("url.query", "[redacted]");
            span.setAttribute("http.target", "[redacted]");
          },
        },
      }),
    ],
  }).start();
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({ url: `${endpoint}/v1/logs`, headers }),
      }),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);
}

const meter = metrics.getMeter("soat-auth-function");
const requests = meter.createCounter("soat.http.requisicoes");
const errors = meter.createCounter("soat.http.erros");
const duration = meter.createHistogram("soat.http.duracao", { unit: "ms" });
const attempts = meter.createCounter("soat.auth.tentativas");
const integrationErrors = meter.createCounter("soat.integracoes.erros");
const logger = logs.getLogger("soat-auth-function");

export const observability = {
  async execute<T>(
    route: string,
    correlationId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return trace
      .getTracer("soat-auth-function")
      .startActiveSpan(route, async (span) => {
        const start = performance.now();
        span.setAttribute("soat.correlation_id", correlationId);
        try {
          const result = await operation();
          const status =
            typeof result === "object" && result !== null && "status" in result
              ? Number(result.status)
              : 200;
          this.recordRequest(
            route,
            status,
            Math.round(performance.now() - start),
            correlationId,
          );
          return result;
        } catch (error) {
          this.recordRequest(
            route,
            500,
            Math.round(performance.now() - start),
            correlationId,
          );
          throw error;
        } finally {
          span.end();
        }
      });
  },
  recordAttempt(outcome: "sucesso" | "negada" | "erro"): void {
    attempts.add(1, { resultado: outcome });
  },
  recordIntegrationError(): void {
    integrationErrors.add(1, { integracao: "postgres" });
    this.log("error", "falha de integração", { integracao: "postgres" });
  },
  recordRequest(
    route: string,
    status: number,
    elapsed: number,
    correlationId: string,
  ): void {
    const attributes = { route, "http.response.status_code": status };
    requests.add(1, attributes);
    duration.record(elapsed, attributes);
    if (status >= 500) errors.add(1, attributes);
    this.log(status >= 500 ? "error" : "info", "requisição concluída", {
      ...attributes,
      duration: elapsed,
      correlationId,
    });
  },
  log(
    level: "info" | "error",
    message: string,
    attributes: Record<string, string | number | boolean> = {},
  ): void {
    const span = trace.getActiveSpan()?.spanContext();
    const payload = {
      environment,
      service,
      version,
      ...attributes,
      traceId: span?.traceId,
      spanId: span?.spanId,
    };
    logger.emit({
      severityNumber:
        level === "error" ? SeverityNumber.ERROR : SeverityNumber.INFO,
      severityText: level.toUpperCase(),
      body: message,
      attributes: payload,
    });
    console[level](
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...payload,
      }),
    );
  },
};

export const observabilityResource = { service, version };
