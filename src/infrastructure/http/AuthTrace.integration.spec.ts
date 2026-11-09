import { createServer, IncomingMessage } from "node:http";
import { AddressInfo } from "node:net";
import { app, HttpHandler, HttpRequest, InvocationContext } from "@azure/functions";
import { context, propagation, ROOT_CONTEXT, trace } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import jwt from "jsonwebtoken";

jest.mock("@azure/functions", () => ({ app: { http: jest.fn() } }));

it("propaga o trace da Function pela fronteira HTTP simulada do OS", async () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  const secret = "segredo-cliente-para-teste-com-mais-de-trinta-bytes";
  const token = "token-interno-para-teste-com-mais-de-trinta-bytes";
  const traceId = "0123456789abcdef0123456789abcdef";
  const incomingParent = "0123456789abcdef";
  const exporter = new InMemorySpanExporter();
  const sdk = new NodeSDK({ spanProcessors: [new SimpleSpanProcessor(exporter)], instrumentations: [] });
  sdk.start();
  let received: IncomingMessage | undefined;
  const server = createServer((req, res) => {
    received = req;
    const parent = propagation.extract(ROOT_CONTEXT, req.headers);
    context.with(parent, () => trace.getTracer("os-http-test").startActiveSpan("consulta interna OS", span => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ cliente: { id: "cliente-teste", ativo: true } }));
      span.end();
    }));
  });
  try {
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const port = (server.address() as AddressInfo).port;
    process.env = { ...originalEnv, OS_INTERNAL_BASE_URL: "https://os.local.test/fase4", INTERNAL_CLIENT_LOOKUP_TOKEN: token, JWT_CLIENT_SECRET: secret, OBSERVABILITY_ENABLED: "false" };
    global.fetch = ((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url !== "https://os.local.test/fase4/internal/clientes/validar-cpf") throw new Error("Destino inesperado");
      return originalFetch(`http://127.0.0.1:${port}/fase4/internal/clientes/validar-cpf`, init);
    }) as typeof fetch;
    await import("../../index");
    const registration = jest.mocked(app.http).mock.calls.find(([name]) => name === "autenticar-cliente-por-cpf");
    expect(registration).toBeDefined();
    const handler = registration![1].handler as HttpHandler;
    const request = { headers: new Headers({ traceparent: `00-${traceId}-${incomingParent}-01`, tracestate: "vendor=state" }), json: async () => ({ cpf: "52998224725" }) } as unknown as HttpRequest;
    const result = await handler(request, {} as InvocationContext);
    expect(result).toMatchObject({ status: 200 });
    const accessToken = (result as { jsonBody: { accessToken: string } }).jsonBody.accessToken;
    expect(jwt.verify(accessToken, secret, { issuer: "soat-auth-function", audience: "soat-api" })).toMatchObject({ sub: "cliente-teste", role: "cliente" });
    expect(received?.url).toBe("/fase4/internal/clientes/validar-cpf");
    expect(received?.headers.authorization).toBe(`Bearer ${token}`);
    expect(received?.headers.tracestate).toBe("vendor=state");
    const spans = exporter.getFinishedSpans();
    const authSpan = spans.find(span => span.name === "/auth/cpf");
    const clientSpan = spans.find(span => span.name === "consultar OS");
    const osSpan = spans.find(span => span.name === "consulta interna OS");
    expect(authSpan?.spanContext().traceId).toBe(traceId);
    expect(authSpan?.parentSpanContext?.spanId).toBe(incomingParent);
    expect(osSpan?.spanContext().traceId).toBe(traceId);
    expect(clientSpan?.parentSpanContext?.spanId).toBe(authSpan?.spanContext().spanId);
    expect(osSpan?.parentSpanContext?.spanId).toBe(clientSpan?.spanContext().spanId);
    expect(JSON.stringify(spans.map(span => span.attributes))).not.toContain("52998224725");
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
    await new Promise<void>(resolve => server.close(() => resolve()));
    await sdk.shutdown();
    context.disable(); propagation.disable(); trace.disable();
  }
});
