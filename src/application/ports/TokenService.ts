export interface ClienteTokenPayload {
  sub: string;
  cpf: string;
  role: "cliente";
}

export interface TokenService {
  assinar(payload: ClienteTokenPayload): string;
}
