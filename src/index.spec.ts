import type { HttpRequest } from "@azure/functions";
import { propagation } from "@opentelemetry/api";

describe("auth function scaffold", () => {
  it("identifica a aplicação da Function", async () => {
    process.env.OS_INTERNAL_BASE_URL = "https://kong.example.test";
    process.env.INTERNAL_CLIENT_LOOKUP_TOKEN = "token-exclusivo-com-mais-de-trinta-bytes";
    process.env.JWT_CLIENT_SECRET = "segredo-com-mais-de-trinta-e-dois-bytes";

    const { functionAppName } = await import("./index");

    expect(functionAppName).toBe("soat-auth-function");
  });

  it("expõe healthcheck com correlação e sem dados sensíveis", async () => {
    process.env.OS_INTERNAL_BASE_URL = "https://kong.example.test";
    process.env.INTERNAL_CLIENT_LOOKUP_TOKEN = "token-exclusivo-com-mais-de-trinta-bytes";
    process.env.JWT_CLIENT_SECRET = "segredo-com-mais-de-trinta-e-dois-bytes";

    const { healthHandler } = await import("./index");
    const response = await healthHandler({
      headers: new Headers({ "x-correlation-id": "correlacao-teste" }),
    } as unknown as HttpRequest);

    expect(response).toEqual({
      status: 200,
      jsonBody: {
        status: "ok",
        service: "soat-auth-function",
        version: "local",
      },
      headers: {
        "cache-control": "no-store",
        "X-Correlation-ID": "correlacao-teste",
      },
    });
  });
  it("extrai cabeçalhos W3C da requisição de entrada", async () => {
    const extract = jest.spyOn(propagation, "extract");
    const { healthHandler } = await import("./index");
    await healthHandler({ headers: new Headers({ traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01", tracestate: "vendor=state" }) } as unknown as HttpRequest);
    expect(extract).toHaveBeenCalledWith(expect.anything(), { traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01", tracestate: "vendor=state" });
    extract.mockRestore();
  });
});
