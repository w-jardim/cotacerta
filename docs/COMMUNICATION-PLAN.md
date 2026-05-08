# Fase 14 — Plano de Alertas e Comunicação

**Versão:** 1.0  
**Data:** 2026-05-08  
**Status:** Planejamento (Fase 14A)

---

## 1. Visão geral

O CotaCerta centraliza a gestão financeira de caixinhas. Com o crescimento do produto, a comunicação entre gestor e cotistas precisa ser estruturada, rastreável e multicanal — sem depender de WhatsApp pessoal ou ferramentas externas espalhadas.

Este plano define o módulo de comunicação como uma camada própria do sistema, com registro interno obrigatório e entregas externas (WhatsApp, SMS) como extensões opcionais controladas.

### Princípio arquitetural

```
CotaCerta  →  fonte da verdade, permissões, histórico, preferências
n8n        →  automações e orquestração de entregas externas
Provedor   →  canal de entrega (WhatsApp Cloud API, Twilio, etc.)
IA         →  sugestão de conteúdo de mensagens
Gestor     →  controle de mensagens sensíveis e em massa
```

**Regra fundamental:** toda mensagem externa nasce como registro interno. Falha no canal externo não apaga o histórico.

---

## 2. Objetivos

- Substituir WhatsApp pessoal do gestor por canal estruturado dentro do sistema
- Registrar todas as comunicações com rastreabilidade e auditoria
- Permitir mensagens individuais, em grupo e automáticas por evento
- Preparar integração futura com WhatsApp Business API e SMS sem refatoração de base
- Respeitar consentimento e preferências do cotista por canal
- Dar ao gestor visibilidade de status de entrega (enviado, entregue, lido)

---

## 3. Tipos de comunicação

### 3.1 Por direção

| Direção | Descrição |
|---|---|
| `ADMIN_TO_MEMBER` | Gestor envia para um cotista específico |
| `ADMIN_TO_GROUP` | Gestor envia para todos de uma caixinha |
| `ADMIN_TO_DEBTORS` | Gestor envia para inadimplentes de uma caixinha |
| `MEMBER_TO_ADMIN` | Cotista responde ou inicia contato com o gestor |
| `SYSTEM_TO_ADMIN` | Sistema alerta o gestor (novo comprovante, erro, etc.) |
| `SYSTEM_TO_MEMBER` | Sistema alerta o cotista (cobrança confirmada, vencimento, etc.) |

### 3.2 Por audiência

| Tipo | Descrição |
|---|---|
| `INDIVIDUAL` | Um único destinatário |
| `GROUP` | Todos os cotistas de uma caixinha |
| `DEBTORS` | Apenas inadimplentes de uma caixinha |
| `ALL_MEMBERS` | Todos os cotistas vinculados ao gestor |

### 3.3 Por canal

| Canal | Status atual | Fase de integração |
|---|---|---|
| `INTERNAL` | Fase 14B | já habilitado desde o início |
| `WHATSAPP` | Planejado | Fase 14F |
| `SMS` | Planejado | Fase 14F |
| `EMAIL` | Futuro | Fase 15+ |
| `PUSH` | Futuro | Fase 15+ |

---

## 4. Canais

### 4.1 Comunicação interna (INTERNAL)
- Mensagens visíveis apenas dentro do CotaCerta
- Sem dependência de provedor externo
- Disponível para todos os usuários
- Não requer consentimento adicional (faz parte do produto)

### 4.2 WhatsApp Business (WHATSAPP)
- Requer WhatsApp Cloud API (Meta) ou intermediário aprovado (Twilio)
- Mensagens iniciadas pela empresa fora da janela de 24h **exigem templates aprovados** pela Meta
- Requer opt-in explícito do cotista com registro de consentimento
- Entrega orquestrada via n8n (Fase 14E) ou direto via API (Fase 14F)

### 4.3 SMS (SMS)
- Via Twilio ou provedor nacional (Zenvia, Infobip, etc.)
- Mais simples que WhatsApp em termos de aprovação
- Requer opt-in e armazenamento de número válido
- Útil como fallback quando WhatsApp não está disponível

---

## 5. Fluxos principais

### 5.1 Gestor → Cotista individual

```
1. Gestor abre a Central de Comunicações
2. Seleciona caixinha → cotista
3. Redige mensagem (ou usa template)
4. Escolhe canal: interno / WhatsApp / SMS
5. Clica em Enviar
6. Sistema cria CommunicationMessage (status: PENDING)
7. Se canal interno: status muda para SENT imediatamente
8. Se canal externo: DeliveryJob é criado e enviado ao n8n/provedor
9. n8n devolve status: DELIVERED / READ / FAILED
10. Gestor vê status na Central
```

