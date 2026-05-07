# Roadmap — CotaCerta

## Fase 0 — Documentação

- README
- SPEC
- MVP
- regras de negócio
- fluxos
- validação

✅ Status: Concluída

## Fase 1 — Setup técnico

- frontend
- backend
- banco
- Docker
- healthcheck

✅ Status: Concluída

## Fase 1.5 — Containerização e Deploy

- Dockerfile para API
- Dockerfile para Web com Nginx
- docker-compose.yml completo
- Configuração Nginx host
- SSL com Certbot
- Acesso por domínio

✅ Status: Concluída

## Fase 2 — Autenticação

- cadastro
- login
- JWT
- roles

## Fase 3 — Caixinhas

- criar
- listar
- editar
- pausar

## Fase 4 — Cotistas

- cadastrar
- vincular à caixinha
- definir cotas
- bloquear/desativar

## Fase 5 — Cobranças

- gerar cobrança mensal
- listar cobranças
- status

## Fase 6 — Pix e comprovantes

- registrar pagamento
- anexar comprovante
- atualizar status

✅ Status: Concluída

## Fase 7 — Empréstimos

- criar empréstimo
- juros
- pagamentos
- saldo devedor

✅ Status: Concluída

## Fase 8 — Quem deve

- dashboard
- pendências
- WhatsApp

✅ Status: Concluída

## Fase 9 — Painel do cotista

- gestor cria acesso do cotista manualmente;
- senha provisória gerada pelo backend (nunca salva em texto puro);
- cotista loga com email e senha provisória (role COTISTA);
- cotista acessa /meu-painel com seus próprios dados;
- cotista visualiza caixinhas, cobranças, pagamentos, empréstimos e pendências;
- cotista não acessa rotas de gestor (403 Forbidden);
- gestor bloqueia e reativa acesso do cotista;
- email/SMS/convite por token fora do escopo desta fase.

✅ Status: Concluída

## Fase 10 — Fechamento anual

- simulação
- rateio
- relatório

✅ Status: Concluída

## Fase 11 — Auditoria e qualidade do MVP

- auditoria de segurança e rotas
- isolamento por gestor/cotista validado
- cálculos financeiros revisados
- UX: links mortos removidos, redirect por role
- docs/HOMOLOGACAO.md criado
- build, deploy e testes validados

✅ Status: Concluída
