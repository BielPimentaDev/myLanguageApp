# PRD — myLanguageApp MVP

**Status:** Draft — aprovado para desenvolvimento
**Data:** 2026-10-06
**Autor:** Gabriel Pimenta

## Contexto / Problema

Aprender um idioma de forma passiva (cursos, apps de flashcard genéricos) não expõe o aprendiz a erros reais de uso em contexto. A forma mais eficaz de aprender é praticar uma conversa real, errar, entender o erro, e treinar especificamente aquilo que errou — fechando o ciclo entre "prática" e "estudo dirigido".

## Objetivo

Validar, com o menor esforço de implementação possível, se o ciclo abaixo gera valor de aprendizado real para um único usuário de teste (o próprio autor do produto):

> Conversar em um cenário → identificar o que foi dito de forma errada ou sub-ótima → escolher o que treinar → estudar aquele item → praticar usá-lo → receber feedback.

## Usuário-alvo (MVP)

Um único usuário de teste, sem cadastro/login, aprendendo **inglês** (idioma nativo: português). O produto roda localmente/single-tenant — não há conceito de múltiplas contas nesta fase.

## Fluxo de ponta a ponta (MVP)

1. Usuário inicia uma conversa no cenário fixo **"Cafeteria"**.
2. Troca mensagens de texto com a IA, que interpreta o papel do atendente da cafeteria.
3. Usuário clica **"Finalizar conversa"** (ou a conversa atinge o limite de segurança de turnos).
4. O sistema analisa as falas do usuário (usando a conversa inteira como contexto) e mostra uma lista de achados: trecho original → sugestão → explicação.
5. Para cada achado, o usuário decide se quer **treinar** aquela palavra/expressão.
6. Achados marcados viram **flashcards**, visíveis numa lista simples.
7. Ao abrir um flashcard, o usuário vê a **tela de aprendizado**: tradução e exemplos de uso em contexto (gerados uma vez, na criação do card).
8. Nessa mesma tela, o usuário é convidado a **escrever uma frase** usando a palavra/expressão nova.
9. O sistema dá **feedback automático** sobre a frase escrita (acertou o uso ou não, com explicação).

## Features do MVP (por entrega)

| # | Entrega | Entregável observável |
|---|---------|------------------------|
| 1 | Conversa | Ter uma conversa completa em texto com a IA no cenário cafeteria e encerrá-la |
| 2 | Análise | Ver a lista de erros/sugestões depois de encerrar uma conversa real |
| 3 | Flashcard | Marcar um achado para treinar e vê-lo numa lista de flashcards |
| 4 | Conteúdo de aprendizado | Abrir um flashcard e ver tradução + exemplos de uso |
| 5 | Prática da frase | Escrever uma frase com a palavra nova e receber feedback da IA |

Cada entrega é funcional e testável isoladamente antes de avançar para a próxima (ver tech specs individuais).

## Fora de escopo (MVP)

Decisões de escopo registradas (ver ADRs correspondentes):

- **Áudio** (input/output de voz) — fase futura. MVP é 100% texto.
- **Autenticação / multiusuário** — MVP roda com um único usuário de teste, sem login.
- **Múltiplos cenários e seleção de idioma na UI** — MVP fixa 1 cenário (cafeteria) e 1 idioma-alvo (inglês). O domínio já modela idioma como parâmetro para não exigir retrabalho estrutural depois.
- **Repetição espaçada (SRS)** — flashcards ficam numa lista simples, sem agendamento de revisão.
- **Histórico de conversas navegável** — conversas são persistidas (para auditoria/análise), mas não há tela de consulta de conversas antigas.

## Critérios de sucesso

- O ciclo completo (1→9 do fluxo acima) funciona de ponta a ponta sem intervenção manual além da interação do usuário.
- Os achados de análise são relevantes o suficiente (na avaliação subjetiva do usuário de teste) para valer a pena virar flashcard.
- O feedback da frase de prática concorda, na maioria das vezes, com a correção que o próprio usuário esperaria.

## Riscos conhecidos

- Qualidade da análise de erros depende inteiramente do prompt de IA — pode exigir iteração de prompt após os primeiros testes reais (não é um risco de arquitetura, é um risco de produto a ser ajustado entrega a entrega).
- Custo de API: cada ciclo completo gera no mínimo 4 chamadas de IA (turnos de diálogo, análise, conteúdo de aprendizado, feedback de prática). Aceitável para uso de um único usuário de teste; a ser revisto se o produto crescer.

## Documentos relacionados

- Tech Specs: `docs/tech-specs/01-conversation.md` a `05-sentence-practice.md`
- ADRs: `docs/adr/`
