# ADR-0007 — Catálogo de cenários fixo com um único cenário (Cafeteria) no MVP

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

Cenários de conversa poderiam ser (a) uma lista pré-definida pelo autor do produto, ou (b) descritos livremente pelo usuário e transformados em prompt por IA. Cenário livre depende inteiramente da IA interpretar bem um input aberto, o que é difícil de controlar e testar de forma determinística num MVP.

## Decisão

O MVP implementa um **catálogo fixo de cenários**, com exatamente **um cenário no catálogo: "Cafeteria"**. O cenário é definido como dado/configuração conhecida (prompt-base, objetivo da interação), não como entrada livre do usuário.

## Consequências

- Comportamento da IA no cenário é previsível o suficiente para validar manualmente durante os testes do MVP.
- Adicionar novos cenários ao catálogo depois é um dado novo (prompt-base + metadados), não uma mudança de arquitetura — o catálogo já é modelado como uma coleção, mesmo contendo um único item hoje.
- Cenário livre/gerado por IA, se vier a ser necessário, é um incremento futuro e teria seu próprio risco de qualidade a ser avaliado separadamente.
