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

Os endpoints são `POST /auth/cpf` e `GET /health`. O primeiro recebe
`{ "cpf": "529.982.247-25" }`; o segundo responde somente estado, serviço e
versão. O `host.json` remove o prefixo padrão `/api` para que o Kong encaminhe
a mesma rota. O repositório não possui Dockerfile porque a execução é
serverless.

## Variáveis e arquitetura

As variáveis `DATABASE_URL`, `JWT_CLIENT_SECRET` e `NEW_RELIC_LICENSE_KEY` são
referências ao Key Vault; `JWT_CLIENT_ISSUER`, `JWT_CLIENT_AUDIENCE` e
`JWT_CLIENT_EXPIRES_IN` possuem valores seguros padrão. Nenhum segredo é
versionado. A Function HML está implantada em Flex Consumption, integrada à
rede privada e acessível pelo Kong na rota `/auth/cpf`; seu health check é
`https://func-soat-auth-hml-joaogw260909.azurewebsites.net/health`.
Consulte o
[diagrama central](https://github.com/JoaoGW/soat-api/blob/main/docs/architecture/README.md#mapa-de-responsabilidades-dos-repositórios).
O Swagger e a coleção Postman pertencem à API central:
[Swagger HML](http://20.226.244.207/docs) e
[coleção Postman](https://github.com/JoaoGW/soat-api/blob/main/docs/postman/oficina-api.postman_collection.json).

## CI

O [workflow CI](https://github.com/JoaoGW/soat-auth-function/actions/workflows/ci.yml)
executa instalação, lint, build, testes e validação Terraform. O deploy promove
`development` para hml e `main` para prod somente após OIDC, infraestrutura
foundation aplicada e `TF_APPLY_ENABLED=true` no Environment correspondente.
A trava HML foi restaurada para `false` após o deploy validado; produção segue
sem exposição pública.

As decisões de rede, Key Vault e exceções documentadas estão em
[docs/seguranca.md](docs/seguranca.md).
