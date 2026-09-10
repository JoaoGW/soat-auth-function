import { HttpRequest } from '@azure/functions';

import {
  AutenticarClientePorCpf,
  ClienteNaoAutorizadoError,
} from '../../../application/AutenticarClientePorCpf';
import { criarAutenticarClienteHttpHandler } from '../AutenticarClienteHttpHandler';

describe('criarAutenticarClienteHttpHandler', () => {
  const request = (body: unknown): HttpRequest =>
    ({ json: jest.fn().mockResolvedValue(body) }) as unknown as HttpRequest;

  it('retorna token para autenticação bem-sucedida', async () => {
    const useCase = {
      executar: jest.fn().mockResolvedValue({ accessToken: 'jwt-do-cliente' }),
    } as unknown as AutenticarClientePorCpf;

    await expect(criarAutenticarClienteHttpHandler(useCase)(request({ cpf: '52998224725' }), {} as never))
      .resolves.toMatchObject({ status: 200, jsonBody: { accessToken: 'jwt-do-cliente' } });
  });

  it.each(['invalido', 'inexistente', 'inativo'])('não distingue CPF %s', async () => {
    const useCase = {
      executar: jest.fn().mockRejectedValue(new ClienteNaoAutorizadoError()),
    } as unknown as AutenticarClientePorCpf;

    await expect(criarAutenticarClienteHttpHandler(useCase)(request({ cpf: '52998224725' }), {} as never))
      .resolves.toMatchObject({ status: 401, jsonBody: { mensagem: 'CPF não autorizado' } });
  });

  it('rejeita corpo JSON inválido', async () => {
    const useCase = {} as AutenticarClientePorCpf;
    const invalidRequest = {
      json: jest.fn().mockRejectedValue(new Error('JSON inválido')),
    } as unknown as HttpRequest;

    await expect(criarAutenticarClienteHttpHandler(useCase)(invalidRequest, {} as never)).resolves.toMatchObject({
      status: 400,
      jsonBody: { mensagem: 'Requisição inválida' },
    });
  });
});
