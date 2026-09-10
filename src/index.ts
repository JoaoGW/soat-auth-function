import "./infrastructure/observability/Instrumentation";
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

import { AutenticarClientePorCpf } from "./application/AutenticarClientePorCpf";
import { carregarAuthConfig } from "./infrastructure/config/AuthConfig";
import { PostgresClienteAuthRepository } from "./infrastructure/database/PostgresClienteAuthRepository";
import { JwtClienteTokenService } from "./infrastructure/security/JwtClienteTokenService";
import { criarAutenticarClienteHttpHandler } from "./interfaces/http/AutenticarClienteHttpHandler";
import {
  observability,
  observabilityResource,
} from "./infrastructure/observability/Instrumentation";

export const functionAppName = "soat-auth-function";

const config = carregarAuthConfig();
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});
const useCase = new AutenticarClientePorCpf(
  new PostgresClienteAuthRepository(pool),
  new JwtClienteTokenService(config),
);

app.http("autenticar-cliente-por-cpf", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/cpf",
  handler: async (request, context) => {
    const correlationId =
      request.headers.get("x-correlation-id") || randomUUID();
    const response = await observability.execute(
      "/auth/cpf",
      correlationId,
      () =>
        Promise.resolve(
          criarAutenticarClienteHttpHandler(useCase)(request, context),
        ),
    );
    const status = response.status ?? 200;
    observability.recordAttempt(
      status === 200 ? "sucesso" : status === 401 ? "negada" : "erro",
    );
    return {
      ...response,
      headers: { ...response.headers, "X-Correlation-ID": correlationId },
    };
  },
});

export const healthHandler = async (
  request: HttpRequest,
): Promise<HttpResponseInit> => {
  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  return observability.execute("/health", correlationId, async () => ({
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
    }));
};

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: healthHandler,
});
