# Segurança da Function

A Function usa PostgreSQL privado por integração regional com a subnet dedicada
e busca `DATABASE_URL` e `JWT_CLIENT_SECRET` por referências do Key Vault. Os
segredos não são persistidos em GitHub, código, outputs ou logs.

O storage de runtime permite apenas serviços Azure, bloqueia acesso público a
containers, exige TLS 1.2 e usa dupla criptografia de infraestrutura. O acesso
HTTP da Function permanece público porque o Kong precisa encaminhar a rota
`/auth/cpf`; o rate limit é aplicado no gateway.

## Exceções registradas

- `AVD-AZU-0017`: a rotação de JWT será implantada junto ao papel de aplicação
  na Fase 5; uma expiração fixa antes disso causaria indisponibilidade.
- `AVD-AZU-0057`: logs centralizados serão habilitados com OpenTelemetry/New
  Relic na Fase 6.
- `AVD-AZU-0058` e `AVD-AZU-0060`: LRS e chaves gerenciadas pelo Azure mantêm
  a solução dentro do crédito promocional. Geo-replicação e CMK não pertencem
  ao escopo atual.
