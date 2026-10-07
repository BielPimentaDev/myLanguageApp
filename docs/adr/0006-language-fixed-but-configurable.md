# ADR-0006 — Idioma fixo (inglês) na UI do MVP, mas modelado como parâmetro

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

O MVP só precisa suportar inglês (idioma-alvo) com explicações em português (idioma nativo). Porém, suporte a múltiplos idiomas é um requisito essencial do produto a médio prazo — não é algo que pode ser ignorado na modelagem do domínio, sob risco de exigir reescrever entidades centrais depois.

## Decisão

Idioma-alvo e idioma nativo são modelados como **parâmetros explícitos** no domínio (ex: value object `LanguagePair` ou campos equivalentes em `Conversation`/`Scenario`), em vez de strings fixas espalhadas pelo código ou prompts hardcoded para "inglês"/"português". A UI do MVP, no entanto, não expõe seleção de idioma — o valor é fixado em um único par (inglês/português) na camada de apresentação/configuração, não no domínio.

## Consequências

- Adicionar seleção de idioma no futuro é uma mudança de UI + configuração, não uma mudança estrutural de domínio.
- Prompts de IA (conversa, análise, conteúdo de aprendizado) recebem o par de idiomas como parâmetro, nunca com o nome do idioma escrito diretamente no template do prompt.
- Overhead pequeno e deliberado no MVP (um parâmetro a mais que, por ora, sempre recebe o mesmo valor) em troca de evitar retrabalho estrutural quando o segundo idioma for adicionado.
