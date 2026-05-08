# Integração Assistiva de IA no CotaCerta

**Versão**: 1.0  
**Data**: 08/05/2026  
**Status**: Fase 13A - Documentação e Arquitetura

---

## Sumário Executivo

Este documento define a arquitetura técnica para integração de IA/ChatGPT no CotaCerta de forma **assistiva e opcional**.

**Princípio fundamental**: **IA sugere → Gestor decide → Sistema registra**

A IA nunca:
- Confirma baixa financeira automaticamente
- Envia cobranças sem aprovação do gestor
- Altera dados financeiros diretamente
- Acessa dados de outros gestores
- Expõe secrets ou chaves de API
- É obrigatória para o sistema funcionar

---

## Contexto do Sistema

O CotaCerta já possui:
- Autenticação (gestor/cotista)
- Gestão de caixinhas e cotistas
- Cobranças mensais
- Pagamentos Pix (Copia e Cola + QR Code)
- Upload e análise básica de comprovantes (PDF/imagem)
- Conferência de solicitações de pagamento
- Empréstimos com juros
- Dashboard de inadimplência (Quem Deve)
- Fechamento anual

**Análise atual de comprovantes**:
- Extração de texto de PDFs via `pdf-parse`
- Validação local de valor, chave PIX, receptor, TXID
- Detecção de inconsistências (valor diferente, chave PIX errada)
- Limitação: imagens não processadas (sem OCR)

---

## Casos de Uso Prioritários

### 1. Análise Assistiva de Comprovantes

**Problema**: Comprovantes em imagem não são analisados. PDFs com baixa qualidade de extração geram falsos negativos.

**Solução com IA**:
- OCR aprimorado para imagens (PNG, JPG, WEBP)
- Análise semântica do texto extraído
- Validação cruzada com dados esperados
- Nível de confiança da análise (0-100%)
- Explicação do raciocínio da IA

**Input**:
```typescript
{
  receiptDataUrl: string,       // Base64 do comprovante
  receiptMimeType: string,       // "application/pdf" | "image/png" | ...
  expectedAmount: number,        // Valor esperado da cobrança
  expectedReceiver: string,      // Nome do receptor esperado
  expectedPixKey: string,        // Chave PIX esperada
  memberName: string,            // Nome do cotista
  cashGroupName: string          // Nome da caixinha
}
```

**Output**:
```typescript
{
  extractedData: {
    amount: number,
    paidAt: Date,
    receiver: string,
    pixKey: string,
    txid: string,
    bank: string
  },
  validation: {
    amountMatches: boolean,
    receiverMatches: boolean,
    pixKeyMatches: boolean,
    dateLooksValid: boolean
  },
  confidence: number,           // 0-1 (85% = 0.85)
  reasoning: string,            // "O comprovante mostra transferência de R$ 100,00 para a chave PIX esperada..."
  issues: string[],             // ["Data de pagamento está 3 dias no futuro"]
  suggestion: "approve" | "review" | "reject"
}
```

**Ação do Gestor**:
- Revisar análise da IA
- Aceitar sugestão (aprovar pagamento)
- Rejeitar sugestão (manter pendente)
- Editar dados extraídos manualmente

**Registro**:
- Log em `AIAnalysisLog` com input hash, sugestão, confiança, decisão do gestor

---

### 2. Detecção de Anomalias Financeiras

**Problema**: Gestor não tem visibilidade proativa de padrões de inadimplência.

**Solução com IA**:
- Análise de histórico de pagamentos por cotista
- Detecção de desvios do padrão (sempre paga dia 5, hoje é dia 20)
- Score de risco de inadimplência (0-100)
- Sugestão de prioridade de cobrança

**Input**:
```typescript
{
  member: {
    id: string,
    name: string,
    paymentHistory: Array<{
      dueDate: Date,
      paidAt: Date | null,
      amount: number,
      status: string
    }>
  },
  currentCharge: {
    dueDate: Date,
    amount: number,
    daysOverdue: number
  }
}
```

**Output**:
```typescript
{
  riskScore: number,            // 0-100 (75 = alto risco)
  pattern: string,              // "Cotista costuma pagar com 2-3 dias de atraso"
  anomaly: string | null,       // "Primeira vez atrasado mais de 7 dias"
  priority: "high" | "medium" | "low",
  suggestedAction: string,      // "Enviar cobrança imediatamente"
  reasoning: string
}
```

**Ação do Gestor**:
- Priorizar cobranças com base em scores
- Revisar anomalias detectadas

---

### 3. Sugestão de Mensagens de Cobrança

**Problema**: Gestor perde tempo criando mensagens personalizadas para cada cotista.

**Solução com IA**:
- Geração de rascunho de mensagem WhatsApp
- Personalização baseada em histórico do cotista
- Tom ajustável (educado/firme/amigável)
- Inclusão de dados relevantes (valor, dias de atraso)

