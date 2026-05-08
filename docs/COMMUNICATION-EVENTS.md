# Mapeamento de Eventos de Comunicação

**Versão:** 1.0  
**Data:** 2026-05-08  
**Status:** Fase 14A — Planejamento

---

## Convenção

```
Origem         → serviço/ação que dispara o evento
Destinatário   → quem recebe a mensagem
Canal inicial  → canal padrão (pode ser expandido por preferência)
Automático     → se o sistema dispara sem intervenção do gestor
Aprovação      → se requer confirmação do gestor antes do envio
Payload mínimo → dados necessários para montar a mensagem
```

---

## Eventos

---

### `payment_request.created`

> Cotista enviou comprovante ou declarou pagamento

| Campo | Valor |
|---|---|
| **Origem** | `MemberPortalService.createPaymentRequest()` |
| **Destinatário** | Gestor (ownerUserId da CashGroup) |
| **Direção** | `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp (se gestor habilitou opt-in) |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `payment_received` |

**Payload mínimo:**
```json
{
  "memberName": "João Silva",
  "cashGroupName": "Amigos 2026",
  "amountDeclared": "150.00",
  "paymentType": "MONTHLY_CHARGE | LOAN",
  "referenceMonth": 5,
  "referenceYear": 2026,
  "paymentRequestId": "clx..."
}
```

**Mensagem interna:**
> `João Silva enviou um comprovante de R$ 150,00 (Cota Mai/2026) aguardando conferência.`

---

### `payment_request.receipt_attached`

> Cotista anexou comprovante a uma solicitação já existente

| Campo | Valor |
|---|---|
| **Origem** | `MemberPortalService` — upload de comprovante |
| **Destinatário** | Gestor |
| **Direção** | `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `receipt_attached` |

**Payload mínimo:**
```json
{
  "memberName": "João Silva",
  "cashGroupName": "Amigos 2026",
  "paymentRequestId": "clx...",
  "receiptMimeType": "image/jpeg"
}
```

---

### `payment_request.confirmed`

> Gestor confirmou o pagamento do cotista

| Campo | Valor |
|---|---|
| **Origem** | `CashGroupsService.confirmPaymentRequest()` |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS (se cotista habilitou opt-in) |
| **Automático** | ✅ Sim (disparado pela ação do gestor) |
| **Aprovação do gestor** | ❌ Não (a própria ação de confirmar é a aprovação) |
| **Template sugerido** | `payment_confirmed` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "amountConfirmed": "150.00",
  "paymentType": "MONTHLY_CHARGE | LOAN",
  "referenceMonth": 5,
  "referenceYear": 2026,
  "confirmedAt": "2026-05-08T14:30:00Z"
}
```

**Mensagem interna:**
> `Seu pagamento de R$ 150,00 (Cota Mai/2026) foi confirmado pelo gestor.`

---

### `payment_request.rejected`

> Gestor rejeitou o comprovante do cotista

| Campo | Valor |
|---|---|
| **Origem** | `CashGroupsService.rejectPaymentRequest()` |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS (se opt-in) |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `payment_rejected` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "amountDeclared": "150.00",
  "rejectionReason": "Comprovante ilegível",
  "paymentRequestId": "clx..."
}
```

**Mensagem interna:**
> `Seu comprovante de R$ 150,00 foi rejeitado. Motivo: Comprovante ilegível. Entre em contato com o gestor.`

---

### `charge.created`

> Cobrança mensal gerada para o cotista

| Campo | Valor |
|---|---|
| **Origem** | `ChargesService.generateCharges()` |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp (template de aviso de cobrança) |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ⚠️ Opcional — gestor pode desabilitar este aviso |
| **Template sugerido** | `charge_created` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "amountDue": "150.00",
  "referenceMonth": 5,
  "referenceYear": 2026,
  "dueDate": "2026-05-10"
}
```

---

### `charge.due_soon`

> Cobrança vencendo nos próximos 3 dias

| Campo | Valor |
|---|---|
| **Origem** | Job de verificação diária ou carga do painel do cotista |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Deduplicação** | 1 alerta por cobrança por período de 24h |
| **Template sugerido** | `charge_due_soon` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "amountDue": "150.00",
  "dueDate": "2026-05-10",
  "daysUntilDue": 2,
  "referenceMonth": 5,
  "referenceYear": 2026
}
```

**Mensagem interna:**
> `Sua cota de Mai/2026 — R$ 150,00 vence em 2 dias (10/05/2026).`

---

### `charge.overdue`

> Cobrança vencida sem pagamento registrado

