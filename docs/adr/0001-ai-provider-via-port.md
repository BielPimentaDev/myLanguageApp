# ADR-0001 — Provedor de IA acessado via port, sem acoplamento de domínio

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

O MVP depende de IA generativa em quatro pontos: resposta de diálogo (conversa), análise de erros pós-diálogo, geração de conteúdo de aprendizado (tradução/exemplos) e feedback de frase de prática. O provedor escolhido para o MVP é a **Anthropic (Claude)**, mas a arquitetura do backend segue Clean/Hexagonal (`apps/api/CLAUDE.md`): `domain` e `application` não podem depender de SDKs externos.

## Decisão

Cada caso de uso que precisa de IA depende de uma **interface (port)** definida no `domain` do módulo correspondente (ex: `ConversationAIPort`, `AnalysisAIPort`), nunca do SDK da Anthropic diretamente. A implementação concreta (adapter) usando o SDK da Anthropic vive na camada `infrastructure`, e é injetada via construtor nos use cases.

Não existe um módulo de negócio "IA" — o cliente Anthropic é uma capacidade técnica transversal (como um client de banco), análoga a uma infraestrutura compartilhada, não a um módulo de domínio com regras de negócio próprias.

## Consequências

- Trocar de provedor de IA (ex: para OpenAI) no futuro é uma troca de adapter, sem tocar `domain`/`application` de nenhum módulo.
- Testes de `domain`/`application` usam um fake/stub do port, sem chamar a API real (alinhado ao TDD obrigatório dessas camadas).
- Cada módulo (conversation, analysis, learning-content, practice) define seu próprio port com a assinatura mínima que precisa (ISP), mesmo que todos sejam implementados pelo mesmo adapter Anthropic por baixo.
