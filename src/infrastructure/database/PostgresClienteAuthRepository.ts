import { Pool, QueryResultRow } from 'pg';

import {
  ClienteAuthRepository,
  ClienteAutenticavel,
} from '../../application/ports/ClienteAuthRepository';

interface ClienteRow extends QueryResultRow {
  id: string;
  ativo: boolean;
}

export class PostgresClienteAuthRepository implements ClienteAuthRepository {
  constructor(private readonly pool: Pick<Pool, 'query'>) {}

  async buscarPorCpf(cpf: string): Promise<ClienteAutenticavel | null> {
    const resultado = await this.pool.query<ClienteRow>(
      'SELECT "id", "ativo" FROM "Cliente" WHERE "documento" = $1 LIMIT 1',
      [cpf],
    );
    const cliente = resultado.rows[0];

    return cliente ? { id: cliente.id, ativo: cliente.ativo } : null;
  }
}
