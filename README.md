# soat-auth-function

Azure Function TypeScript que emite JWT de cliente após autenticação por CPF.
Ela valida os dois dígitos verificadores antes da consulta ao banco, procura um
cliente ativo e não informa se a falha decorre de CPF inválido, inexistente ou
inativo.

## Stack e validação

- Azure Functions v4, Node.js 20, TypeScript e PostgreSQL;
- JWT HS256 com `sub`, `cpf`, `role=cliente`, issuer, audience e expiração de
  15 minutos;
- Jest, ESLint e Terraform 1.9.8;
- `npm ci`, `npm run lint`, `npm run build` e `npm run test`.

O endpoint é `POST /auth/cpf`, com corpo `{ "cpf": "529.982.247-25" }`.
O `host.json` remove o prefixo padrão `/api` para que o Kong encaminhe a mesma
rota. O repositório não possui Dockerfile porque a execução é serverless.

## Variáveis e arquitetura

As variáveis `DATABASE_URL` e `JWT_CLIENT_SECRET` são referências ao Key Vault;
`JWT_CLIENT_ISSUER`, `JWT_CLIENT_AUDIENCE` e `JWT_CLIENT_EXPIRES_IN` possuem
valores seguros padrão. Nenhum segredo é versionado. A infraestrutura em
`infra/` cria uma Function Flex Consumption por ambiente, integrada à subnet
privada e com deploy bloqueado enquanto `TF_APPLY_ENABLED` não for `true`.
Consulte o
[diagrama central](https://github.com/JoaoGW/soat-api/blob/main/docs/architecture/README.md#mapa-de-responsabilidades-dos-repositórios).

## CI

O [workflow CI](https://github.com/JoaoGW/soat-auth-function/actions/workflows/ci.yml)
executa instalação, lint, build, testes e validação Terraform. O deploy promove
`development` para hml e `main` para prod somente após OIDC, infraestrutura
foundation aplicada e `TF_APPLY_ENABLED=true` no Environment correspondente.

As decisões de rede, Key Vault e exceções documentadas estão em
[docs/seguranca.md](docs/seguranca.md).
