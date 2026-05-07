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
