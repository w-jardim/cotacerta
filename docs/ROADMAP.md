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

## Fase 12A — Formas de recebimento e solicitações de pagamento

- configuração por caixinha das formas de recebimento;
- solicitação de pagamento enviada pelo cotista;
- comprovante anexado para análise;
- confirmação final mantida com o gestor.

🟡 Status: Em andamento

## Fase 12B — Pix copia e cola + QR Code

- gestor habilita Pix para cotas e/ou empréstimos;
- backend gera payload Pix BR Code sem API bancária;
- cotista visualiza QR Code e código Pix copia e cola;
- comprovante continua obrigatório para conferência;
- baixa definitiva continua dependendo do gestor.

🟡 Status: Em andamento

## Fase 12C — Leitura inteligente de comprovante Pix

- leitura local de PDF com texto extraível;
- imagens sem OCR local confiável ficam em revisão manual;
- comparação auxiliar de valor, recebedor, chave Pix, data e identificador;
- gestor visualiza divergências e pode reprocessar a análise;
- a confirmação final continua exclusivamente com o gestor;
- não há integração bancária nem baixa automática definitiva.

🟡 Status: Em andamento
