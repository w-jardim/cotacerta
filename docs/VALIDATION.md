# Validation — CotaCerta

## Regra geral

Não avançar de fase sem validação.

## Checklist geral

- documentação atualizada;
- regras de negócio respeitadas;
- isolamento por caixinha mantido;
- sem exclusão indevida de movimentações financeiras;
- sem subgestor obrigatório;
- sem OCR/IA obrigatório no MVP.

## Fase 0

- documentos criados;
- MVP claro;
- escopo enxuto;
- regras principais registradas.

## Fase 1

Validações futuras:

- frontend sobe;
- backend sobe;
- banco conecta;
- healthcheck responde;
- Docker Compose funcional.

## Fase 2

Validações futuras:

- cadastro funciona;
- login funciona;
- JWT protege rotas;
- senha não é exposta.

## Fase 3+

Cada fase deve ter:

- teste manual;
- teste automatizado quando aplicável;
- revisão de regra de negócio;
- registro de riscos.
