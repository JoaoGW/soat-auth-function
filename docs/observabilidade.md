# Observabilidade da Function

A Function publica traces, métricas e logs estruturados diretamente para o New Relic por OTLP/HTTP. A inicialização acontece antes do registro dos handlers HTTP. A exportação local é desabilitada por padrão com `OBSERVABILITY_ENABLED=false`.

## Segurança e contrato de logs

Os logs JSON incluem `environment`, `service`, `version`, `route`, `status`, `duration`, `correlationId`, `traceId` e `spanId`. Nunca incluem corpo, query string, CPF, token, senha, cookie ou header de autenticação. Consultas PostgreSQL são substituídas por `[redacted]` antes da exportação.

O handler reutiliza ou cria `X-Correlation-ID` e devolve o mesmo valor na resposta. O endpoint público `GET /health` retorna somente estado, serviço e versão.

## Métricas

- `soat.http.requisicoes`, `soat.http.erros` e `soat.http.duracao`;
- `soat.auth.tentativas`, segmentada pelo resultado `sucesso`, `negada` ou `erro`;
- `soat.integracoes.erros`, para falhas de PostgreSQL.

## Configuração

| Variável | Uso |
| --- | --- |
| `OBSERVABILITY_ENABLED` | Só habilita exportação quando for `true`. |
| `NEW_RELIC_LICENSE_KEY` | Fornecida pelo Key Vault; não pode ser versionada. |
| `OTEL_SERVICE_NAME` | Padrão: `soat-auth-function`. |
| `OTEL_SERVICE_VERSION` | SHA que identifica o deploy. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Padrão: `https://otlp.nr-data.net:4318`. |

Após a foundation Azure existir, armazene a chave apenas como `new-relic-license-key` no Key Vault e habilite a configuração de ambiente criada pelo Terraform. Sem foundation e Key Vault, não há deploy nem exportação remota.
