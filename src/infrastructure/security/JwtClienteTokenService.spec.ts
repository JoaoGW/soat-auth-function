import jwt from "jsonwebtoken";

import { JwtClienteTokenService } from "./JwtClienteTokenService";

describe("JwtClienteTokenService", () => {
  it("emite JWT de cliente com issuer, audience e expiração", () => {
    const token = new JwtClienteTokenService({
      databaseUrl: "postgresql://unused?sslmode=require",
      jwtSecret: "segredo-com-mais-de-trinta-e-dois-bytes",
      jwtIssuer: "soat-auth-function",
      jwtAudience: "soat-api",
      jwtExpiresIn: "15m",
    }).assinar({ sub: "cliente-1", cpf: "52998224725", role: "cliente" });

    expect(
      jwt.verify(token, "segredo-com-mais-de-trinta-e-dois-bytes", {
        issuer: "soat-auth-function",
        audience: "soat-api",
      }),
    ).toMatchObject({ sub: "cliente-1", cpf: "52998224725", role: "cliente" });
  });
});