| Campo | Valor |
|---|---|
| **Origem** | Job de verificação ou sincronização de status de cobranças |
| **Destinatário** | Cotista (member.userId) + Gestor (alerta) |
| **Direção** | `SYSTEM_TO_MEMBER` + `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS (para cotista) |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ⚠️ Configurável — gestor pode exigir aprovação para mensagem de cobrança |
| **Template sugerido** | `charge_overdue` |
| **Frequência** | Máximo 1 alerta externo por semana por cobrança |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "amountDue": "150.00",
  "dueDate": "2026-05-10",
  "daysOverdue": 5,
  "referenceMonth": 5,
  "referenceYear": 2026
}
```

---

### `loan.created`

> Empréstimo concedido ao cotista

| Campo | Valor |
|---|---|
| **Origem** | `LoansService.create()` |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `loan_granted` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "principalAmount": "500.00",
  "totalDue": "650.00",
  "interestRate": "30",
  "dueDate": "2026-12-31",
  "grantedAt": "2026-05-08"
}
```

---

### `loan.due_soon`

> Empréstimo vencendo nos próximos 7 dias

| Campo | Valor |
|---|---|
| **Origem** | Job de verificação diária |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS |
| **Automático** | ✅ Sim |
| **Deduplicação** | 1 alerta por empréstimo a cada 3 dias |
| **Template sugerido** | `loan_due_soon` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "remainingAmount": "650.00",
  "dueDate": "2026-12-31",
  "daysUntilDue": 5
}
```

---

### `loan.overdue`

> Empréstimo vencido e não quitado

| Campo | Valor |
|---|---|
| **Origem** | Job de verificação diária |
| **Destinatário** | Cotista (member.userId) + Gestor |
| **Direção** | `SYSTEM_TO_MEMBER` + `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp e/ou SMS |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ⚠️ Configurável |
| **Frequência** | Máximo 1 alerta externo por semana por empréstimo |
| **Template sugerido** | `loan_overdue` |

---

### `member_access.created`

> Acesso ao painel do cotista foi criado pelo gestor

| Campo | Valor |
|---|---|
| **Origem** | `MembersService` — vinculação de userId ao membro |
| **Destinatário** | Cotista (member.userId) |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | ❌ Nunca — dados de acesso são sensíveis |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `welcome_access` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "memberName": "João Silva",
  "loginUrl": "https://cotacerta.gardenwjs.tech/login"
}
```

**Mensagem interna:**
> `Bem-vindo ao CotaCerta! Você tem acesso ao painel da caixinha Amigos 2026. Acesse cotacerta.gardenwjs.tech para ver suas cobranças e empréstimos.`

---

### `member_profile_change.requested`

> Cotista solicitou alteração de perfil (aguarda aprovação do gestor)

| Campo | Valor |
|---|---|
| **Origem** | `MemberPortalService.requestProfileChange()` |
| **Destinatário** | Gestor |
| **Direção** | `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não (é o alerta para que o gestor aprove) |
| **Template sugerido** | `profile_change_requested` |

---

### `annual_closing.simulated`

> Gestor rodou simulação de fechamento anual

| Campo | Valor |
|---|---|
| **Origem** | `AnnualClosingsService.simulate()` |
| **Destinatário** | Gestor |
| **Direção** | `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não |
| **Template sugerido** | `closing_simulated` |

---

### `annual_closing.confirmed`

> Gestor confirmou definitivamente o fechamento anual

| Campo | Valor |
|---|---|
| **Origem** | `AnnualClosingsService.confirm()` |
| **Destinatário** | Todos os cotistas da caixinha com userId |
| **Direção** | `SYSTEM_TO_MEMBER` |
| **Canal inicial** | `INTERNAL` |
| **Canal externo** | WhatsApp (com aprovação do gestor) |
| **Automático** | ⚠️ Parcialmente — gera mensagens internas automaticamente; envio externo requer aprovação |
| **Aprovação do gestor** | ✅ Sim para canal externo |
| **Template sugerido** | `closing_confirmed` |

**Payload mínimo:**
```json
{
  "cashGroupName": "Amigos 2026",
  "cycleYear": 2026,
  "valuePerQuota": "1250.00",
  "memberNetAmount": "1100.00",
  "confirmedAt": "2026-12-15"
}
```

**Mensagem interna:**
> `O fechamento da caixinha Amigos 2026 foi confirmado. Seu valor líquido é R$ 1.100,00. Entre em contato com o gestor para combinar a distribuição.`

---

### `debtor.detected`

> Cotista classificado como inadimplente (cobrança vencida sem pagamento)

| Campo | Valor |
|---|---|
| **Origem** | `DebtorsService` ou sincronização de cobranças |
| **Destinatário** | Gestor |
| **Direção** | `SYSTEM_TO_ADMIN` |
| **Canal inicial** | `INTERNAL` |
| **Automático** | ✅ Sim |
| **Aprovação do gestor** | ❌ Não (é um alerta, não uma mensagem ao cotista) |
| **Template sugerido** | `debtor_detected` |

