import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIService, AIAnalysisRequest, AIAnalysisResult } from '../ai.service';

const SYSTEM_PROMPTS: Record<string, string> = {
  'payment-analysis': `Você é um assistente financeiro que analisa comprovantes de pagamento PIX.
Recebe dados extraídos de um comprovante e os dados esperados do pagamento.
Responda SOMENTE com JSON válido no formato:
{
  "suggestion": "approve" | "review" | "reject",
  "confidence": <número entre 0 e 1>,
  "reasoning": "<explicação curta em português>",
  "issues": ["<lista de divergências encontradas, se houver>"]
}
Regras:
- "approve" se valores, recebedor e chave pix coincidem
- "reject" se houver divergência clara de valor (>R$0,50) ou recebedor errado
- "review" se dados estão incompletos ou há dúvida
- confidence alta (>0.8) apenas quando todos os campos críticos coincidem`,

  'debtor-priority': `Você é um assistente de gestão de inadimplência.
Recebe dados de um membro em atraso e retorna uma avaliação de risco.
Responda SOMENTE com JSON válido no formato:
{
  "riskScore": <número entre 0 e 100>,
  "priority": "high" | "medium" | "low",
  "reasoning": "<explicação curta em português>"
}`,

  'message-suggestion': `Você é um assistente de cobrança para gestores de caixinha.
Gera mensagens de cobrança personalizadas em português brasileiro, no tom solicitado.
Responda SOMENTE com JSON válido no formato:
{
  "messageDraft": "<mensagem pronta para envio via WhatsApp>"
}
A mensagem deve ser direta, humana e adequada ao tom: friendly (amigável), formal ou firm (firme).`,
};

@Injectable()
export class OpenAIProvider extends AIService {
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') ?? '';
    this.model = this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.timeoutMs = Number(this.configService.get<string>('OPENAI_TIMEOUT') ?? '30000');
    this.client = apiKey ? new OpenAI({ apiKey, timeout: this.timeoutMs }) : null;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.client) {
      throw new Error('OpenAI API key não configurada.');
    }

    const systemPrompt = SYSTEM_PROMPTS[request.context];
    if (!systemPrompt) {
      throw new Error(`Contexto não suportado pelo OpenAI provider: ${request.context}`);
    }

    const startTime = Date.now();

    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(request.input) },
      ],
      temperature: 0.2,
    });

    const durationMs = Date.now() - startTime;
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return this.normalize(request.context, parsed, durationMs, completion.usage?.total_tokens);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client;
  }

  getProviderInfo() {
    return { name: 'OpenAI Provider', version: '1.0.0', requiresApiKey: true };
  }

  private normalize(
    context: string,
    parsed: Record<string, unknown>,
    durationMs: number,
    tokensUsed: number | undefined,
  ): AIAnalysisResult {
    const meta = { provider: 'openai', model: this.model, durationMs, tokensUsed };

    if (context === 'payment-analysis') {
      const confidence = typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;
      return {
        suggestions: {
          suggestion: parsed.suggestion ?? 'review',
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        },
        confidence,
        reasoning: String(parsed.reasoning ?? ''),
        metadata: meta,
      };
    }

    if (context === 'debtor-priority') {
      const riskScore = typeof parsed.riskScore === 'number'
        ? Math.max(0, Math.min(100, parsed.riskScore))
        : 50;
      return {
        suggestions: {
          riskScore,
          priority: parsed.priority ?? 'medium',
        },
        confidence: 0.8,
        reasoning: String(parsed.reasoning ?? ''),
        metadata: meta,
      };
    }

    if (context === 'message-suggestion') {
      return {
        suggestions: { messageDraft: String(parsed.messageDraft ?? '') },
        confidence: 0.85,
        reasoning: 'Mensagem gerada pela OpenAI',
        metadata: meta,
      };
    }

    return { suggestions: parsed, confidence: 0.5, reasoning: '', metadata: meta };
  }
}
