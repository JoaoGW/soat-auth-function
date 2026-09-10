import type { HttpRequest } from "@azure/functions";

describe("auth function scaffold", () => {
  it("identifica a aplicação da Function", async () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@server.postgres.database.azure.com:5432/oficina?sslmode=require";
    process.env.JWT_CLIENT_SECRET = "segredo-com-mais-de-trinta-e-dois-bytes";

    const { functionAppName } = await import("./index");

    expect(functionAppName).toBe("soat-auth-function");
  });

  it("expõe healthcheck com correlação e sem dados sensíveis", async () => {
    process.env.DATABASE_URL =
      "postgresql://user:password@server.postgres.database.azure.com:5432/oficina?sslmode=require";
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
});
