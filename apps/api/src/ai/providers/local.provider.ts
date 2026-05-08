import { Injectable } from '@nestjs/common';
import { AIService, AIAnalysisRequest, AIAnalysisResult } from '../ai.service';

@Injectable()
export class LocalAIProvider extends AIService {
  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    switch (request.context) {
      case 'payment-analysis':
        return this.analyzePayment(request.input, startTime);
      case 'debtor-priority':
        return this.prioritizeDebtors(request.input, startTime);
      case 'message-suggestion':
        return this.suggestMessage(request.input, startTime);
      default:
        throw new Error(`Contexto não suportado: ${request.context}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getProviderInfo() {
    return { name: 'Local Heuristic Provider', version: '1.0.0', requiresApiKey: false };
  }

  private analyzePayment(input: any, startTime: number): AIAnalysisResult {
    const extractedAmount = input.extractedAmount ?? null;
    const expectedAmount = input.expectedAmount ?? null;

    const amountDiff = extractedAmount != null && expectedAmount != null ? Math.abs(extractedAmount - expectedAmount) : null;
    const amountMatches = amountDiff != null ? amountDiff <= 0.5 : null;
    const confidence = amountMatches === true ? 0.75 : amountMatches === false ? 0.35 : 0.5;
    const suggestion = amountMatches ? 'approve' : 'review';

    return {
      suggestions: { suggestion, amountMatches, amountDiff },
      confidence,
      reasoning: `Análise local: valor ${amountMatches ? 'coincide' : 'difere'} em R$ ${amountDiff?.toFixed(2) ?? 'n/a'}`,
      metadata: { provider: 'local', durationMs: Date.now() - startTime },
    };
  }

  private prioritizeDebtors(input: any, startTime: number): AIAnalysisResult {
    const daysOverdue = input.currentCharge?.daysOverdue ?? 0;
    const riskScore = Math.min(100, daysOverdue * 5);
    return {
      suggestions: { riskScore, priority: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low' },
      confidence: 0.7,
      reasoning: `Score baseado em ${daysOverdue} dias de atraso`,
      metadata: { provider: 'local', durationMs: Date.now() - startTime },
    };
  }

  private suggestMessage(input: any, startTime: number): AIAnalysisResult {
    const templates: Record<string, string> = {
      friendly: `Olá ${input.memberName}, tudo bem? Notei que o pagamento de R$ ${input.amount} está pendente. Quando puder, por favor, regularize para mantermos tudo em dia. Qualquer dúvida, estou à disposição!`,
      formal: `Prezado(a) ${input.memberName}, informamos que há pendência de pagamento no valor de R$ ${input.amount}. Solicitamos a regularização o mais breve possível.`,
      firm: `${input.memberName}, seu pagamento de R$ ${input.amount} está atrasado há ${input.daysOverdue} dias. É importante regularizar hoje para evitar transtornos.`,
    };

    const messageDraft = templates[input.tone] || templates.friendly;

    return {
      suggestions: { messageDraft },
      confidence: 0.6,
      reasoning: 'Template pré-definido baseado em tom solicitado',
      metadata: { provider: 'local', durationMs: Date.now() - startTime },
    };
  }
}