**Input**:
```typescript
{
  memberName: string,
  amount: number,
  daysOverdue: number,
  paymentHistory: string,       // "Sempre paga em dia" | "2 atrasos nos últimos 6 meses"
  tone: "friendly" | "formal" | "firm"
}
```

**Output**:
```typescript
{
  messageDraft: string,         // "Olá João, tudo bem? Notei que..."
  reasoning: string,            // "Tom amigável baseado em histórico positivo"
  confidence: number
}
```

**Ação do Gestor**:
- Revisar rascunho
- Editar texto
- Aprovar e enviar (manualmente via WhatsApp Web)

---

### 4. Validação de Fechamento Anual

**Problema**: Cálculos complexos de fechamento anual são propensos a erro humano.

**Solução com IA**:
- Validação de cálculos de rateio
- Detecção de inconsistências (saldo não fecha)
- Sugestões de otimização de distribuição

**Input**:
```typescript
{
  cashGroup: { name: string, year: number },
  members: Array<{
    name: string,
    quotasCount: number,
    paidAmount: number,
    borrowedAmount: number
  }>,
  totalCollected: number,
  totalSpent: number
}
```

**Output**:
```typescript
{
  validationOk: boolean,
  issues: string[],             // ["Saldo não fecha: diferença de R$ 0,50"]
  suggestions: string[],        // ["Arredondar diferença para o membro com maior saldo positivo"]
  confidence: number
}
```

---

## Arquitetura Técnica

### Visão Geral

```
┌─────────────────────────────────────────────────┐
│           Frontend (React/TypeScript)           │
│  - AISuggestionCard                             │
│  - AIConfigPage                                 │
│  - PaymentRequestsPage (com badge IA)          │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/JSON
┌─────────────────▼───────────────────────────────┐
│         Backend (NestJS/TypeScript)             │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  AIService (interface abstrata)        │    │
│  └────────────────┬───────────────────────┘    │
│                   │                             │
│         ┌─────────┴──────────┐                  │
│         ▼                    ▼                  │
│  ┌──────────────┐     ┌──────────────┐         │
│  │ LocalProvider│     │OpenAIProvider│         │
│  │ (heurístico) │     │  (ChatGPT)   │         │
│  └──────────────┘     └──────────────┘         │
│         │                    │                  │
│         └─────────┬──────────┘                  │
│                   ▼                             │
│  ┌────────────────────────────────────────┐    │
│  │   AIProviderFactory                    │    │
│  │   (seleciona provider por gestor)      │    │
│  └────────────────┬───────────────────────┘    │
│                   │                             │
│  ┌────────────────▼───────────────────────┐    │
│  │  Feature Services (usa AIService)      │    │
│  │  - PaymentRequestAnalysisService       │    │
│  │  - DebtorsService                      │    │
│  │  - MessageSuggestionService            │    │
│  └────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Database (PostgreSQL)              │
│  - GestorAIConfig (feature flags)               │
│  - AIAnalysisLog (auditoria)                    │
└─────────────────────────────────────────────────┘
```

---

### Camada 1: Interface Abstrata (AIService)

**Arquivo**: `apps/api/src/ai/ai.service.ts`

```typescript
export interface AIAnalysisRequest {
  context: string;          // "payment-analysis" | "debtor-priority" | "message-suggestion" | "closing-validation"
  input: any;              // Dados de entrada específicos do caso de uso
  expectedOutput: string;  // Tipo de saída esperada
  userId: string;          // ID do gestor (isolamento)
  metadata?: {
    cashGroupId?: string,
    memberId?: string,
    paymentRequestId?: string
  };
}

export interface AIAnalysisResult {
  suggestions: any;        // Sugestões estruturadas (tipo varia por contexto)
  confidence: number;      // 0-1 (0.85 = 85% de confiança)
  reasoning: string;       // Explicação em linguagem natural
  metadata: {
    provider: string,      // "openai" | "local"
    model?: string,        // "gpt-4" | "gpt-3.5-turbo" (se OpenAI)
    tokensUsed?: number,   // Custo da análise
    durationMs: number     // Tempo de processamento
  };
}

@Injectable()
export abstract class AIService {
  /**
   * Analisa input e retorna sugestões estruturadas
   */
  abstract analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>;

  /**
   * Verifica se o provider está disponível e configurado
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Retorna informações sobre o provider
   */
  abstract getProviderInfo(): {
    name: string;
    version: string;
    requiresApiKey: boolean;
  };
}
```

---

### Camada 2: Providers

#### 2.1 LocalProvider (Heurístico)

**Arquivo**: `apps/api/src/ai/providers/local.provider.ts`

