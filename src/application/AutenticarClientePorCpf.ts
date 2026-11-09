import { Cpf } from "../domain/Cpf";
import { ClienteAuthRepository } from "./ports/ClienteAuthRepository";
import { TokenService } from "./ports/TokenService";

export class ClienteNaoAutorizadoError extends Error {
  constructor() {
    super("CPF não autorizado");
  }
}

export interface AutenticarClientePorCpfInput {
  cpf: unknown;
}

export interface AutenticarClientePorCpfOutput {
  accessToken: string;
}

export class AutenticarClientePorCpf {
  constructor(
    private readonly clientes: ClienteAuthRepository,
    private readonly tokens: TokenService,
  ) {}

  async executar(
    input: AutenticarClientePorCpfInput,
  ): Promise<AutenticarClientePorCpfOutput> {
    const cpf = Cpf.criar(input.cpf);
    if (!cpf) throw new ClienteNaoAutorizadoError();

    const cliente = await this.clientes.buscarPorCpf(cpf.valor);
    if (!cliente?.ativo) throw new ClienteNaoAutorizadoError();

    return {
      accessToken: this.tokens.assinar({
        sub: cliente.id,
        cpf: cpf.valor,
        role: "cliente",
      }),
    };
  }
}
