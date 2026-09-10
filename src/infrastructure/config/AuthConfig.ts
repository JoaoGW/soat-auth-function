export interface AuthConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtExpiresIn: string;
}

const valorObrigatorio = (environment: NodeJS.ProcessEnv, nome: string): string => {
  const valor = environment[nome]?.trim();
  if (!valor) throw new Error(`Variável obrigatória ausente: ${nome}`);
  return valor;
};

export const carregarAuthConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): AuthConfig => {
  const databaseUrl = valorObrigatorio(environment, 'DATABASE_URL');
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get('sslmode');
  if (!['require', 'verify-ca', 'verify-full'].includes(sslmode ?? '')) {
    throw new Error('DATABASE_URL deve exigir TLS');
  }

  const jwtSecret = valorObrigatorio(environment, 'JWT_CLIENT_SECRET');
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_CLIENT_SECRET deve possuir ao menos 32 bytes');
  }

  const jwtExpiresIn = environment.JWT_CLIENT_EXPIRES_IN?.trim() || '15m';
  if (!/^([1-9]\d{0,3})(s|m|h)$/.test(jwtExpiresIn)) {
    throw new Error('JWT_CLIENT_EXPIRES_IN possui formato inválido');
  }

  return {
    databaseUrl,
    jwtSecret,
    jwtIssuer: environment.JWT_CLIENT_ISSUER?.trim() || 'soat-auth-function',
    jwtAudience: environment.JWT_CLIENT_AUDIENCE?.trim() || 'soat-api',
    jwtExpiresIn,
  };
};