```typescript
@Injectable()
export class LocalAIProvider extends AIService {
  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    switch (request.context) {
      case 'payment-analysis':
        return this.analyzePayment(request.input);
      case 'debtor-priority':
        return this.prioritizeDebtors(request.input);
      case 'message-suggestion':
        return this.suggestMessage(request.input);
      default:
        throw new Error(`Contexto não suportado: ${request.context}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // Sempre disponível
  }

  getProviderInfo() {
    return {
      name: 'Local Heuristic Provider',
      version: '1.0.0',
      requiresApiKey: false
    };
  }

  private analyzePayment(input: any): AIAnalysisResult {
    // Lógica heurística simples:
    // - Compara valores com tolerância de R$ 0,50
    // - Verifica se chave PIX contém partes do nome esperado
    // - Valida se data não está no futuro
    
    const amountDiff = Math.abs(input.extractedAmount - input.expectedAmount);
    const amountMatches = amountDiff <= 0.50;
    
    const confidence = amountMatches ? 0.75 : 0.30;
    const suggestion = amountMatches ? 'approve' : 'review';
    
    return {
      suggestions: { suggestion, amountMatches },
      confidence,
      reasoning: `Análise local: valor ${amountMatches ? 'coincide' : 'difere'} em R$ ${amountDiff.toFixed(2)}`,
      metadata: {
        provider: 'local',
        durationMs: Date.now() - startTime
      }
    };
  }

  private prioritizeDebtors(input: any): AIAnalysisResult {
    // Lógica: maior atraso = maior prioridade
    const riskScore = Math.min(100, input.daysOverdue * 5);
    
    return {
      suggestions: {
        riskScore,
        priority: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low'
      },
      confidence: 0.70,
      reasoning: `Score baseado em ${input.daysOverdue} dias de atraso`,
      metadata: {
        provider: 'local',
        durationMs: 50
      }
    };
  }

  private suggestMessage(input: any): AIAnalysisResult {
    // Template simples baseado em dias de atraso
    const templates = {
      friendly: `Olá ${input.memberName}, tudo bem? Notei que o pagamento de R$ ${input.amount} está pendente. Quando puder, por favor, regularize para mantermos tudo em dia. Qualquer dúvida, estou à disposição!`,
      formal: `Prezado(a) ${input.memberName}, informamos que há pendência de pagamento no valor de R$ ${input.amount}. Solicitamos a regularização o mais breve possível.`,
      firm: `${input.memberName}, seu pagamento de R$ ${input.amount} está atrasado há ${input.daysOverdue} dias. É importante regularizar hoje para evitar transtornos.`
    };
    
    return {
      suggestions: {
        messageDraft: templates[input.tone] || templates.friendly
      },
      confidence: 0.60,
      reasoning: 'Template pré-definido baseado em tom solicitado',
      metadata: {
        provider: 'local',
        durationMs: 10
      }
    };
  }
}
```

#### 2.2 OpenAIProvider

**Arquivo**: `apps/api/src/ai/providers/openai.provider.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIProvider extends AIService {
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor(private configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', null);
    
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.client) {
      throw new Error('OpenAI não está configurado. Configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();
    const prompt = this.buildPrompt(request);
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.context)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Baixa criatividade, alta precisão
        max_tokens: 1000
      });

      const responseText = completion.choices[0].message.content;
      const parsed = this.parseResponse(responseText, request.context);

      return {
        suggestions: parsed.suggestions,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        metadata: {
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: completion.usage?.total_tokens || 0,
          durationMs: Date.now() - startTime
        }
      };
    } catch (error) {
      this.logger.error('Erro ao chamar OpenAI', error);
      throw new Error('Falha na análise de IA. Tente novamente.');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.client !== null;
  }

  getProviderInfo() {
    return {
      name: 'OpenAI GPT-4',
      version: '2024-05',
      requiresApiKey: true
    };
  }

  private getSystemPrompt(context: string): string {
    const basePrompt = `Você é um assistente especializado em análise financeira para sistemas de gestão de caixinhas coletivas.

REGRAS IMPORTANTES:
1. Você NUNCA confirma operações financeiras automaticamente
2. Você APENAS sugere ações para o gestor revisar
3. Mantenha respostas objetivas e estruturadas
4. Sempre explique seu raciocínio
5. Indique nível de confiança da análise (0-100%)
6. Nunca exponha dados sensíveis desnecessariamente

Retorne SEMPRE em formato JSON válido.`;

    const contextPrompts = {
      'payment-analysis': `${basePrompt}

Contexto: Análise de comprovante de pagamento Pix.

Seu objetivo: Extrair dados do comprovante e validar contra dados esperados.

Formato de resposta:
{
  "suggestions": {
    "extractedData": {
      "amount": number,
      "paidAt": "ISO 8601",
      "receiver": "string",
      "pixKey": "string",
      "txid": "string | null",
      "bank": "string | null"
    },
    "validation": {
      "amountMatches": boolean,
      "receiverMatches": boolean,
      "pixKeyMatches": boolean,
      "dateLooksValid": boolean
    },
    "suggestion": "approve" | "review" | "reject"
  },
  "confidence": 0-100,
  "reasoning": "string explicando a análise"
}`,

      'debtor-priority': `${basePrompt}

Contexto: Priorização de cobranças de inadimplentes.

Seu objetivo: Analisar histórico de pagamento e sugerir prioridade de cobrança.

Formato de resposta:
{
  "suggestions": {
    "riskScore": 0-100,
    "pattern": "string descrevendo padrão de pagamento",
    "anomaly": "string | null",
    "priority": "high" | "medium" | "low",
    "suggestedAction": "string"
  },
  "confidence": 0-100,
  "reasoning": "string"
}`,

      'message-suggestion': `${basePrompt}

Contexto: Sugestão de mensagem de cobrança para WhatsApp.

Seu objetivo: Gerar rascunho de mensagem personalizada e respeitosa.

Formato de resposta:
{
  "suggestions": {
    "messageDraft": "string (mensagem completa)"
  },
  "confidence": 0-100,
  "reasoning": "string"
}`
    };

    return contextPrompts[context] || basePrompt;
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    return `Analise os seguintes dados:

${JSON.stringify(request.input, null, 2)}

Retorne a análise em formato JSON conforme especificado.`;
  }

  private parseResponse(responseText: string, context: string): any {
    // Remove markdown code blocks se presentes
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('Erro ao parsear resposta OpenAI', { responseText, error });
      throw new Error('Resposta da IA em formato inválido');
    }
  }
}
```

#### 2.3 AIProviderFactory

**Arquivo**: `apps/api/src/ai/ai-provider.factory.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from './ai.service';
import { LocalAIProvider } from './providers/local.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class AIProviderFactory {
  constructor(
    private prisma: PrismaService,
    private localProvider: LocalAIProvider,
    private openaiProvider: OpenAIProvider
  ) {}

  async getProvider(userId: string): Promise<AIService> {
    // Verifica configuração do gestor
    const config = await this.prisma.gestorAIConfig.findUnique({
      where: { userId }
    });

    // Se IA desabilitada ou não configurada, usa local
    if (!config || !config.aiEnabled) {
      return this.localProvider;
    }

    // Se provider é OpenAI e está disponível, usa
    if (config.provider === 'openai' && await this.openaiProvider.isAvailable()) {
      return this.openaiProvider;
    }

    // Fallback para local
    return this.localProvider;
  }

  async isAIEnabled(userId: string): Promise<boolean> {
    const config = await this.prisma.gestorAIConfig.findUnique({
      where: { userId }
    });

    return config?.aiEnabled ?? false;
  }
}
```

---

### Camada 3: Feature Flags e Configuração

#### Schema Prisma

**Arquivo**: `apps/api/prisma/schema.prisma` (adicionar ao final)

```prisma
// Configuração de IA por gestor
model GestorAIConfig {
  id              String   @id @default(cuid())
  userId          String   @unique
  aiEnabled       Boolean  @default(false)
  provider        String   @default("local") // "openai" | "local"
  apiKeyEncrypted String?  // Chave OpenAI própria do gestor (opcional)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("gestor_ai_configs")
}

