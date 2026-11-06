export interface AuthConfig {
  osInternalBaseUrl: string;
  internalClientLookupToken: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtExpiresIn: string;
  observabilityEnabled?: boolean;
  newRelicLicenseKey?: string;
  serviceVersion?: string;
}

const valorObrigatorio = (
  environment: NodeJS.ProcessEnv,
  nome: string,
): string => {
  const valor = environment[nome]?.trim();
  if (!valor) throw new Error(`Variável obrigatória ausente: ${nome}`);
  return valor;
};

export const carregarAuthConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): AuthConfig => {
  const osInternalBaseUrl = valorObrigatorio(environment, "OS_INTERNAL_BASE_URL");
  const url = new URL(osInternalBaseUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("OS_INTERNAL_BASE_URL deve ser HTTPS sem credenciais ou parâmetros");
  }
  const internalClientLookupToken = valorObrigatorio(environment, "INTERNAL_CLIENT_LOOKUP_TOKEN");
  if (Buffer.byteLength(internalClientLookupToken, "utf8") < 32) {
    throw new Error("INTERNAL_CLIENT_LOOKUP_TOKEN deve possuir ao menos 32 bytes");
  }

  const jwtSecret = valorObrigatorio(environment, "JWT_CLIENT_SECRET");
  if (Buffer.byteLength(jwtSecret, "utf8") < 32) {
    throw new Error("JWT_CLIENT_SECRET deve possuir ao menos 32 bytes");
  }
  if (internalClientLookupToken === jwtSecret) throw new Error("Token de integração deve ser exclusivo");

  const jwtExpiresIn = environment.JWT_CLIENT_EXPIRES_IN?.trim() || "15m";
  if (!/^([1-9]\d{0,3})(s|m|h)$/.test(jwtExpiresIn)) {
    throw new Error("JWT_CLIENT_EXPIRES_IN possui formato inválido");
  }

  const observabilityEnabled = environment.OBSERVABILITY_ENABLED === "true";
  const newRelicLicenseKey = environment.NEW_RELIC_LICENSE_KEY?.trim();
  if (observabilityEnabled && !newRelicLicenseKey) {
    throw new Error(
      "NEW_RELIC_LICENSE_KEY é obrigatória quando OBSERVABILITY_ENABLED=true",
    );
  }

  return {
    osInternalBaseUrl,
    internalClientLookupToken,
    jwtSecret,
    jwtIssuer: environment.JWT_CLIENT_ISSUER?.trim() || "soat-auth-function",
    jwtAudience: environment.JWT_CLIENT_AUDIENCE?.trim() || "soat-api",
    jwtExpiresIn,
    observabilityEnabled,
    newRelicLicenseKey,
    serviceVersion: environment.OTEL_SERVICE_VERSION?.trim() || "local",
  };
};