### 5.2 Cotista → Gestor

```
1. Cotista acessa painel → seção Mensagens
2. Lê avisos e mensagens do gestor
3. Clica em "Responder" ou "Nova mensagem"
4. Digita o texto
5. Sistema cria CommunicationMessage com direction MEMBER_TO_ADMIN
6. Gestor recebe alerta interno na Central
7. (Opcional) Gestor recebe notificação via canal externo configurado
```

### 5.3 Gestor → Grupo (broadcast)

```
1. Gestor acessa Central → aba Broadcast
2. Seleciona caixinha e audiência (todos / inadimplentes)
3. Redige mensagem ou seleciona template
4. Confirma envio (modal de confirmação com contagem de destinatários)
5. Sistema cria uma CommunicationMessage por destinatário (audienceType = GROUP)
6. Processa em lote respeitando preferências individuais de canal
7. Gestor acompanha status de cada entrega
```

### 5.4 Sistema → Gestor (alertas automáticos)

```
Disparadores automáticos:
- Novo comprovante enviado por cotista
- Comprovante pendente há mais de 48h
- Inadimplência detectada

Fluxo:
1. Evento ocorre no sistema
2. Sistema cria CommunicationMessage (SYSTEM_TO_ADMIN, canal INTERNAL)
3. Ícone de sino atualiza contagem de não lidas
4. Gestor clica e vê o alerta
```

### 5.5 Sistema → Cotista (alertas automáticos)

```
Disparadores automáticos:
- Comprovante confirmado pelo gestor
- Comprovante rejeitado
- Cobrança vencendo em 3 dias
- Empréstimo vencendo em 3 dias
- Acesso ao painel criado (senha provisória)

Fluxo:
1. Evento ocorre
2. Sistema cria CommunicationMessage (SYSTEM_TO_MEMBER, canal INTERNAL)
3. Se cotista tem preferência por canal externo → gera DeliveryJob
4. Cotista vê na Caixa de Entrada do painel
```

---

## 6. Central de Comunicações (tela do gestor)

Seções:

| Seção | Descrição |
|---|---|
| Conversas | Lista de threads ativas por cotista/caixinha |
| Broadcast | Envio em massa para grupo ou inadimplentes |
| Alertas do sistema | Notificações automáticas recebidas |
| Templates | Gerenciamento de templates internos |
| Status de entrega | Log de envios com status por canal |

Filtros:
- Por caixinha
- Por cotista
- Por canal
- Por status (pendente / enviado / falhou / entregue / lido)
- Por data

---

## 7. Caixa de entrada do cotista

Seções no painel (`/meu-painel`):

| Seção | Descrição |
|---|---|
| Avisos | Alertas automáticos do sistema |
| Mensagens | Mensagens enviadas pelo gestor |
| Confirmações | Resultado de conferência de comprovantes |
| Cobranças | Avisos de vencimento e status |
| Empréstimos | Avisos sobre empréstimos em aberto |

Ações disponíveis:
- Marcar como lida
- Responder ao gestor
- Ver detalhes relacionados (link para cobrança, comprovante, etc.)

---

## 8. Templates

### 8.1 Templates internos

Gerenciados pelo próprio CotaCerta. Não precisam de aprovação externa.

| Chave | Nome | Uso |
|---|---|---|
| `payment_received` | Comprovante recebido | Sistema → Gestor |
| `payment_confirmed` | Pagamento confirmado | Sistema → Cotista |
| `payment_rejected` | Pagamento rejeitado | Sistema → Cotista |
| `charge_due_soon` | Cobrança vencendo | Sistema → Cotista |
| `charge_overdue` | Cobrança vencida | Sistema → Cotista |
| `loan_due_soon` | Empréstimo vencendo | Sistema → Cotista |
| `loan_overdue` | Empréstimo vencido | Sistema → Cotista |
| `welcome_access` | Acesso criado | Sistema → Cotista |
| `closing_confirmed` | Fechamento confirmado | Sistema → Cotista |
| `admin_message` | Mensagem do gestor | Gestor → Cotista |

### 8.2 Templates WhatsApp (Fase 14F)