// Log de análises de IA (auditoria)
model AIAnalysisLog {
  id            String   @id @default(cuid())
  userId        String
  feature       String   // "payment-analysis" | "debtor-priority" | "message-suggestion" | "closing-validation"
  provider      String   // "openai" | "local"
  inputHash     String   // Hash SHA256 dos dados de entrada (privacidade)
  suggestion    Json     // Sugestão estruturada da IA
  confidence    Decimal  @db.Decimal(5, 2) // 0.00 a 100.00
  reasoning     String?  @db.Text
  gestorAction  String?  // "approved" | "rejected" | "edited" | null (pendente)
  metadata      Json?    // Dados adicionais (tokens usados, duração, etc)
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, feature])
  @@index([createdAt])
  @@map("ai_analysis_logs")
}

// Adicionar relações ao modelo User existente:
// gestorAIConfig  GestorAIConfig?
// aiAnalysisLogs  AIAnalysisLog[]
```

#### Variáveis de Ambiente

**Arquivo**: `.env.example` (adicionar)

```bash
# ──────────────────────────────────────────────────────────
# IA / OpenAI Configuration (opcional)
# ──────────────────────────────────────────────────────────

# Habilitar IA globalmente (default: false)
# Gestores podem habilitar individualmente mesmo com false aqui
AI_ENABLED=false

# Provider padrão para novos gestores (default: local)
AI_DEFAULT_PROVIDER=local

# Chave API OpenAI (opcional)
# Se não configurada, apenas LocalProvider estará disponível
# Obtenha em: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Modelo OpenAI a usar (default: gpt-4)
# Opções: gpt-4, gpt-3.5-turbo
OPENAI_MODEL=gpt-4

# Timeout para chamadas OpenAI em ms (default: 30000)
OPENAI_TIMEOUT=30000
```

---

### Camada 4: Integração com Features Existentes

#### 4.1 PaymentRequestAnalysisService

**Arquivo**: `apps/api/src/payment-requests/payment-request-analysis.service.ts`

Adicionar ao construtor:
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly aiProviderFactory: AIProviderFactory, // NOVO
) {}
```

