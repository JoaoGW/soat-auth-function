import { carregarAuthConfig } from "./AuthConfig";

const environment = {
  OS_INTERNAL_BASE_URL: "https://kong.example.test",
  INTERNAL_CLIENT_LOOKUP_TOKEN: "token-exclusivo-com-mais-de-trinta-bytes",
  JWT_CLIENT_SECRET: "segredo-com-mais-de-trinta-e-dois-bytes",
};

describe("carregarAuthConfig", () => {
  it("aplica valores seguros padrão para o JWT de cliente", () => {
    expect(carregarAuthConfig(environment)).toMatchObject({
      jwtIssuer: "soat-auth-function",
      jwtAudience: "soat-api",
      jwtExpiresIn: "15m",
    });
  });

  it("rejeita conexão sem TLS", () => {
    expect(() =>
      carregarAuthConfig({
        ...environment,
        OS_INTERNAL_BASE_URL: "http://localhost",
      }),
    ).toThrow("OS_INTERNAL_BASE_URL deve ser HTTPS");
  });

  it("rejeita segredo JWT curto", () => {
    expect(() =>
      carregarAuthConfig({ ...environment, JWT_CLIENT_SECRET: "curto" }),
    ).toThrow("JWT_CLIENT_SECRET deve possuir ao menos 32 bytes");
  });

  it("exige token de integração forte e distinto do segredo JWT", () => {
    expect(() => carregarAuthConfig({ ...environment, INTERNAL_CLIENT_LOOKUP_TOKEN: "curto" })).toThrow("ao menos 32 bytes");
    expect(() => carregarAuthConfig({ ...environment, INTERNAL_CLIENT_LOOKUP_TOKEN: environment.JWT_CLIENT_SECRET })).toThrow("deve ser exclusivo");
  });
});
