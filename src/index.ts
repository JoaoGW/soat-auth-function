import { app } from '@azure/functions';
import { Pool } from 'pg';

import { AutenticarClientePorCpf } from './application/AutenticarClientePorCpf';
import { carregarAuthConfig } from './infrastructure/config/AuthConfig';
import { PostgresClienteAuthRepository } from './infrastructure/database/PostgresClienteAuthRepository';
import { JwtClienteTokenService } from './infrastructure/security/JwtClienteTokenService';
import { criarAutenticarClienteHttpHandler } from './interfaces/http/AutenticarClienteHttpHandler';

export const functionAppName = 'soat-auth-function';

const config = carregarAuthConfig();
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});
const useCase = new AutenticarClientePorCpf(
  new PostgresClienteAuthRepository(pool),
  new JwtClienteTokenService(config),
);

app.http('autenticar-cliente-por-cpf', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/cpf',
  handler: criarAutenticarClienteHttpHandler(useCase),
});