Adicionar novo método:
```typescript
private async getAISuggestion(
  request: PaymentRequestWithContext,
  extractedData: ExtractedReceiptData
): Promise<AIAnalysisResult | null> {
  try {
    const provider = await this.aiProviderFactory.getProvider(request.cashGroup.userId);
    
    const aiRequest: AIAnalysisRequest = {
      context: 'payment-analysis',
      input: {
        receiptText: extractedData.extractedText,
        extractedAmount: extractedData.extractedAmount,
        extractedReceiver: extractedData.extractedReceiver,
        extractedPixKey: extractedData.extractedPixKey,
        extractedPaidAt: extractedData.extractedPaidAt,
        expectedAmount: this.getExpectedData(request).expectedAmount,
        expectedReceiver: this.getExpectedData(request).expectedReceiver,
        expectedPixKey: this.getExpectedData(request).expectedPixKey,
        memberName: request.member.name,
        cashGroupName: request.cashGroup.name
      },
      expectedOutput: 'payment-validation',
      userId: request.cashGroup.userId,
      metadata: {
        cashGroupId: request.cashGroupId,
        memberId: request.memberId,
        paymentRequestId: request.id
      }
    };

    const result = await provider.analyze(aiRequest);
    
    // Log da análise para auditoria
    await this.logAIAnalysis(request.cashGroup.userId, 'payment-analysis', aiRequest, result);
    
    return result;
  } catch (error) {
    this.logger.error('Erro ao obter sugestão de IA', error);
    return null;
  }
}

private async logAIAnalysis(
  userId: string,
  feature: string,
  request: AIAnalysisRequest,
  result: AIAnalysisResult
): Promise<void> {
  const inputHash = createHash('sha256')
    .update(JSON.stringify(request.input))
    .digest('hex');

  await this.prisma.aIAnalysisLog.create({
    data: {
      userId,
      feature,
      provider: result.metadata.provider,
      inputHash,
      suggestion: result.suggestions,
      confidence: new Prisma.Decimal(result.confidence * 100),
      reasoning: result.reasoning,
      metadata: result.metadata
    }
  });
}
```

Modificar `analyzePaymentRequest`:
```typescript
async analyzePaymentRequest(requestId: string) {
  const request = await this.getRequestWithContext(requestId);
  
  // ... código existente de extração ...
  
  const extracted = await this.extractReceiptData(
    request.receiptDataUrl,
    request.receiptMimeType,
    request,
  );
  
  // NOVO: Análise assistiva de IA (se habilitada)
  const aiEnabled = await this.aiProviderFactory.isAIEnabled(request.cashGroup.userId);
  let aiSuggestion: AIAnalysisResult | null = null;
  
  if (aiEnabled && extracted.extractedText) {
    aiSuggestion = await this.getAISuggestion(request, extracted);
  }
  
  const analysis = await this.persistAnalysis(request, {
    // ... dados existentes ...
  });
  
  // Retornar análise com sugestão de IA anexada
  return {
    ...analysis,
    aiSuggestion // Pode ser null se IA desabilitada
  };
}
```

---

## Roadmap de Implementação

### Fase 13A - Documentação e Arquitetura ✅

**Objetivo**: Planejar sem implementar código funcional.

**Entregáveis**:
- [x] Documento `docs/AI-INTEGRATION.md` completo
- [x] Schemas Prisma documentados
- [x] Interfaces TypeScript definidas
- [x] Variáveis de ambiente listadas
- [x] Casos de uso mapeados

**Critério de sucesso**: Documento aprovado pelo time, arquitetura validada.

---

### Fase 13B - Infraestrutura Base (futura)

**Objetivo**: Criar base de IA sem chamadas reais à OpenAI.

**Tarefas**:
1. Criar módulo `apps/api/src/ai/ai.module.ts`
2. Implementar `AIService` (interface abstrata)
3. Implementar `LocalAIProvider` com heurísticas simples
4. Implementar `OpenAIProvider` como stub (retorna mock, não chama API)
5. Implementar `AIProviderFactory`
6. Adicionar tabelas Prisma: `GestorAIConfig`, `AIAnalysisLog`
7. Criar migration

**Critério de sucesso**:
- `npm run build:api` sem erros
- `LocalProvider.analyze()` retorna sugestões heurísticas
- `OpenAIProvider.isAvailable()` retorna `false` sem API key

---

### Fase 13C - Integração com Features (futura)

**Objetivo**: Conectar IA às features existentes.

**Tarefas**:
1. Estender `PaymentRequestAnalysisService` para usar `AIService`
2. Estender `DebtorsService` para priorização assistiva
3. Criar `MessageSuggestionService`
4. Criar endpoints:
   - `POST /ai/suggest-message` - Gerar rascunho de cobrança
   - `GET /ai/history` - Histórico de análises
   - `GET /ai/config` - Configuração do gestor
   - `PUT /ai/config` - Atualizar configuração
