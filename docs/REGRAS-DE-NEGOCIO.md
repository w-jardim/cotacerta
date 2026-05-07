# Regras de Negócio — CotaCerta

## Caixinha

1. Toda caixinha tem um Gestor Master.
2. O Gestor Master pode administrar tudo sozinho.
3. Subgestores são opcionais e futuros.
4. Cada caixinha é independente.
5. Nenhum dado financeiro pode misturar caixinhas.

## Cotistas

1. Cotista pode participar de uma ou mais caixinhas.
2. Em cada caixinha, o cotista pode ter no máximo 2 cotas.
3. Cotista pode ter painel próprio.
4. Cotista só visualiza sua própria situação.
5. Cotista não altera valores financeiros.

## Cotas

1. A cobrança da cota é mensal.
2. Quem tem 2 cotas paga o dobro de quem tem 1.
3. A quantidade de cotas impacta o rateio final.
4. Após o vencimento, a cobrança mensal deve receber acréscimo conforme a taxa definida na caixinha.
5. O valor atualizado por atraso deve ficar visível para o gestor.

## Pagamentos Pix

1. O meio principal de pagamento é Pix.
2. Cada pagamento pertence a uma caixinha.
3. Cada pagamento pertence a um cotista.
4. Cada pagamento pode ter comprovante.
5. Pagamento não deve ser excluído; deve ser estornado/cancelado com histórico.

## Empréstimos

1. Empréstimo só pode ser feito para cotista ativo.
2. Juros padrão inicial: 30%.
3. O sistema deve calcular o total a devolver com base em percentual sobre o valor tomado.
4. Pagamentos parciais devem ser permitidos.
5. Empréstimo não se mistura com cobrança mensal nem com pagamento de mensalidade.
6. Pagamento de empréstimo precisa ter histórico próprio.
7. Dívidas de empréstimo entram no fechamento.
8. O vencimento padrão do empréstimo vai até o término do ciclo da caixinha ou até a quitação total.
9. O gestor pode optar por receber o valor total ou somente os juros pendentes.

## Fechamento anual

1. O valor final é dividido por cota.
2. Dívidas devem ser descontadas antes da divisão.
3. Fechamento deve gerar histórico.
4. Fechamento não deve apagar dados anteriores.

## Painel do cotista

Cotista pode:

- ver cotas;
- ver pagamentos;
- ver pendências;
- ver empréstimos próprios;
- editar dados pessoais permitidos.

Cotista não pode:

- alterar cotas;
- alterar pagamentos;
- alterar empréstimos;
- alterar saldo;
- alterar fechamento.
