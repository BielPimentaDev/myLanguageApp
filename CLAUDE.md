# myLanguageApp

Monorepo com dois workspaces:

- `apps/api` — backend Node.js, **Fastify**, organizado como **monolito modular**. Ver `apps/api/CLAUDE.md`.
- `apps/web` — frontend **Next.js**. Ver `apps/web/CLAUDE.md`.

Cada workspace tem seu próprio `CLAUDE.md` com as regras de arquitetura específicas daquela camada — as regras **não são as mesmas** nos dois lados, então sempre consulte o `CLAUDE.md` da pasta em que está trabalhando antes de escrever código.

## Convenções compartilhadas

- **Linguagem**: TypeScript em todo o repositório (backend e frontend). Sem `any` implícito; prefira tipos explícitos nas fronteiras públicas (parâmetros de função exportada, retorno de use case/service, props de componente).
- **TDD**: quando uma regra de arquitetura abaixo marcar um trecho de código como "TDD obrigatório", escreva o teste antes da implementação (red-green-refactor). Use a skill `tdd` para esse workflow.
- **Limites de módulo/camada**: nunca importe direto de dentro da pasta interna de outro módulo ou camada — só através do ponto de entrada público dele (ver detalhes em cada `CLAUDE.md` de workspace).
- **Localização dos testes**: todo arquivo de teste (`*.test.ts`/`*.test.tsx`) vive em uma pasta `tests/` na raiz do workspace (`apps/api/tests/`, `apps/web/tests/`), espelhando o caminho do arquivo que ele testa dentro de `src/` (api) ou `app/` (web) — nunca ao lado do arquivo de produção. Ex: `apps/api/src/modules/conversation/domain/entities/conversation.ts` → teste em `apps/api/tests/modules/conversation/domain/entities/conversation.test.ts`. Helpers de teste (fakes, builders) que não são `describe/it` também vivem em `tests/`, na mesma pasta do teste que os usa.
