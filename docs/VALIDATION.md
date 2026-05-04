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

✅ Status: Validada

## Fase 1

Validações:

- frontend sobe;
- backend sobe;
- banco conecta;
- healthcheck responde;
- Docker Compose funcional.

✅ Status: Validada

## Fase 1.5

Validações:

- containers buildados com sucesso;
- API responde em http://127.0.0.1:3401/health;
- Web responde em http://127.0.0.1:3411;
- portas corretas configuradas (3341, 3401, 3411);
- bind apenas em 127.0.0.1 (não exposto publicamente);
- healthchecks configurados;
- restart unless-stopped configurado;
- configurações Nginx preparadas para host;
- instruções de SSL/Certbot documentadas.

✅ Status: Validada

Comandos de validação:
```bash
docker compose ps
curl -s http://127.0.0.1:3401/health
curl -I http://127.0.0.1:3411
```

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
