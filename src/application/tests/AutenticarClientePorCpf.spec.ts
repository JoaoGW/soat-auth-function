import {
  AutenticarClientePorCpf,
  ClienteNaoAutorizadoError,
} from '../AutenticarClientePorCpf';
import { ClienteAuthRepository } from '../ports/ClienteAuthRepository';
import { TokenService } from '../ports/TokenService';

describe('AutenticarClientePorCpf', () => {
  const tokens: TokenService = {
    assinar: jest.fn(() => 'jwt-do-cliente'),
  };

  it('emite token para cliente ativo', async () => {
    const clientes: ClienteAuthRepository = {
      buscarPorCpf: jest.fn().mockResolvedValue({ id: 'cliente-1', ativo: true }),
    };
    const useCase = new AutenticarClientePorCpf(clientes, tokens);

    await expect(useCase.executar({ cpf: '529.982.247-25' })).resolves.toEqual({
      accessToken: 'jwt-do-cliente',
    });
    expect(tokens.assinar).toHaveBeenCalledWith({
      sub: 'cliente-1',
      cpf: '52998224725',
      role: 'cliente',
    });
  });

  it('rejeita CPF inválido sem consultar o banco', async () => {
    const clientes: ClienteAuthRepository = { buscarPorCpf: jest.fn() };
    const useCase = new AutenticarClientePorCpf(clientes, tokens);

    await expect(useCase.executar({ cpf: '11111111111' })).rejects.toBeInstanceOf(
      ClienteNaoAutorizadoError,
    );
    expect(clientes.buscarPorCpf).not.toHaveBeenCalled();
  });

  it.each([
    ['inexistente', null],
    ['inativo', { id: 'cliente-2', ativo: false }],
  ])('retorna a mesma falha para cliente %s', async (_cenario, cliente) => {
    const clientes: ClienteAuthRepository = {
      buscarPorCpf: jest.fn().mockResolvedValue(cliente),
    };
    const useCase = new AutenticarClientePorCpf(clientes, tokens);

    await expect(useCase.executar({ cpf: '52998224725' })).rejects.toEqual(
      new ClienteNaoAutorizadoError(),
    );
  });
});
