# ADR-0005 — Interação somente por texto no MVP; áudio adiado

**Status:** Aceita
**Data:** 2026-10-06

## Contexto

O produto final pretende suportar entrada e saída de áudio (fala). No entanto, Claude (provedor de IA escolhido, ver ADR-0001) não tem speech-to-speech nativo — áudio exigiria integrar STT e TTS como serviços adicionais, com complexidade de latência, tratamento de erro de reconhecimento e UI de gravação. Isso é esforço técnico significativo não relacionado a validar se o ciclo de produto funciona.

## Decisão

O MVP é **100% texto**: usuário digita, IA responde em texto. Toda a cadeia de análise, flashcard, aprendizado e prática de frase opera sobre texto diretamente (sem etapa de transcrição).

## Consequências

- Elimina a necessidade de qualquer pipeline de STT/TTS nas primeiras 5 entregas.
- Quando áudio for introduzido, ele entra como uma camada de adapters de infraestrutura (STT antes da entrada do usuário no caso de uso de conversa, TTS depois da resposta da IA) — não deve exigir mudança nos use cases de `application`, que continuam operando sobre texto.
- Nenhuma ambiguidade de transcrição a tratar no MVP: o texto do usuário é exatamente o que ele quis dizer.