5. Frontend:
   - Componente `AISuggestionCard.tsx`
   - Página `AIConfigPage.tsx`
   - Badge "IA Sugeriu" em `PaymentRequestsPage`

**Critério de sucesso**:
- Gestor acessa `/configuracoes/ia` e vê toggle (desabilitado)
- `PaymentRequestsPage` mostra análise local quando IA habilitada
- Gestor pode aceitar/rejeitar sugestões

---

### Fase 13D - Implementação Real OpenAI (futura)

**Objetivo**: Ativar chamadas reais à API do ChatGPT.

**Tarefas**:
1. Instalar `openai` package: `npm install openai`
2. Remover stubs do `OpenAIProvider`, implementar chamadas reais
3. Implementar prompts otimizados por caso de uso
4. Testes com comprovantes reais
5. Ajuste de confidence thresholds
6. Monitoramento de custos (tokens usados)
7. Rate limiting por gestor

**Critério de sucesso**:
- Com `OPENAI_API_KEY` configurada, análises usam GPT-4
- Logs de auditoria registram `tokensUsed` e custos estimados
- Gestor vê alertas se ultrapassar budget mensal

---

## Segurança e Privacidade

### Isolamento de Dados

**Garantia**: IA de um gestor NUNCA acessa dados de outro gestor.

**Implementação**:
- Toda `AIAnalysisRequest` inclui `userId`
- `AIProviderFactory.getProvider(userId)` carrega config específica
- Prompts OpenAI incluem apenas dados do contexto (membro, caixinha)
- Logs de auditoria registram `userId` para rastreabilidade

### Proteção de Secrets

**Chaves API**:
- `OPENAI_API_KEY` global: armazenada em `.env` (não commitada)
- `GestorAIConfig.apiKeyEncrypted`: criptografada antes de salvar no banco
- Frontend NUNCA recebe chaves API (apenas backend)

**Implementação de criptografia** (futura):
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  });
}

function decryptApiKey(encrypted: string): string {
  const { iv, encryptedData, authTag } = JSON.parse(encrypted);
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
}
```

### Anonimização em Logs

**AIAnalysisLog.inputHash**: SHA256 dos dados de entrada, não texto plano.

**Razão**: Auditoria sem expor dados sensíveis (valores, nomes, chaves PIX).

```typescript
import { createHash } from 'crypto';

const inputHash = createHash('sha256')
  .update(JSON.stringify(request.input))
  .digest('hex');
