import "./infrastructure/observability/Instrumentation";
import { app, HttpHandler, HttpRequest, HttpResponseInit } from "@azure/functions";
import { randomUUID } from "node:crypto";
import { context as otelContext, propagation } from "@opentelemetry/api";

import { AutenticarClientePorCpf } from "./application/AutenticarClientePorCpf";
import { carregarAuthConfig } from "./infrastructure/config/AuthConfig";
import { HttpClienteAuthRepository } from "./infrastructure/http/HttpClienteAuthRepository";
import { JwtClienteTokenService } from "./infrastructure/security/JwtClienteTokenService";
import { criarAutenticarClienteHttpHandler } from "./interfaces/http/AutenticarClienteHttpHandler";
import {
  observability,
  observabilityResource,
} from "./infrastructure/observability/Instrumentation";

export const functionAppName = "soat-auth-function";

const config = carregarAuthConfig();
const useCase = new AutenticarClientePorCpf(
  new HttpClienteAuthRepository(config.osInternalBaseUrl, config.internalClientLookupToken),
  new JwtClienteTokenService(config),
);

function withIncomingTrace<T>(request: HttpRequest, action: () => Promise<T>): Promise<T> {
  const traceparent = request.headers.get("traceparent");
  const tracestate = request.headers.get("tracestate");
  const carrier = { ...(traceparent ? { traceparent } : {}), ...(tracestate ? { tracestate } : {}) };
  return otelContext.with(propagation.extract(otelContext.active(), carrier), action);
}

export const authenticateHandler: HttpHandler = async (request, context) => {
  const correlationId =
    request.headers.get("x-correlation-id") || randomUUID();
  const response = await withIncomingTrace(request, () => observability.execute(
    "/auth/cpf",
    correlationId,
    () =>
      Promise.resolve(
        criarAutenticarClienteHttpHandler(useCase)(request, context),
      ),
    "POST",
  ));
  const status = response.status ?? 200;
  observability.recordAttempt(
    status === 200 ? "sucesso" : status === 401 ? "negada" : "erro",
  );
  return {
    ...response,
    headers: { ...response.headers, "X-Correlation-ID": correlationId },
  };
};

app.http("autenticar-cliente-por-cpf", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/cpf",
  handler: authenticateHandler,
});

export const healthHandler = async (
  request: HttpRequest,
): Promise<HttpResponseInit> => {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  return withIncomingTrace(request, () => observability.execute("/health", correlationId, async () => ({
      status: 200,
      jsonBody: {
        status: "ok",
        service: observabilityResource.service,
        version: observabilityResource.version,
      },
      headers: {
        "cache-control": "no-store",
        "X-Correlation-ID": correlationId,
      },
    })));
};

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: healthHandler,
});
