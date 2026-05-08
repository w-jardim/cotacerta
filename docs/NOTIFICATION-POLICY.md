# Política de Notificações e Comunicação

**Versão:** 1.0  
**Data:** 2026-05-08  
**Status:** Aprovado — Fase 14A

---

## 1. Consentimento

### 1.1 Comunicação interna

- Habilitada por padrão para todos os usuários
- Faz parte integral do produto
- Não requer consentimento adicional além dos Termos de Uso

### 1.2 WhatsApp

- Requer opt-in **explícito e individual** do cotista
- O checkbox de consentimento deve exibir texto claro:
  > *"Autorizo o CotaCerta a enviar mensagens via WhatsApp para o número cadastrado sobre movimentações da minha caixinha."*
- O consentimento é registrado com `consentAt` (timestamp) e endereço IP
- O gestor **não pode** ativar WhatsApp em nome do cotista
- Reativação após opt-out exige novo opt-in explícito

### 1.3 SMS

- Mesmas regras do WhatsApp
- Texto de consentimento específico:
  > *"Autorizo o CotaCerta a enviar mensagens SMS para o número cadastrado."*

### 1.4 Email (futuro)

- Consentimento via processo de cadastro com link de confirmação
- Unsubscribe em toda mensagem

---

## 2. Opt-in e Opt-out

### Opt-in

| Canal | Mecanismo | Onde |
|---|---|---|
| Interno | Automático no cadastro | — |
| WhatsApp | Checkbox na tela de preferências | Painel do cotista → Configurações |
| SMS | Checkbox na tela de preferências | Painel do cotista → Configurações |

### Opt-out

| Canal | Mecanismo | Prazo de aplicação |
|---|---|---|
| Interno | Configurável por tipo de alerta | Imediato |
| WhatsApp | Toggle no painel ou responder SAIR | Imediato |
| SMS | Toggle no painel ou responder SAIR | Imediato |

Opt-out deve ser **imediato**. Nenhuma mensagem pode ser enviada após revogação, mesmo que já esteja na fila — exceto confirmação do próprio opt-out.

---

## 3. Horários de envio

### Canais externos (WhatsApp / SMS)

| Período | Regra |
|---|---|
| 08h00 – 20h00 | Envio permitido |
| 20h01 – 07h59 | **Proibido** — mensagem fica em fila até 08h00 |
| Fins de semana | Permitido apenas para confirmações urgentes (comprovante aprovado/rejeitado) |
| Feriados nacionais | Mesmo critério dos fins de semana |

### Canal interno

- Sem restrição de horário (o usuário vê quando acessar o sistema)

---

## 4. Limites de mensagens

### Por cotista por dia

| Canal | Limite diário | Observação |
|---|---|---|
| Interno | Sem limite | Controlado por tipo de evento |
| WhatsApp | 3 mensagens | Exceto confirmações de pagamento |
| SMS | 2 mensagens | Exceto confirmações de pagamento |

### Por broadcast (gestor → grupo)

- Máximo 1 broadcast por caixinha por dia
- Broadcasts de cobrança: máximo 3 por mês por cotista
- Requer confirmação do gestor antes do envio em massa

### Deduplicação

- Mensagens geradas pelo mesmo evento no mesmo dia não são duplicadas
- Verificação via hash do evento: `{tipo}:{entidadeId}:{data}`

---

## 5. Canais permitidos por tipo de mensagem

| Tipo de mensagem | Interno | WhatsApp | SMS |
|---|---|---|---|
| Comprovante recebido (gestor) | ✅ | ✅ (se opt-in gestor) | ❌ |
| Comprovante confirmado (cotista) | ✅ | ✅ | ✅ |
| Comprovante rejeitado (cotista) | ✅ | ✅ | ✅ |
| Cobrança vencendo em 3 dias | ✅ | ✅ | ✅ |
| Cobrança vencida | ✅ | ✅ | ✅ |
| Empréstimo vencendo | ✅ | ✅ | ✅ |
| Mensagem livre do gestor | ✅ | ✅ (com template) | ✅ |
| Broadcast para grupo | ✅ | ✅ (com template aprovado) | ✅ |
| Broadcast para inadimplentes | ✅ | ✅ (com template aprovado) | ✅ |
| Resposta do cotista ao gestor | ✅ | ❌ (dentro de janela) | ❌ |
| Acesso criado / senha provisória | ✅ | ❌ (dado sensível) | ❌ |
| Fechamento anual | ✅ | ✅ | ❌ |

---

## 6. Mensagens sensíveis

As seguintes categorias são **sensíveis** e têm regras especiais:

### 6.1 Dados de acesso
- Senhas provisórias: apenas canal interno
- Links de redefinição de senha: apenas email ou interno
- Nunca via WhatsApp ou SMS (risco de interceptação/screenshot)

### 6.2 Saldo financeiro
- Mensagens externas **não devem** conter saldo total da caixinha
- Podem conter apenas o valor individual do cotista (`R$ X.XX`)
- Dados de PIX (chave, QR) apenas via canal seguro (interno ou link autenticado)

