import { ClienteAuthRepository, ClienteAutenticavel } from "../../application/ports/ClienteAuthRepository";
import { observability } from "../observability/Instrumentation";
import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

export class HttpClienteAuthRepository implements ClienteAuthRepository {
  constructor(private readonly baseUrl: string, private readonly token: string, private readonly fetcher: typeof fetch = fetch) {}

  async buscarPorCpf(cpf: string): Promise<ClienteAutenticavel | null> {
    return trace.getTracer("soat-auth-function").startActiveSpan("consultar OS", { kind: SpanKind.CLIENT }, async span => {
      try {
        const headers: Record<string, string> = { authorization: `Bearer ${this.token}`, "content-type": "application/json" };
        const traceCarrier: Record<string, string> = {};
        propagation.inject(context.active(), traceCarrier);
        if (traceCarrier.traceparent) headers.traceparent = traceCarrier.traceparent;
        if (traceCarrier.tracestate) headers.tracestate = traceCarrier.tracestate;
        const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, "")}/internal/clientes/validar-cpf`, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
          headers,
          body: JSON.stringify({ cpf }),
        });
        if (!response.ok) throw new Error("Falha na consulta interna de cliente");
        const result: unknown = await response.json();
        if (typeof result !== "object" || result === null || !("cliente" in result)) throw new Error("Resposta interna inválida");
        const cliente = result.cliente;
        if (cliente === null) return null;
        if (typeof cliente !== "object" || !("id" in cliente) || !("ativo" in cliente) ||
            typeof cliente.id !== "string" || !cliente.id || typeof cliente.ativo !== "boolean") throw new Error("Resposta interna inválida");
        return { id: cliente.id, ativo: cliente.ativo };
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        observability.recordIntegrationError("os-http");
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