```

**Exceção**: `suggestion` e `reasoning` podem conter dados analisados para debugging. Acesso restrito ao próprio gestor.

---

## Custos e Rate Limiting

### Estimativa de Custos OpenAI (GPT-4)

**Preços** (referência maio/2026):
- Input: $0.03 por 1K tokens
- Output: $0.06 por 1K tokens

**Estimativa por análise**:
- Análise de comprovante: ~500 tokens input + 300 output = ~$0.03
- Sugestão de mensagem: ~200 input + 150 output = ~$0.015
- Priorização de devedores: ~300 input + 200 output = ~$0.02

**Cenário**: Gestor com 50 cotistas, 50 cobranças/mês
- 50 análises de comprovante: ~$1.50/mês
- 10 sugestões de mensagem: ~$0.15/mês
- **Total estimado**: ~$2/mês por gestor ativo

### Rate Limiting (implementação futura)

**Objetivo**: Prevenir abuso e custos excessivos.

**Limites sugeridos**:
- 100 análises de IA por gestor por dia
- 500 análises por gestor por mês
- Após limite, fallback automático para `LocalProvider`

**Implementação** (`apps/api/src/ai/ai-rate-limiter.service.ts`):
```typescript
@Injectable()
export class AIRateLimiter {
  async checkLimit(userId: string): Promise<boolean> {
    const today = startOfDay(new Date());
    const count = await this.prisma.aIAnalysisLog.count({
      where: {
        userId,
        provider: 'openai',
        createdAt: { gte: today }
      }
    });
    
    return count < 100; // Limite diário
  }
}
```

---

## Monitoramento e Métricas

### Métricas de IA a Rastrear

**Dashboard do gestor** (`/configuracoes/ia/metricas`):
1. **Uso mensal**:
   - Análises de IA realizadas (por tipo)
   - Tokens consumidos (se OpenAI)
   - Custo estimado em R$

2. **Acurácia**:
   - Sugestões aceitas vs rejeitadas
   - Taxa de aprovação por tipo de análise
   - Confidence média das análises

3. **Performance**:
   - Tempo médio de análise (ms)
   - Taxa de sucesso (sem erros)
   - Provider usado (OpenAI vs Local)

**Implementação** (endpoint futuro):
```typescript
@Get('ai/metrics')
async getAIMetrics(@UserId() userId: string) {
  const logs = await this.prisma.aIAnalysisLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  const totalAnalyses = logs.length;
  const approved = logs.filter(l => l.gestorAction === 'approved').length;
  const avgConfidence = logs.reduce((sum, l) => sum + Number(l.confidence), 0) / totalAnalyses;
  const totalTokens = logs.reduce((sum, l) => (l.metadata as any)?.tokensUsed || 0, 0);
  
  return {
    totalAnalyses,
    approvalRate: (approved / totalAnalyses) * 100,
    avgConfidence,
    totalTokens,
    estimatedCostUSD: (totalTokens / 1000) * 0.05 // Estimativa
  };
}
```

---

## Testes

### Testes Unitários

**Arquivo**: `apps/api/src/ai/providers/local.provider.spec.ts`

```typescript
describe('LocalAIProvider', () => {
  let provider: LocalAIProvider;

  beforeEach(() => {
    provider = new LocalAIProvider();
  });

  it('deve analisar pagamento com valor correto', async () => {
    const result = await provider.analyze({
      context: 'payment-analysis',
      input: {
        extractedAmount: 100.00,
        expectedAmount: 100.00
      },
      userId: 'test-user',
      expectedOutput: 'validation'
    });

    expect(result.suggestions.amountMatches).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.suggestions.suggestion).toBe('approve');
  });

  it('deve detectar valor divergente', async () => {
    const result = await provider.analyze({
      context: 'payment-analysis',
      input: {
        extractedAmount: 95.00,
        expectedAmount: 100.00
      },
      userId: 'test-user',
      expectedOutput: 'validation'
    });

    expect(result.suggestions.amountMatches).toBe(false);
    expect(result.suggestions.suggestion).toBe('review');
  });
});
```

### Testes de Integração

**Arquivo**: `apps/api/src/ai/ai-integration.spec.ts`

```typescript
describe('AI Integration', () => {
  it('deve usar LocalProvider quando IA desabilitada', async () => {
    const provider = await factory.getProvider(userId);
    expect(provider.getProviderInfo().name).toContain('Local');
  });

  it('deve criar log de auditoria após análise', async () => {
    await paymentAnalysisService.analyzePaymentRequest(requestId);
    
    const log = await prisma.aIAnalysisLog.findFirst({
      where: { userId, feature: 'payment-analysis' }
    });
    
    expect(log).toBeDefined();
    expect(log.provider).toBe('local');
    expect(log.confidence).toBeGreaterThan(0);
  });
});
```

---

## Perguntas Frequentes (FAQ)

### 1. A IA vai substituir o gestor?

**Não**. A IA é **assistiva**, não **autônoma**. O gestor sempre tem a decisão final sobre:
- Confirmar ou rejeitar pagamentos
- Enviar cobranças
- Aprovar fechamentos anuais
- Alterar dados financeiros

### 2. O sistema funciona sem IA?

**Sim, 100%**. A IA é **opcional**. Gestor pode:
- Desabilitar completamente no painel
- Usar apenas análise local (sem OpenAI)
- Sistema mantém todas funcionalidades sem IA

### 3. Quanto custa usar OpenAI?

**Estimativa**: ~R$ 10-20/mês por gestor com 50-100 cotistas.

Custos variam por:
- Quantidade de análises mensais
- Modelo usado (GPT-4 mais caro, GPT-3.5 mais barato)
- Tamanho dos comprovantes analisados

Gestor pode configurar budget mensal e receber alertas.

### 4. Meus dados ficam na OpenAI?

**Dados enviados**: Apenas o necessário para análise (texto do comprovante, valores esperados).

**Dados NÃO enviados**: IDs internos, senhas, tokens JWT, dados de outros gestores.

**Retenção OpenAI**: Por padrão, OpenAI não treina modelos com dados via API (política de maio/2026).

**Alternativa**: Usar apenas `LocalProvider` (análise heurística, 100% local).

### 5. A IA pode errar?

**Sim**. Por isso:
- Toda sugestão tem nível de confiança (0-100%)
- Sugestões com baixa confiança marcadas como "revisar"
- Gestor sempre revisa antes de confirmar
- Histórico de análises mantido para auditoria

### 6. Como habilitar IA no meu painel?

1. Acesse `/configuracoes/ia`
2. Ative toggle "Habilitar IA Assistiva"
3. Escolha provider:
   - **Local**: Análise heurística, grátis, sempre disponível
   - **OpenAI**: Análise com ChatGPT, requer chave API, pago
4. Se OpenAI: insira chave API (obtida em https://platform.openai.com)
5. Salve configurações

### 7. Posso usar minha própria chave OpenAI?

**Sim**. Cada gestor pode:
- Usar chave própria (custos na conta dele)
- Ou usar chave global do sistema (se administrador configurou)

Chaves são criptografadas antes de salvar no banco.

### 8. A IA aprende com meus dados?

**LocalProvider**: Não. Análise heurística fixa.

**OpenAIProvider**: Não treina modelos por padrão. Mas chamadas à API enviam dados temporariamente.

**Futuro**: Fine-tuning opcional com dados anonimizados do próprio gestor (Fase 13E, ainda não implementada).

---

## Considerações Futuras

### 1. Fine-Tuning de Modelos

**Objetivo**: Treinar modelo específico do CotaCerta para melhor acurácia.

**Abordagem**:
- Coletar histórico de análises + decisões do gestor (opt-in)
- Anonimizar dados (remover nomes, valores, chaves PIX)
- Treinar modelo OpenAI fine-tuned
- Modelo aprende padrão de decisão do gestor

**Benefícios**:
- Maior acurácia (confidence > 90%)
- Redução de falsos positivos
- Menos revisão manual necessária

**Riscos**:
- Custo adicional de treinamento
- Overfitting (modelo muito específico)
- Privacidade (mesmo anonimizado)

### 2. Análise de Fraude

**Casos de uso**:
- Detectar comprovantes duplicados (mesma imagem, diferentes valores)
- Identificar comprovantes editados (Photoshop)
- Padrões suspeitos (sempre mesmo TXID, sempre mesmo horário)

**Implementação**:
- Fingerprinting de imagens (perceptual hash)
- Análise de metadados de PDF/imagem
- Machine learning para detecção de anomalias

### 3. Integração com WhatsApp Business API

**Objetivo**: Enviar cobranças diretamente pelo sistema (com aprovação).

**Fluxo com IA**:
1. IA sugere mensagem personalizada
2. Gestor revisa e aprova
3. Sistema envia via WhatsApp Business API
4. Gestor recebe confirmação de envio

**Requisitos**:
- Conta WhatsApp Business verificada
- API key do WhatsApp Cloud API
- Webhook para receber respostas

### 4. Chatbot para Cotistas

**Objetivo**: Cotista consulta dívidas, pagamentos, comprovantes via chat.

**Exemplo**:
```
Cotista: "Quanto devo na caixinha Família Silva?"
Bot: "Você tem 1 cobrança pendente de R$ 100,00 referente a março/2026. Vencimento: 05/03/2026."
Cotista: "Já paguei ontem!"
Bot: "Perfeito! Por favor, envie o comprovante para análise."
```

**Tecnologias**:
- OpenAI GPT-4 para processamento de linguagem natural
- Integração com WhatsApp ou Telegram
- Consultas seguras ao banco (autenticação por número de telefone)

### 5. Previsão de Inadimplência

**Objetivo**: Prever quem vai atrasar antes do vencimento.

**Modelo**:
- Input: Histórico de pagamentos, padrão de atrasos, comunicação
- Output: Probabilidade de atraso (0-100%), dias esperados de atraso

**Ação**:
- Enviar lembrete proativo antes do vencimento
- Oferecer facilitações (parcelamento, desconto pontualidade)

### 6. Otimização de Fechamento Anual

**Objetivo**: IA sugere melhor distribuição de excedentes/déficits.

**Critérios**:
- Minimizar saldo devedor individual
- Maximizar equidade entre cotistas
- Considerar histórico de contribuições

**Algoritmo**: Programação linear com constraints.

---

## Referências Técnicas

### Documentação OpenAI
- API Reference: https://platform.openai.com/docs/api-reference
- Best Practices: https://platform.openai.com/docs/guides/production-best-practices
- Safety: https://platform.openai.com/docs/guides/safety-best-practices

### Bibliotecas Usadas
- `openai` (Node.js SDK): https://github.com/openai/openai-node
- `pdf-parse` (PDF extraction): https://www.npmjs.com/package/pdf-parse
- NestJS (framework): https://docs.nestjs.com
- Prisma (ORM): https://www.prisma.io/docs

### Arquitetura CotaCerta
- [docs/SPEC.md](./SPEC.md) - Especificação do produto
- [docs/MVP.md](./MVP.md) - Funcionalidades do MVP
- [docs/REGRAS-DE-NEGOCIO.md](./REGRAS-DE-NEGOCIO.md) - Regras de negócio
- [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma) - Schema do banco de dados

---

## Changelog

### v1.0 - 08/05/2026
- ✅ Documentação inicial completa
- ✅ Casos de uso definidos: payment-analysis, debtor-priority, message-suggestion, closing-validation
- ✅ Arquitetura em camadas: AIService → Providers → Factory
- ✅ Schemas Prisma: GestorAIConfig, AIAnalysisLog
- ✅ Interfaces TypeScript documentadas
- ✅ Roadmap de implementação (Fases 13A-13D)
- ✅ Segurança e privacidade mapeadas
- ✅ Estimativas de custo e rate limiting
- ✅ FAQ e considerações futuras

---

**Próximos passos**: Aprovação do plano → Fase 13B (infraestrutura base)

**Contato**: Documentação criada por agente de IA especializado em arquitetura de software.
