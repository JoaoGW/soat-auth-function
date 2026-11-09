import { HttpClienteAuthRepository } from "./HttpClienteAuthRepository";
import { context, propagation, ROOT_CONTEXT, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

describe("HttpClienteAuthRepository", () => {
  const token = "token-interno";
  it("propaga o contexto W3C ao consultar o OS sem expor CPF na URL", async () => {
    const manager = new AsyncLocalStorageContextManager().enable();
    context.setGlobalContextManager(manager);
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    try {
      const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({ cliente: null })));
      const repo = new HttpClienteAuthRepository("https://os.example", token, fetcher);
      const span = trace.setSpanContext(ROOT_CONTEXT, { traceId: "0123456789abcdef0123456789abcdef", spanId: "0123456789abcdef", traceFlags: TraceFlags.SAMPLED });
      await context.with(span, () => repo.buscarPorCpf("52998224725"));
      const [url, options] = fetcher.mock.calls[0];
      expect(url).not.toContain("52998224725");
      expect(options.headers.traceparent).toBe("00-0123456789abcdef0123456789abcdef-0123456789abcdef-01");
      expect(options.headers.authorization).toBe(`Bearer ${token}`);
    } finally { propagation.disable(); context.disable(); manager.disable(); }
  });
  it("envia CPF ao OS e retorna apenas o cliente", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({ cliente: { id: "1", ativo: true } }), { status: 200 }));
    const repo = new HttpClienteAuthRepository("https://os.example", token, fetcher);
    await expect(repo.buscarPorCpf("52998224725")).resolves.toEqual({ id: "1", ativo: true });
    expect(fetcher).toHaveBeenCalledWith("https://os.example/internal/clientes/validar-cpf", expect.objectContaining({ method: "POST", redirect: "error", body: JSON.stringify({ cpf: "52998224725" }) }));
  });
  it("preserva ausência e inatividade", async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(new Response(JSON.stringify({ cliente: null }))).mockResolvedValueOnce(new Response(JSON.stringify({ cliente: { id: "1", ativo: false } })));
    const repo = new HttpClienteAuthRepository("https://os.example", token, fetcher);
    await expect(repo.buscarPorCpf("52998224725")).resolves.toBeNull();
    await expect(repo.buscarPorCpf("52998224725")).resolves.toEqual({ id: "1", ativo: false });
  });
  it.each([new Response("erro", { status: 503 }), new Response(JSON.stringify({ cliente: { id: 123, ativo: true } }))])("falha fechada para HTTP ou resposta inválida", async (response) => {
    const repo = new HttpClienteAuthRepository("https://os.example", token, jest.fn().mockResolvedValue(response));
    await expect(repo.buscarPorCpf("52998224725")).rejects.toThrow();
  });
  it("propaga falhas de rede sem retornar cliente", async () => {
    const repo = new HttpClienteAuthRepository("https://os.example", token, jest.fn().mockRejectedValue(new Error("timeout")));
    await expect(repo.buscarPorCpf("52998224725")).rejects.toThrow("timeout");
  });
});
