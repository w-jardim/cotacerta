# SPEC — CotaCerta

## Visão do produto

O CotaCerta é um sistema para gestão de caixinhas coletivas de cotistas, com foco em controle de pagamentos Pix, comprovantes, inadimplência, empréstimos e fechamento anual.

## Perfis

### Gestor Master

Administra suas próprias caixinhas.

Pode:

- criar caixinhas;
- cadastrar cotistas;
- definir cotas;
- gerar cobranças;
- registrar pagamentos;
- anexar comprovantes;
- registrar empréstimos;
- visualizar quem deve;
- fazer fechamento anual.

### Cotista

Participa de uma ou mais caixinhas.

Pode:

- visualizar suas cotas;
- visualizar seus pagamentos;
- visualizar suas pendências;
- visualizar seus empréstimos;
- editar dados pessoais permitidos.

Não pode:

- alterar valores;
- confirmar pagamentos;
- criar empréstimos;
- editar regras da caixinha;
- alterar fechamento.

### Subgestor

Recurso opcional e futuro.

O sistema deve funcionar sem subgestores.

## Dor principal

O gestor precisa saber rapidamente quem está devendo e reduzir o trabalho manual de conferir comprovantes Pix.

## Requisitos funcionais

- criar caixinhas;
- cadastrar cotistas;
- limitar cotista a no máximo 2 cotas por caixinha;
- gerar cobrança mensal;
- registrar pagamento Pix;
- anexar comprovante;
- listar quem pagou;
- listar quem deve;
- gerar mensagem de cobrança por WhatsApp;
- registrar empréstimo para cotista;
- aplicar juros padrão de 30%;
- controlar pagamento de empréstimos;
- calcular fechamento anual por cota;
- permitir painel simples do cotista.

## Requisitos não funcionais

- isolamento entre caixinhas;
- autenticação segura;
- autorização por perfil;
- histórico de ações importantes;
- nenhuma movimentação financeira deve ser excluída sem histórico;
- interface simples e direta.

## Fora do MVP

- integração bancária real;
- OCR/IA obrigatório;
- WhatsApp API oficial;
- subgestores obrigatórios;
- aplicativo mobile nativo.
