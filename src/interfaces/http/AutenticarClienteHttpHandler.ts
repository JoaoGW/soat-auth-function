import { HttpHandler, HttpRequest, HttpResponseInit } from "@azure/functions";

import {
  AutenticarClientePorCpf,
  ClienteNaoAutorizadoError,
} from "../../application/AutenticarClientePorCpf";

const respostaJson = (status: number, corpo: unknown): HttpResponseInit => ({
  status,
  jsonBody: corpo,
  headers: {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  },
});

const lerCorpo = async (
  request: HttpRequest,
): Promise<{ cpf: unknown } | null> => {
  try {
    const corpo = (await request.json()) as unknown;
    if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
      return null;
    }

    return { cpf: (corpo as { cpf?: unknown }).cpf };
  } catch {
    return null;
  }
};

export const criarAutenticarClienteHttpHandler = (
  useCase: AutenticarClientePorCpf,
): HttpHandler => {
  return async (request) => {
    const corpo = await lerCorpo(request);
    if (!corpo) {
      return respostaJson(400, { mensagem: "Requisição inválida" });
    }

    try {
      const resultado = await useCase.executar(corpo);
      return respostaJson(200, resultado);
    } catch (error) {
      if (error instanceof ClienteNaoAutorizadoError) {
        return respostaJson(401, { mensagem: "CPF não autorizado" });
      }

      return respostaJson(500, { mensagem: "Não foi possível autenticar" });
    }
  };
};
