import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentRequestAnalysisStatus, PaymentRequestStatus } from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';

type PaymentRequestWithContext = Prisma.PaymentRequestGetPayload<{
  include: {
    cashGroup: true;
    monthlyCharge: true;
    loan: true;
    pixPayload: true;
    analysis: true;
    member: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

interface ExtractedReceiptData {
  extractedText: string | null;
  extractedAmount: number | null;
  extractedPaidAt: Date | null;
  extractedReceiver: string | null;
  extractedPixKey: string | null;
  extractedTxid: string | null;
  extractedBank: string | null;
  issues: string[];
}

interface ExpectedReceiptData {
  expectedAmount: number | null;
  expectedReceiver: string | null;
  expectedPixKey: string | null;
}

@Injectable()
export class PaymentRequestAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzePaymentRequest(requestId: string) {
    const request = await this.getRequestWithContext(requestId);

    if (!request.receiptDataUrl || !request.receiptMimeType) {
      return this.persistAnalysis(request, {
        status: 'NOT_ANALYZED',
        extractedText: null,
        extractedAmount: null,
        extractedPaidAt: null,
        extractedReceiver: null,
        extractedPixKey: null,
        extractedTxid: null,
        extractedBank: null,
        issues: ['Nenhum comprovante foi enviado ainda.'],
        expectedAmount: this.toDecimalOrNull(this.getExpectedData(request).expectedAmount),
        expectedReceiver: this.getExpectedData(request).expectedReceiver,
        expectedPixKey: this.getExpectedData(request).expectedPixKey,
        amountMatches: null,
        receiverMatches: null,
        pixKeyMatches: null,
        dateLooksValid: null,
      });
    }

    const extracted = await this.extractReceiptData(
      request.receiptDataUrl,
      request.receiptMimeType,
      request,
    );
    const expected = this.getExpectedData(request);

    const amountMatches =
      extracted.extractedAmount != null && expected.expectedAmount != null
        ? this.amountsMatch(extracted.extractedAmount, expected.expectedAmount)
        : null;
    const receiverMatches =
      extracted.extractedReceiver && expected.expectedReceiver
        ? this.textsLookEquivalent(
            extracted.extractedReceiver,
            expected.expectedReceiver,
          )
        : null;
    const pixKeyMatches =
      extracted.extractedPixKey && expected.expectedPixKey
        ? this.pixKeysMatch(extracted.extractedPixKey, expected.expectedPixKey)
        : null;
    const dateLooksValid = this.validateReceiptDate(
      extracted.extractedPaidAt,
      request.createdAt,
    );

    const issues = [...extracted.issues];

    if (amountMatches === false) {
      issues.push('O valor identificado no comprovante diverge do valor esperado.');
    }

    if (receiverMatches === false) {
      issues.push('O recebedor identificado no comprovante diverge do recebedor esperado.');
    }

    if (pixKeyMatches === false) {
      issues.push('A chave Pix identificada no comprovante diverge da chave configurada.');
    }

    if (dateLooksValid === false) {
      issues.push('A data do pagamento parece inconsistente com a solicitação.');
    }

    const status = this.classifyAnalysisStatus({
      extracted,
      amountMatches,
      receiverMatches,
      pixKeyMatches,
      dateLooksValid,
    });

    return this.persistAnalysis(request, {
      status,
      extractedText: extracted.extractedText,
      extractedAmount: this.toDecimalOrNull(extracted.extractedAmount),
      extractedPaidAt: extracted.extractedPaidAt,
      extractedReceiver: extracted.extractedReceiver,
      extractedPixKey: extracted.extractedPixKey,
      extractedTxid: extracted.extractedTxid,
      extractedBank: extracted.extractedBank,
      expectedAmount: this.toDecimalOrNull(expected.expectedAmount),
      expectedReceiver: expected.expectedReceiver,
      expectedPixKey: expected.expectedPixKey,
      amountMatches,
      receiverMatches,
      pixKeyMatches,
      dateLooksValid,
      issues,
    });
  }

  async getAnalysisOrThrow(requestId: string) {
    const request = await this.getRequestWithContext(requestId);

    if (!request.analysis) {
      return this.buildAnalysisResponse(request, null);
    }

    return this.buildAnalysisResponse(request, request.analysis);
  }

  async getRequestWithContext(requestId: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: {
        cashGroup: true,
        monthlyCharge: true,
        loan: true,
        pixPayload: true,
        analysis: true,
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação de pagamento não encontrada.');
    }

    return request;
  }

  async attachAnalysisToRequest<T extends { id: string }>(request: T) {
    const analysis = await this.prisma.paymentRequestAnalysis.findUnique({
      where: { paymentRequestId: request.id },
    });

    return {
      ...request,
      analysis: analysis
        ? this.serializeAnalysisRecord(analysis)
        : null,
    };
  }

  private async extractReceiptData(
    dataUrl: string,
    mimeType: string,
    request: PaymentRequestWithContext,
  ): Promise<ExtractedReceiptData> {
    if (mimeType.startsWith('image/')) {
      return {
        extractedText: null,
        extractedAmount: null,
        extractedPaidAt: null,
        extractedReceiver: null,
        extractedPixKey: null,
        extractedTxid: null,
        extractedBank: null,
        issues: [
          'Comprovante em imagem sem OCR local confiável nesta fase. Revisão manual necessária.',
        ],
      };
    }

    if (mimeType !== 'application/pdf') {
      return {
        extractedText: null,
        extractedAmount: null,
        extractedPaidAt: null,
        extractedReceiver: null,
        extractedPixKey: null,
        extractedTxid: null,
        extractedBank: null,
        issues: ['Tipo de comprovante sem leitura automática suportada nesta fase.'],
      };
    }

    try {
      const buffer = this.dataUrlToBuffer(dataUrl);
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      const text = this.cleanExtractedText(parsed.text);
      await parser.destroy();

      if (!text) {
        return {
          extractedText: null,
          extractedAmount: null,
          extractedPaidAt: null,
          extractedReceiver: null,
          extractedPixKey: null,
          extractedTxid: null,
          extractedBank: null,
          issues: ['O PDF não possui texto extraível suficiente para análise.'],
        };
      }

      const expected = this.getExpectedData(request);

      return {
        extractedText: text,
        extractedAmount: this.extractAmount(text),
        extractedPaidAt: this.extractPaidAt(text),
        extractedReceiver: this.extractReceiver(text, expected.expectedReceiver),
        extractedPixKey: this.extractPixKey(text, expected.expectedPixKey),
        extractedTxid: this.extractTxid(text),
        extractedBank: this.extractBank(text),
        issues: [],
      };
    } catch {
      return {
        extractedText: null,
        extractedAmount: null,
        extractedPaidAt: null,
        extractedReceiver: null,
        extractedPixKey: null,
        extractedTxid: null,
        extractedBank: null,
        issues: ['Falha ao ler o PDF localmente. Revisão manual necessária.'],
      };
    }
  }

  private getExpectedData(request: PaymentRequestWithContext): ExpectedReceiptData {
    const expectedAmount =
      request.type === 'MONTHLY_CHARGE' && request.monthlyCharge
        ? Number(request.monthlyCharge.amountDue) -
          Number(request.monthlyCharge.amountPaid)
        : request.type === 'LOAN' && request.loan
          ? Number(request.loan.totalDue) - Number(request.loan.amountPaid)
          : Number(request.amountDeclared);

    return {
      expectedAmount: expectedAmount > 0 ? Number(expectedAmount.toFixed(2)) : null,
      expectedReceiver:
        request.cashGroup.receivingPixKeyHolder ??
        request.pixPayload?.receiverName ??
        null,
      expectedPixKey:
        request.cashGroup.receivingPixKey ?? request.pixPayload?.pixKey ?? null,
    };
  }

  private classifyAnalysisStatus(input: {
    extracted: ExtractedReceiptData;
    amountMatches: boolean | null;
    receiverMatches: boolean | null;
    pixKeyMatches: boolean | null;
    dateLooksValid: boolean | null;
  }): PaymentRequestAnalysisStatus {
    const hasReadableText =
      Boolean(input.extracted.extractedText) &&
      input.extracted.extractedText!.length >= 12;
    const hasCriticalMismatch =
      input.amountMatches === false ||
      input.receiverMatches === false ||
      input.pixKeyMatches === false;

    if (!hasReadableText) {
      return 'NEEDS_MANUAL_REVIEW';
    }

    if (hasCriticalMismatch) {
      return 'MISMATCH';
    }

    if (
      input.amountMatches === true &&
      (input.receiverMatches === true || input.pixKeyMatches === true) &&
      input.dateLooksValid !== false
    ) {
      return 'AUTO_MATCHED';
    }

    return 'NEEDS_MANUAL_REVIEW';
  }

  private async persistAnalysis(
    request: PaymentRequestWithContext,
    data: {
      status: PaymentRequestAnalysisStatus;
      extractedText: string | null;
      extractedAmount: Prisma.Decimal | null;
      extractedPaidAt: Date | null;
      extractedReceiver: string | null;
      extractedPixKey: string | null;
      extractedTxid: string | null;
      extractedBank: string | null;
      expectedAmount: Prisma.Decimal | null;
      expectedReceiver: string | null;
      expectedPixKey: string | null;
      amountMatches: boolean | null;
      receiverMatches: boolean | null;
      pixKeyMatches: boolean | null;
      dateLooksValid: boolean | null;
      issues: string[];
    },
  ) {
    const analysis = await this.prisma.paymentRequestAnalysis.upsert({
      where: { paymentRequestId: request.id },
      update: {
        status: data.status,
        extractedText: data.extractedText,
        extractedAmount: data.extractedAmount,
        extractedPaidAt: data.extractedPaidAt,
        extractedReceiver: data.extractedReceiver,
        extractedPixKey: data.extractedPixKey,
        extractedTxid: data.extractedTxid,
        extractedBank: data.extractedBank,
        expectedAmount: data.expectedAmount,
        expectedReceiver: data.expectedReceiver,
        expectedPixKey: data.expectedPixKey,
        amountMatches: data.amountMatches,
        receiverMatches: data.receiverMatches,
        pixKeyMatches: data.pixKeyMatches,
        dateLooksValid: data.dateLooksValid,
        issues: data.issues,
        analyzedAt: new Date(),
      },
      create: {
        paymentRequestId: request.id,
        status: data.status,
        extractedText: data.extractedText,
        extractedAmount: data.extractedAmount,
        extractedPaidAt: data.extractedPaidAt,
        extractedReceiver: data.extractedReceiver,
        extractedPixKey: data.extractedPixKey,
        extractedTxid: data.extractedTxid,
        extractedBank: data.extractedBank,
        expectedAmount: data.expectedAmount,
        expectedReceiver: data.expectedReceiver,
        expectedPixKey: data.expectedPixKey,
        amountMatches: data.amountMatches,
        receiverMatches: data.receiverMatches,
        pixKeyMatches: data.pixKeyMatches,
        dateLooksValid: data.dateLooksValid,
        issues: data.issues,
        analyzedAt: new Date(),
      },
    });

    if (
      request.status !== PaymentRequestStatus.CONFIRMED &&
      request.status !== PaymentRequestStatus.REJECTED &&
      request.status !== PaymentRequestStatus.CANCELED
    ) {
      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: {
          status:
            data.status === 'AUTO_MATCHED'
              ? PaymentRequestStatus.AUTO_MATCHED
              : data.status === 'MISMATCH'
                ? PaymentRequestStatus.MISMATCH
                : PaymentRequestStatus.NEEDS_MANUAL_REVIEW,
        },
      });
    }

    const refreshedRequest = await this.getRequestWithContext(request.id);
    return this.buildAnalysisResponse(refreshedRequest, analysis);
  }

  private buildAnalysisResponse(
    request: PaymentRequestWithContext,
    analysis: PaymentRequestWithContext['analysis'] | null,
  ) {
    const expected = this.getExpectedData(request);
    const serialized = analysis ? this.serializeAnalysisRecord(analysis) : null;

    return {
      paymentRequestId: request.id,
      requestStatus: request.status,
      receiptPresent: Boolean(request.receiptDataUrl),
      analysis: serialized,
      expected: {
        amount:
          expected.expectedAmount == null
            ? null
            : expected.expectedAmount.toFixed(2),
        receiver: expected.expectedReceiver,
        pixKey: expected.expectedPixKey,
      },
      summary: this.buildAnalysisSummary(request, serialized),
    };
  }

  private buildAnalysisSummary(
    request: PaymentRequestWithContext,
    analysis: ReturnType<typeof this.serializeAnalysisRecord> | null,
  ) {
    if (!request.receiptDataUrl) {
      return {
        badge: 'Aguardando comprovante',
        message: 'A solicitação ainda não possui comprovante para análise.',
      };
    }

    if (!analysis) {
      return {
        badge: 'Aguardando análise',
        message: 'O comprovante foi enviado e ainda não foi analisado.',
      };
    }

    if (analysis.status === 'AUTO_MATCHED') {
      return {
        badge: 'Compatível',
        message:
          'O sistema encontrou dados compatíveis, mas a baixa ainda depende da sua confirmação.',
      };
    }

    if (analysis.status === 'MISMATCH') {
      return {
        badge: 'Divergência',
        message: 'O sistema encontrou divergências. Confira antes de confirmar.',
      };
    }

    if (analysis.status === 'NEEDS_MANUAL_REVIEW') {
      return {
        badge: 'Precisa revisão',
        message:
          'Não foi possível validar automaticamente. Faça a conferência manual.',
      };
    }

    return {
      badge: 'Aguardando análise',
      message: 'O comprovante foi recebido e aguarda análise.',
    };
  }

  serializeAnalysisRecord(
    analysis: NonNullable<PaymentRequestWithContext['analysis']>,
  ) {
    return {
      id: analysis.id,
      status: analysis.status,
      extractedText: analysis.extractedText,
      extractedAmount:
        analysis.extractedAmount == null
          ? null
          : Number(analysis.extractedAmount).toFixed(2),
      extractedPaidAt: analysis.extractedPaidAt?.toISOString() ?? null,
      extractedReceiver: analysis.extractedReceiver,
      extractedPixKey: analysis.extractedPixKey,
      extractedTxid: analysis.extractedTxid,
      extractedBank: analysis.extractedBank,
      expectedAmount:
        analysis.expectedAmount == null
          ? null
          : Number(analysis.expectedAmount).toFixed(2),
      expectedReceiver: analysis.expectedReceiver,
      expectedPixKey: analysis.expectedPixKey,
      amountMatches: analysis.amountMatches,
      receiverMatches: analysis.receiverMatches,
      pixKeyMatches: analysis.pixKeyMatches,
      dateLooksValid: analysis.dateLooksValid,
      issues: Array.isArray(analysis.issues) ? analysis.issues : [],
      analyzedAt: analysis.analyzedAt?.toISOString() ?? null,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    };
  }

  private cleanExtractedText(text: string) {
    return text.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
  }

  private dataUrlToBuffer(dataUrl: string) {
    const base64 = dataUrl.split(',')[1] ?? '';
    return Buffer.from(base64, 'base64');
  }

  private extractAmount(text: string) {
    const normalized = text.replace(/\s+/g, ' ');
    const labeledPatterns = [
      /valor(?:\s+do\s+pagamento|\s+pix|\s+pago|\s+transferido)?[:\s]*r?\$?\s*([\d.]+,\d{2})/i,
      /total(?:\s+pix|\s+do\s+pix)?[:\s]*r?\$?\s*([\d.]+,\d{2})/i,
    ];

    for (const pattern of labeledPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        return this.parseBrazilianMoney(match[1]);
      }
    }

    const fallbackMatches = normalized.match(/r\$\s*([\d.]+,\d{2})/gi) ?? [];
    if (fallbackMatches.length > 0) {
      const raw = fallbackMatches[0]?.replace(/r\$\s*/i, '');
      if (!raw) {
        return null;
      }
      return this.parseBrazilianMoney(raw);
    }

    return null;
  }

  private extractPaidAt(text: string) {
    const dateTimeMatch = text.match(
      /(\d{2}\/\d{2}\/\d{4})(?:\s*(?:as|às|-)?\s*(\d{2}:\d{2}(?::\d{2})?))?/i,
    );
    if (!dateTimeMatch) {
      return null;
    }

    const [, datePart, timePart] = dateTimeMatch;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour = 12, minute = 0, second = 0] = (timePart ?? '12:00:00')
      .split(':')
      .map(Number);

    const parsed = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private extractReceiver(text: string, expectedReceiver: string | null) {
    if (expectedReceiver) {
      const normalizedText = this.normalizeText(text);
      const normalizedExpected = this.normalizeText(expectedReceiver);
      if (normalizedExpected && normalizedText.includes(normalizedExpected)) {
        return expectedReceiver;
      }
    }

    const patterns = [
      /(?:recebedor|favorecido|destinatario|para)[:\s]+([a-z0-9 .&'-]{5,80})/i,
      /nome[:\s]+([a-z0-9 .&'-]{5,80})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractPixKey(text: string, expectedPixKey: string | null) {
    if (expectedPixKey) {
      const normalizedText = this.normalizeText(text);
      if (normalizedText.includes(this.normalizeText(expectedPixKey))) {
        return expectedPixKey;
      }
    }

    const labeledMatch = text.match(
      /(?:chave\s+pix|chave)[:\s]+([^\s,;|]{5,120})/i,
    );
    if (labeledMatch) {
      return labeledMatch[1].trim();
    }

    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) {
      return emailMatch[0];
    }

    const uuidMatch = text.match(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    );
    if (uuidMatch) {
      return uuidMatch[0];
    }

    return null;
  }

  private extractTxid(text: string) {
    const match = text.match(
      /(?:txid|id(?:\s+da)?\s+transa(?:c|ç)ao|identificador|e2e(?:id)?)[:\s#-]+([a-z0-9._-]{6,64})/i,
    );

    return match?.[1]?.trim() ?? null;
  }

  private extractBank(text: string) {
    const match = text.match(
      /(?:institui(?:c|ç)ao|banco)[:\s]+([a-z0-9 .&'-]{3,80})/i,
    );

    return match?.[1]?.trim() ?? null;
  }

  private parseBrazilianMoney(value: string) {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : null;
  }

  private amountsMatch(left: number, right: number) {
    return Math.abs(left - right) < 0.01;
  }

  private validateReceiptDate(date: Date | null, requestCreatedAt: Date) {
    if (!date) {
      return null;
    }

    const now = Date.now();
    const futureLimit = now + 24 * 60 * 60 * 1000;
    const pastLimit = requestCreatedAt.getTime() - 60 * 24 * 60 * 60 * 1000;

    if (date.getTime() > futureLimit) {
      return false;
    }

    if (date.getTime() < pastLimit) {
      return false;
    }

    return true;
  }

  private textsLookEquivalent(left: string, right: string) {
    const normalizedLeft = this.normalizeText(left);
    const normalizedRight = this.normalizeText(right);

    if (!normalizedLeft || !normalizedRight) {
      return false;
    }

    return (
      normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)
    );
  }

  private pixKeysMatch(left: string, right: string) {
    return this.normalizePixKey(left) === this.normalizePixKey(right);
  }

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }

  private normalizePixKey(value: string) {
    const trimmed = value.trim();
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 11) {
      return digits;
    }

    return trimmed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  private toDecimalOrNull(value: number | null) {
    return value == null ? null : new Prisma.Decimal(value.toFixed(2));
  }
}
