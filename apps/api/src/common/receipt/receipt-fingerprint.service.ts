import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceiptFingerprintService {
  constructor(private readonly prisma: PrismaService) {}

  computeReceiptHash(dataUrlOrBase64: string) {
    const buffer = this.decodeBase64Payload(dataUrlOrBase64);
    return createHash('sha256').update(buffer).digest('hex');
  }

  async assertReceiptIsUnique(
    dataUrlOrBase64: string,
    options?: {
      ignorePaymentRequestId?: string;
      ignorePaymentReceiptId?: string;
      manualContext?: boolean;
    },
  ) {
    const receiptHash = this.computeReceiptHash(dataUrlOrBase64);
    const duplicate = await this.findDuplicateReceipt(
      receiptHash,
      dataUrlOrBase64,
      options,
    );

    if (duplicate) {
      const owner = duplicate.memberName
        ? ` para o cotista "${duplicate.memberName}"`
        : '';
      const manualSuffix = options?.manualContext
        ? ' Não é permitido reutilizar comprovante na baixa manual.'
        : '';

      throw new ConflictException(
        `Este comprovante já foi utilizado em outro pagamento${owner}. Verifique antes de reenviar.${manualSuffix}`.trim(),
      );
    }

    return receiptHash;
  }

  private decodeBase64Payload(dataUrlOrBase64: string) {
    const base64 = dataUrlOrBase64.includes(',')
      ? dataUrlOrBase64.split(',').pop()
      : dataUrlOrBase64;

    if (!base64) {
      throw new BadRequestException('Conteúdo do comprovante inválido.');
    }

    const normalizedBase64 = base64.replace(/\s+/g, '');

    if (
      normalizedBase64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)
    ) {
      throw new BadRequestException('Base64 do comprovante inválido.');
    }

    try {
      const buffer = Buffer.from(normalizedBase64, 'base64');
      if (buffer.length === 0) {
        throw new Error('empty');
      }
      return buffer;
    } catch {
      throw new BadRequestException('Base64 do comprovante inválido.');
    }
  }

  private async findDuplicateReceipt(
    receiptHash: string,
    dataUrlOrBase64: string,
    options?: {
      ignorePaymentRequestId?: string;
      ignorePaymentReceiptId?: string;
    },
  ) {
    const [requestByHash, receiptByHash, requestByDataUrl, receiptByDataUrl] =
      await Promise.all([
        this.prisma.paymentRequest.findFirst({
          where: {
            receiptHash,
            ...(options?.ignorePaymentRequestId
              ? { NOT: { id: options.ignorePaymentRequestId } }
              : {}),
          },
          select: {
            id: true,
            createdAt: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        }),
        this.prisma.paymentReceipt.findFirst({
          where: {
            receiptHash,
            ...(options?.ignorePaymentReceiptId
              ? { NOT: { id: options.ignorePaymentReceiptId } }
              : {}),
          },
          select: {
            id: true,
            createdAt: true,
            payment: {
              select: {
                member: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.paymentRequest.findFirst({
          where: {
            receiptDataUrl: dataUrlOrBase64,
            ...(options?.ignorePaymentRequestId
              ? { NOT: { id: options.ignorePaymentRequestId } }
              : {}),
          },
          select: {
            id: true,
            createdAt: true,
            member: {
              select: {
                name: true,
              },
            },
          },
        }),
        this.prisma.paymentReceipt.findFirst({
          where: {
            dataUrl: dataUrlOrBase64,
            ...(options?.ignorePaymentReceiptId
              ? { NOT: { id: options.ignorePaymentReceiptId } }
              : {}),
          },
          select: {
            id: true,
            createdAt: true,
            payment: {
              select: {
                member: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    if (requestByHash) {
      return {
        source: 'payment_request',
        memberName: requestByHash.member.name,
        createdAt: requestByHash.createdAt,
      };
    }

    if (receiptByHash) {
      return {
        source: 'payment_receipt',
        memberName: receiptByHash.payment.member.name,
        createdAt: receiptByHash.createdAt,
      };
    }

    if (requestByDataUrl) {
      return {
        source: 'payment_request_data_url',
        memberName: requestByDataUrl.member.name,
        createdAt: requestByDataUrl.createdAt,
      };
    }

    if (receiptByDataUrl) {
      return {
        source: 'payment_receipt_data_url',
        memberName: receiptByDataUrl.payment.member.name,
        createdAt: receiptByDataUrl.createdAt,
      };
    }

    return null;
  }
}
