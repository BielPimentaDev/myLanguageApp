# apps/api — regras de arquitetura

Backend Fastify organizado como **monolito modular**, com **Clean Architecture / Hexagonal** dentro de cada módulo.

## Estrutura por módulo

Cada funcionalidade de negócio vive em `src/modules/<nome-do-modulo>/`, com três camadas:

```
src/modules/<modulo>/
  domain/          entidades, value objects, erros de domínio, interfaces de repositório (ports)
  application/      use cases (um caso de uso = uma responsabilidade)
  infrastructure/   adapters: rotas/controllers Fastify, implementações de repositório, clients externos
  index.ts          único ponto de entrada público do módulo
```

**Regra de dependência (hexagonal):** `infrastructure` → `application` → `domain`, nunca o inverso.
`domain` não importa nada de `application` ou `infrastructure`. `application` não importa Fastify, driver de banco, nem nenhum SDK externo — só os ports definidos em `domain`.

**Limite entre módulos:** um módulo só pode importar de outro através do `index.ts` dele. Nunca faça import direto de `modules/outro-modulo/domain/...` ou qualquer caminho interno.

## SOLID aplicado aqui

- **SRP** — cada use case faz uma única coisa. Se um use case precisa de um "e também", é sinal de que deveria ser dois use cases.
- **OCP** — novas variações (ex: um novo provedor de pagamento, um novo tipo de notificação) entram como um novo adapter/implementação de port existente, sem alterar `domain`/`application`.
- **LSP** — qualquer implementação de um port (ex: `UserRepository`) tem que ser substituível por outra sem quebrar o use case que a usa.
- **ISP** — ports pequenos e específicos (`UserRepository.findById`, não um `UserRepository` genérico com 20 métodos que a maioria dos adapters não implementa de fato).
- **DIP** — `domain` e `application` dependem só de interfaces (ports); `infrastructure` é quem implementa e é injetada (injeção via construtor, sem instanciar infra dentro de domain/application).

## OOP

Entidades em `domain` são classes com comportamento, não apenas bags de dados (evite "anemic domain model" — regra de negócio que pertence à entidade fica na entidade, não espalhada em use cases).

## TDD — quando é obrigatório

- **Obrigatório**: tudo em `domain/` (entidades, value objects) e `application/` (use cases). Escreva o teste antes da implementação.
- **Não obrigatório** (pode testar depois, via teste de integração): controllers/rotas Fastify e implementações de repositório em `infrastructure/` — são adapters finos, o valor do teste ali é de integração, não de unidade feita antes do código.
