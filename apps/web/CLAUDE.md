# apps/web — regras de arquitetura

Frontend Next.js. Aqui **não** se aplica Clean Architecture/Hexagonal com camadas completas — é overkill para UI. O que vale é SOLID de forma leve, principalmente SRP e DIP.

## Separação de responsabilidades

```
components/   UI pura — recebe props, renderiza. Sem fetch, sem regra de negócio, sem validação.
hooks/        lógica de estado e orquestração (o que um componente "faz").
services/     chamadas a API/dados e lógica de negócio/validação não-trivial.
```

- **SRP** — um componente não faz fetch de dados nem contém lógica de validação/cálculo. Isso vive em `hooks/` ou `services/`.
- **DIP** — componentes dependem de hooks/services (abstrações do "o que fazer"), nunca de chamadas `fetch`/`axios` inline ou de detalhes de uma API externa específica.

Não é necessário usar classes — componentes e hooks seguem o padrão funcional do React. Classes em `services/` são aceitáveis quando a lógica tem estado interno que se beneficia disso, mas não são exigidas.

## TDD — quando é obrigatório

- **Obrigatório**: lógica em `hooks/` e `services/` que não seja trivial (validação, cálculo, máquina de estado, regra de negócio). Teste antes da implementação.
- **Não obrigatório**: componentes puramente de apresentação (sem lógica) — testes ali podem vir depois (snapshot/E2E), não precisa red-green-refactor.