**Payload mínimo:**
```json
{
  "memberName": "João Silva",
  "cashGroupName": "Amigos 2026",
  "overdueChargesCount": 2,
  "totalOverdueAmount": "300.00"
}
```

---

## Resumo de gatilhos por fase

### Fase 14B — Canal INTERNAL apenas

Implementar os seguintes eventos com canal interno:

| Evento | Destinatário |
|---|---|
| `payment_request.created` | Gestor |
| `payment_request.confirmed` | Cotista |
| `payment_request.rejected` | Cotista |
| `charge.due_soon` | Cotista |
| `loan.due_soon` | Cotista |
| `member_access.created` | Cotista |
| `annual_closing.confirmed` | Cotistas |

### Fase 14C — Templates e eventos completos

Adicionar os demais eventos ao canal interno.

### Fase 14E–14F — Canal externo

Expandir todos os eventos com suporte a WhatsApp/SMS respeitando preferências e templates aprovados.

---

## Schema Prisma proposto (Fase 14B)

```prisma
enum CommunicationChannel {
  INTERNAL
  WHATSAPP
  SMS
  EMAIL
}

enum CommunicationDirection {
  ADMIN_TO_MEMBER
  MEMBER_TO_ADMIN
  SYSTEM_TO_ADMIN
  SYSTEM_TO_MEMBER
}

enum CommunicationStatus {
  DRAFT
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
  CANCELED
}

enum CommunicationAudienceType {
  INDIVIDUAL
  GROUP
  DEBTORS
  ALL_MEMBERS
}

model CommunicationThread {
  id        String   @id @default(cuid())
  groupId   String?  @map("group_id")
  memberId  String?  @map("member_id")
  subject   String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  messages  CommunicationMessage[]

  @@index([groupId])
  @@index([memberId])
  @@map("communication_threads")
}

model CommunicationMessage {
  id            String                    @id @default(cuid())
  threadId      String?                   @map("thread_id")
  senderUserId  String?                   @map("sender_user_id")
  recipientUserId String?                 @map("recipient_user_id")
  groupId       String?                   @map("group_id")
  memberId      String?                   @map("member_id")
  channel       CommunicationChannel      @default(INTERNAL)
  direction     CommunicationDirection
  audienceType  CommunicationAudienceType @default(INDIVIDUAL)
  status        CommunicationStatus       @default(PENDING)
  title         String
  body          String                    @db.Text
  templateKey   String?                   @map("template_key")
  eventType     String?                   @map("event_type")
  data          Json?
  isReadByRecipient Boolean               @default(false) @map("is_read_by_recipient")
  createdAt     DateTime                  @default(now()) @map("created_at")
  sentAt        DateTime?                 @map("sent_at")
  deliveredAt   DateTime?                 @map("delivered_at")
  readAt        DateTime?                 @map("read_at")

  deliveryLogs  MessageDeliveryLog[]

  @@index([recipientUserId])
  @@index([senderUserId])
  @@index([groupId])
  @@index([status])
  @@index([eventType])
  @@map("communication_messages")
}

model CommunicationPreference {
  id               String               @id @default(cuid())
  memberId         String               @unique @map("member_id")
  internalEnabled  Boolean              @default(true) @map("internal_enabled")
  whatsappEnabled  Boolean              @default(false) @map("whatsapp_enabled")
  smsEnabled       Boolean              @default(false) @map("sms_enabled")
  preferredChannel CommunicationChannel @default(INTERNAL) @map("preferred_channel")
  consentAt        DateTime?            @map("consent_at")
  createdAt        DateTime             @default(now()) @map("created_at")
  updatedAt        DateTime             @updatedAt @map("updated_at")

  @@map("communication_preferences")
}

model MessageTemplate {
  id        String               @id @default(cuid())
  key       String               @unique
  name      String
  channel   CommunicationChannel @default(INTERNAL)
  titleTpl  String               @map("title_tpl")
  bodyTpl   String               @map("body_tpl") @db.Text
  variables Json?
  active    Boolean              @default(true)
  createdAt DateTime             @default(now()) @map("created_at")
  updatedAt DateTime             @updatedAt @map("updated_at")

  @@map("message_templates")
}

model MessageDeliveryLog {
  id               String              @id @default(cuid())
  messageId        String              @map("message_id")
  channel          CommunicationChannel
  provider         String?
  providerMessageId String?            @map("provider_message_id")
  status           CommunicationStatus
  error            String?
  rawResponse      Json?               @map("raw_response")
  attemptNumber    Int                 @default(1) @map("attempt_number")
  createdAt        DateTime            @default(now()) @map("created_at")

  message          CommunicationMessage @relation(fields: [messageId], references: [id])

  @@index([messageId])
  @@map("message_delivery_logs")
}
```
