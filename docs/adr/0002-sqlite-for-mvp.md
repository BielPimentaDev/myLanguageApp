# ADR-0002 — SQLite como persistência do MVP

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

O MVP roda para um único usuário de teste, sem concorrência, sem necessidade de alta disponibilidade. Subir Postgres (Docker Compose, migrations, infra de conexão) antes de ter qualquer funcionalidade testável adiaria a primeira entrega sem benefício correspondente.

## Decisão

Usar **SQLite** (arquivo local) como banco de dados do MVP, acessado através dos repositórios (ports) definidos em cada módulo, conforme a regra hexagonal já estabelecida em `apps/api/CLAUDE.md`.

## Consequências

- Zero infraestrutura extra para rodar o projeto localmente.
- Troca futura para Postgres (ex: ao introduzir multiusuário real) é isolada: novo adapter de repositório implementando o mesmo port, sem alterar `domain`/`application`.
- Limitações de concorrência/escalabilidade do SQLite são aceitáveis e conhecidas — não é uma escolha para produção multiusuário, é uma escolha deliberada de velocidade de entrega do MVP.
