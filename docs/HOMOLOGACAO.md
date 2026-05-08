# Checklist de Homologação — CotaCerta MVP

> Documento para validação manual com o usuário antes de entrar em produção real.

## Ambiente

- **Web:** https://cotacerta.gardenwjs.tech
- **API:** https://api.cotacerta.gardenwjs.tech
- **Gestor padrão:** `admin@cotacerta.com` / `admin123456`

---

## 1. Login e autenticação

- [ ] Gestor consegue logar com email e senha
- [ ] Gestor é redirecionado para `/dashboard` após login
- [ ] Cotista consegue logar com email e senha provisória
- [ ] Cotista é redirecionado para `/meu-painel` após login
- [ ] Logout limpa a sessão e volta para o login
- [ ] Token inválido ou expirado redireciona para o login

---

## 2. Caixinhas

- [ ] Criar uma caixinha com nome, ano, valor de cota e dia de vencimento
- [ ] Listar as caixinhas criadas
- [ ] Editar dados de uma caixinha
- [ ] Arquivar uma caixinha

---

## 3. Cotistas

- [ ] Cadastrar um cotista vinculado a uma caixinha
- [ ] Listar cotistas de uma caixinha
- [ ] Editar dados de um cotista (nome, telefone, chave Pix)
- [ ] Alterar número de cotas de um cotista

---

## 4. Acesso do cotista

- [ ] Criar acesso para um cotista (email + senha provisória gerada)
- [ ] Senha provisória exibida uma única vez na tela
- [ ] Cotista consegue logar com a senha provisória
- [ ] Gestor consegue bloquear o acesso do cotista
- [ ] Gestor consegue reativar o acesso do cotista
- [ ] Cotista bloqueado não consegue logar

---

## 5. Cobranças

- [ ] Gerar cobranças mensais para todos os cotistas ativos
- [ ] Visualizar lista de cobranças com status correto
- [ ] Cobrança gerada em duplicata é ignorada (sem erro)
- [ ] Cancelar uma cobrança sem pagamentos
- [ ] Cobrança com atraso muda para status OVERDUE

---

## 6. Pagamentos

- [ ] Registrar pagamento de cobrança com valor e data
- [ ] Pagamento parcial muda status para PARTIAL
- [ ] Pagamento total muda status para PAID
- [ ] Anexar comprovante (imagem JPG, PNG ou PDF)
- [ ] Comprovante salvo e vinculado ao pagamento
- [ ] Cobrança cancelada não aceita novo pagamento

---

## 7. Empréstimos

- [ ] Registrar empréstimo para cotista ativo com valor e taxa de juros
- [ ] Total devido calculado automaticamente (principal + juros)
- [ ] Registrar pagamento parcial de empréstimo
- [ ] Pagamento parcial muda status para PARTIAL
- [ ] Pagamento total muda status para PAID
- [ ] Cancelar empréstimo aberto
- [ ] Empréstimo cancelado não aceita pagamento

---

## 8. Quem deve

- [ ] Visualizar cotistas com pendências de cobranças
- [ ] Visualizar cotistas com pendências de empréstimos
- [ ] Total de dívida por cotista calculado corretamente
- [ ] Gerar mensagem de cobrança por WhatsApp
- [ ] Mensagem inclui nome do cotista e valor pendente

---

## 9. Fechamento anual

- [ ] Simular fechamento de uma caixinha
- [ ] Resultado mostra totalArrecadado, totalEmprestado, valorPorCota
- [ ] Tabela com resultado individual de cada cotista (bruto, dívida, líquido)
- [ ] Salvar simulação
- [ ] Confirmar fechamento
- [ ] Segundo fechamento confirmado do mesmo ano é bloqueado
- [ ] Fechamento cancelado não pode ser confirmado

---

## 10. Painel do cotista

- [ ] Cotista vê apenas seus próprios dados (nome, caixinha, cotas)
- [ ] Cotista vê suas cobranças com status e valor corretos
- [ ] Cotista vê seus empréstimos
- [ ] Cotista vê total de pendências
- [ ] Cotista não consegue acessar dashboard do gestor
- [ ] Gestor não consegue acessar painel do cotista

## 10.1 Pix copia e cola + QR Code

- [ ] Gestor habilita Pix para cotas na edição da caixinha
- [ ] Gestor habilita Pix para empréstimos na edição da caixinha
- [ ] Gestor informa chave Pix, nome do recebedor e cidade
- [ ] Cotista abre uma cobrança pendente e clica em `Pagar cota`
- [ ] Sistema gera QR Code Pix sem integração bancária
- [ ] Sistema mostra código Pix copia e cola
- [ ] Botão `Copiar código Pix` funciona
- [ ] Cotista anexa comprovante e envia para conferência
- [ ] Solicitação continua aguardando confirmação do gestor
- [ ] Cobrança não muda para paga automaticamente
- [ ] Fluxo equivalente funciona para empréstimo

Observação obrigatória:
- QR Code Pix e copia e cola não representam integração bancária.
- A baixa definitiva ainda depende da confirmação do gestor.

## 10.2 Leitura inteligente do comprovante Pix

- [ ] Cotista envia comprovante Pix em PDF com texto extraível
- [ ] Sistema tenta leitura local do PDF
- [ ] Gestor vê status da análise (`Compatível`, `Precisa revisão` ou `Divergência`)
- [ ] Gestor vê valor esperado e valor encontrado
- [ ] Gestor vê recebedor esperado e recebedor encontrado
- [ ] Gestor vê chave Pix esperada e chave Pix encontrada
- [ ] Gestor vê data encontrada e divergências
- [ ] Gestor consegue reprocessar a análise
- [ ] `AUTO_MATCHED` não confirma a baixa sozinho
- [ ] `MISMATCH` não impede revisão manual do gestor
- [ ] Imagem sem OCR local confiável fica em conferência manual
- [ ] Cobrança ou empréstimo só muda para pago depois de `Confirmar baixa`

Observação obrigatória:
- A leitura do comprovante é auxiliar.
- Não há integração bancária.
- Não há baixa automática definitiva.

## 10.3 Unicidade de comprovante por hash

- [ ] Enviar um comprovante novo e verificar sucesso
- [ ] Verificar no banco que o comprovante novo recebeu `receipt_hash`
- [ ] Reenviar o mesmo comprovante em outra `PaymentRequest`
- [ ] Esperado: `409 Conflict`
- [ ] Tentar reutilizar o mesmo comprovante na baixa manual do gestor
- [ ] Esperado: `409 Conflict`
- [ ] Validar que registros antigos sem hash continuam protegidos por fallback de `dataUrl`

Observação obrigatória:
- comprovantes novos recebem hash SHA-256;
- o bloqueio vale no sistema inteiro;
- a proteção é forte para o mesmo arquivo binário, mas reexportações podem exigir fingerprint visual ou OCR no futuro.

---

## 11. Isolamento de dados

- [ ] Gestor A não vê caixinhas do Gestor B
- [ ] Gestor A não vê cotistas do Gestor B
- [ ] Gestor A não vê cobranças do Gestor B
- [ ] Gestor A não vê empréstimos do Gestor B
- [ ] Rota sem token retorna 401
- [ ] Rota com token inválido retorna 401
- [ ] COTISTA em rota de gestor retorna 403

---

## Resultado esperado

Todos os itens marcados = sistema pronto para uso real.
