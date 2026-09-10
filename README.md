# soat-auth-function

Scaffold TypeScript da Azure Function que emitirá JWT de cliente após
autenticação por CPF na Fase 4. Nenhuma rota HTTP, consulta a banco ou regra de
autenticação foi implementada nesta fase.

## Stack e validação

- Azure Functions v4, Node.js 20 e TypeScript;
- Jest e ESLint;
- `npm ci`, `npm run lint`, `npm run build` e `npm run test`.

O `host.json` prepara o runtime Azure Functions. As futuras variáveis de banco,
JWT e observabilidade serão documentadas quando a implementação funcional
existir. O repositório não possui Dockerfile porque a execução será serverless.

## Variáveis e arquitetura

Não há variáveis de ambiente nesta fase: a Function ainda não possui rota nem
integrações externas. As futuras variáveis serão fornecidas pelo ambiente de
deploy, nunca versionadas. Consulte o
[diagrama central](https://github.com/JoaoGW/soat-api/blob/main/docs/architecture/README.md#mapa-de-responsabilidades-dos-repositórios).

## CI

O [workflow CI](https://github.com/JoaoGW/soat-auth-function/actions/workflows/ci.yml)
executa instalação, lint, build e testes em push e pull request para `main` e
`development`.
