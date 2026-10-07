# ADR-0003 — Sem autenticação/multiusuário no MVP

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

O objetivo do MVP é validar o ciclo de produto (conversa → análise → flashcard → aprendizado → prática), não a infraestrutura de contas de usuário. O único usuário do MVP é o próprio autor do produto, testando localmente.

## Decisão

O MVP **não implementa** cadastro, login, sessão ou qualquer mecanismo de autenticação. Todo dado persistido (conversas, achados, flashcards) pertence implicitamente a um único usuário de teste; não há coluna/entidade `user_id` vinculada a uma conta real.

## Consequências

- Elimina um módulo inteiro (auth) do caminho crítico das primeiras 5 entregas.
- Quando multiusuário for necessário, será preciso: (a) introduzir um módulo de autenticação, e (b) migrar o schema para associar cada registro a um usuário — isso é trabalho futuro esperado, não uma surpresa.
- Não há isolamento de dados nem segurança de acesso no MVP — aceitável porque o ambiente é local/single-tenant por decisão de produto, não por omissão.
