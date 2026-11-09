import jwt, { SignOptions } from "jsonwebtoken";

import {
  ClienteTokenPayload,
  TokenService,
} from "../../application/ports/TokenService";
import { AuthConfig } from "../config/AuthConfig";

export class JwtClienteTokenService implements TokenService {
  constructor(private readonly config: AuthConfig) {}

  assinar(payload: ClienteTokenPayload): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      algorithm: "HS256",
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
      expiresIn: this.config.jwtExpiresIn as SignOptions["expiresIn"],
    });
  }
}
