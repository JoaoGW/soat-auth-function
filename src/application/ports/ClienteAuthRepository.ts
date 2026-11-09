export interface ClienteAutenticavel {
  id: string;
  ativo: boolean;
}

export interface ClienteAuthRepository {
  buscarPorCpf(cpf: string): Promise<ClienteAutenticavel | null>;
}