### 6.3 Dados pessoais
- CPF, data de nascimento, dados bancários: nunca em mensagem externa
- Seguir LGPD: minimização de dados nas mensagens

### 6.4 Mensagens de inadimplência
- Tom deve ser respeitoso e não intimidador
- Proibido ameaças ou linguagem de cobrança agressiva
- Templates de cobrança devem ser aprovados pelo gestor antes do primeiro envio

---

## 7. Comunicação financeira

Mensagens sobre valores financeiros seguem regras adicionais:

| Situação | Obrigatório incluir | Proibido incluir |
|---|---|---|
| Cobrança vencendo | valor, data de vencimento | saldo da caixinha |
| Cobrança vencida | valor, dias em atraso | dados de outros cotistas |
| Comprovante confirmado | valor confirmado, período | dados bancários completos |
| Comprovante rejeitado | motivo resumido, próximo passo | informações de outros pagamentos |
| Empréstimo | valor devido, data | taxa de juros detalhada (usar apenas % e valor final) |

Mensagem de cobrança deve sempre oferecer canal de contato com o gestor.

---

## 8. Templates WhatsApp

### Criação e aprovação

1. Templates criados pelo administrador da conta Meta Business
2. Submetidos para aprovação (prazo: 24-48h em média)
3. Categoria: `UTILITY` para mensagens financeiras
4. Variáveis no formato `{{1}}`, `{{2}}`, etc.
5. Não podem conter emojis excessivos, links externos não aprovados ou linguagem promocional

### Ambiente de testes

- Templates testados em conta sandbox antes de produção
- Nunca testar com número de cotista real
- Aprovação em produção antes de qualquer envio real

### Manutenção

- Templates inativos por mais de 6 meses devem ser revisados
- Alteração de template exige nova aprovação
- Versão do template registrada em `MessageTemplate.metadata`

---

## 9. SMS

### Regras operacionais

- Máximo 160 caracteres por mensagem (SMS simples)
- Mensagens mais longas = múltiplos SMS = custo adicional
- Incluir sempre o nome da empresa: `[CotaCerta]`
- Incluir instrução de opt-out: `Resp SAIR p/ cancelar`

### Aprovação de remetente

- Número remetente (shortcode ou longcode) cadastrado no provedor
- Para shortcodes: registro junto à operadora (prazo: semanas)
- Para longcodes: ativação mais rápida, mas menor entregabilidade

---

## 10. Falhas de entrega

### Definição de falha

| Cenário | Classificação |
|---|---|
| Número inválido ou inexistente | Falha permanente |
| WhatsApp não instalado | Falha temporária → tentar SMS |
| Conta bloqueada pelo usuário | Falha permanente |
| Timeout do provedor | Falha temporária → retry |
| Rate limit do provedor | Falha temporária → retry com backoff |
| Template não aprovado | Falha permanente até aprovação |

### Política de retry

- Máximo 3 tentativas
- Intervalos: 5 min → 30 min → 2h
- Após 3 falhas: status = `FAILED`, gestor é notificado internamente
- Gestor pode reenviar manualmente a partir da Central

### Fallback de canal

Se WhatsApp falhar permanentemente e SMS estiver habilitado:
1. Sistema gera DeliveryJob para SMS automaticamente
2. Registra a tentativa de fallback no log

---

## 11. Privacidade (LGPD)

### Dados tratados

| Dado | Finalidade | Base legal |
|---|---|---|
| Nome do cotista | Personalização de mensagens | Execução de contrato |
| Número de telefone | Entrega de mensagens | Consentimento |
| Valores financeiros | Informação de cobrança | Execução de contrato |
| Histórico de mensagens | Auditoria e suporte | Interesse legítimo |

### Retenção

| Tipo | Prazo |
|---|---|
| Mensagens internas | 36 meses |
| Logs de entrega externa | 24 meses |
| Registros de consentimento | 60 meses (após revogação) |
| Dados sensíveis em mensagens | Não armazenar em texto claro |

### Direitos do titular

- O cotista pode solicitar exportação do histórico de mensagens
- O cotista pode solicitar exclusão (direito ao esquecimento), desde que não haja obrigação legal de retenção
- Solicitações processadas em até 15 dias

---

## 12. Auditoria

Todo envio registra:

```
sender       → quem enviou (userId ou "SYSTEM")
recipient    → quem recebeu (userId)
channel      → canal usado
status       → estado atual da entrega
body         → conteúdo da mensagem (armazenado com criptografia se sensível)
template     → template utilizado (se aplicável)
provider     → provedor externo usado
providerMsgId → ID da mensagem no provedor (para rastreabilidade)
sentAt        → quando foi enviado
deliveredAt   → quando foi entregue (se disponível)
readAt        → quando foi lido (se disponível)
errorDetails  → descrição do erro em caso de falha
```

Logs de auditoria são imutáveis. Mensagens podem ser ocultadas da UI, mas não deletadas do banco dentro do período de retenção.