- Precisam ser criados na plataforma Meta e aprovados antes do uso
- Variáveis delimitadas por `{{variavel}}`
- Não podem conter conteúdo promocional na primeira submissão
- Cada template tem categoria: `UTILITY`, `AUTHENTICATION`, `MARKETING`
- Templates financeiros entram na categoria `UTILITY`

---

## 9. Preferências e consentimento

Cada cotista terá um registro `CommunicationPreference`:

```
internalEnabled     → sempre true por padrão (faz parte do produto)
whatsappEnabled     → requer opt-in explícito
smsEnabled          → requer opt-in explícito
preferredChannel    → INTERNAL por padrão
consentAt           → data/hora do consentimento registrado
```

### Regras de consentimento:
- Comunicação interna: não requer consentimento adicional
- WhatsApp: opt-in via painel do cotista + checkbox com texto legal claro
- SMS: opt-in via painel do cotista + texto legal
- O gestor **não pode** habilitar WhatsApp/SMS em nome do cotista
- Revogação deve ser imediata e registrada

---

## 10. Auditoria

Toda mensagem terá rastreabilidade completa:

```
CommunicationMessage → quem enviou, para quem, quando, canal, conteúdo, status
MessageDeliveryLog   → tentativas de entrega, resposta do provedor, erros
```

Retenção mínima: 24 meses para mensagens financeiras.

---

## 11. Filas de envio

O `DeliveryJob` representa uma tentativa de entrega externa:

```
PENDING   → aguardando processamento
SENT      → entregue ao provedor
DELIVERED → confirmado pelo provedor que chegou ao dispositivo
READ      → lido pelo destinatário (quando disponível via webhook)
FAILED    → falha definitiva após N tentativas
CANCELED  → cancelado antes do envio
```

Regras:
- Máximo 3 tentativas com backoff exponencial
- Falha não apaga o registro interno
- Gestor pode ver status e reenviar manualmente

---

## 12. Relação com n8n

O n8n atua como **orquestrador de entrega externa**, nunca como fonte de dados:

```
CotaCerta → webhook POST → n8n → provedor (WhatsApp/SMS)
n8n       → webhook callback → CotaCerta → atualiza DeliveryLog
```

O n8n **nunca** acessa o banco diretamente. Toda comunicação é via endpoints autenticados da API com token de assinatura (HMAC ou JWT de serviço).

Casos de uso no n8n:
- Receber evento de novo comprovante → enviar WhatsApp ao gestor
- Receber evento de cobrança vencida → enviar SMS ao cotista (se habilitado)
- Agendar lembretes recorrentes com base em regras do CotaCerta
- Tratar fallback: WhatsApp falhou → tentar SMS

---

## 13. Relação com IA

A IA pode auxiliar:

- **Sugestão de mensagens:** dado o contexto (cobrança vencida, comprovante rejeitado), sugerir texto apropriado
- **Tom de voz:** ajustar mensagem entre amigável, formal e firme
- **Resumo de thread:** resumir histórico de conversa para o gestor
- **Detecção de urgência:** classificar mensagem do cotista como urgente/normal

A IA não envia mensagens autonomamente. Sempre passa pela revisão e confirmação do gestor para mensagens financeiras sensíveis.

---

## 14. Riscos

| Risco | Mitigação |
|---|---|
| Envio de WhatsApp sem consentimento | Opt-in obrigatório com registro de data/hora |
| Template não aprovado pela Meta | Testar templates em ambiente sandbox antes |
| Spam para cotistas | Limite de mensagens por cotista por dia configurável |
| Falha no provedor afeta experiência | Comunicação interna sempre disponível como fallback |
| Dados sensíveis em mensagens externas | Templates não devem incluir saldo/dados financeiros completos |
| n8n com acesso excessivo | n8n só recebe payloads mínimos via webhook |

---

## 15. Fases de implementação

| Fase | Nome | Entregas |
|---|---|---|
| **14A** | Planejamento | Este documento + NOTIFICATION-POLICY + COMMUNICATION-EVENTS |
| **14B** | Comunicação interna MVP | Central do gestor, caixa do cotista, mensagens individuais, alertas automáticos internos |
| **14C** | Templates e eventos | Mensagens automáticas por evento, templates internos gerenciáveis |
| **14D** | Fila de entrega | DeliveryJob, log de tentativas, reenvio manual |
| **14E** | Integração n8n | Webhooks de saída, callback de status, orquestração |
| **14F** | WhatsApp / SMS real | Provedor oficial (WhatsApp Cloud API ou Twilio), templates aprovados |
