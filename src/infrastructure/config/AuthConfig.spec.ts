import { carregarAuthConfig } from './AuthConfig';

const environment = {
  DATABASE_URL: 'postgresql://user:password@server.postgres.database.azure.com:5432/oficina?sslmode=require',
  JWT_CLIENT_SECRET: 'segredo-com-mais-de-trinta-e-dois-bytes',
};

describe('carregarAuthConfig', () => {
  it('aplica valores seguros padrão para o JWT de cliente', () => {
    expect(carregarAuthConfig(environment)).toMatchObject({
      jwtIssuer: 'soat-auth-function',
      jwtAudience: 'soat-api',
      jwtExpiresIn: '15m',
    });
  });

  it('rejeita conexão sem TLS', () => {
    expect(() => carregarAuthConfig({ ...environment, DATABASE_URL: 'postgresql://localhost/oficina' })).toThrow(
      'DATABASE_URL deve exigir TLS',
    );
  });

  it('rejeita segredo JWT curto', () => {
    expect(() => carregarAuthConfig({ ...environment, JWT_CLIENT_SECRET: 'curto' })).toThrow(
      'JWT_CLIENT_SECRET deve possuir ao menos 32 bytes',
    );
  });
});
