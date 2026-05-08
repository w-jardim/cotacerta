import { BadRequestException, Injectable } from '@nestjs/common';

const PIX_GUI = 'br.gov.bcb.pix';
const PIX_COUNTRY_CODE = 'BR';
const PIX_CURRENCY_CODE = '986';
const PIX_MERCHANT_CATEGORY_CODE = '0000';
const DEFAULT_RECEIVER_CITY = 'SAO PAULO';

export interface GeneratePixPayloadInput {
  pixKey: string;
  receiverName: string;
  receiverCity?: string | null;
  amount: number;
  description?: string | null;
  txid?: string | null;
}

export interface PixPayloadResult {
  copyPasteCode: string;
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  amount: number;
  description: string | null;
  txid: string | null;
}

@Injectable()
export class PixPayloadService {
  generate(input: GeneratePixPayloadInput): PixPayloadResult {
    const pixKey = this.cleanText(input.pixKey, 77);
    const receiverName = this.cleanText(input.receiverName, 25);
    const receiverCity = this.cleanText(
      input.receiverCity || DEFAULT_RECEIVER_CITY,
      15,
    );
    const amount = Number(input.amount.toFixed(2));
    const description = input.description
      ? this.cleanText(input.description, 72)
      : null;
    const txid = input.txid ? this.cleanText(input.txid, 25) : null;

    if (!pixKey) {
      throw new BadRequestException('A chave Pix configurada da caixinha é obrigatória.');
    }

    if (!receiverName) {
      throw new BadRequestException(
        'O nome do recebedor configurado da caixinha é obrigatório.',
      );
    }

    if (!receiverCity) {
      throw new BadRequestException(
        'A cidade do recebedor configurada da caixinha é obrigatória.',
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('O valor do Pix deve ser maior que zero.');
    }

    const merchantAccountInfo = this.field(
      '26',
      this.field('00', PIX_GUI) +
        this.field('01', pixKey) +
        (description ? this.field('02', description) : ''),
    );

    const additionalData = this.field('62', this.field('05', txid || '***'));
    const amountValue = amount.toFixed(2);

    const payloadWithoutCrc =
      this.field('00', '01') +
      merchantAccountInfo +
      this.field('52', PIX_MERCHANT_CATEGORY_CODE) +
      this.field('53', PIX_CURRENCY_CODE) +
      this.field('54', amountValue) +
      this.field('58', PIX_COUNTRY_CODE) +
      this.field('59', receiverName) +
      this.field('60', receiverCity) +
      additionalData +
      '6304';

    const crc = this.crc16(payloadWithoutCrc);
    const copyPasteCode = `${payloadWithoutCrc}${crc}`;

    return {
      copyPasteCode,
      pixKey,
      receiverName,
      receiverCity,
      amount,
      description,
      txid,
    };
  }

  private field(id: string, value: string) {
    return `${id}${value.length.toString().padStart(2, '0')}${value}`;
  }

  private cleanText(value: string, maxLength: number) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 $%*+\-./:_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
      .slice(0, maxLength);
  }

  private crc16(payload: string) {
    let crc = 0xffff;

    for (let index = 0; index < payload.length; index += 1) {
      crc ^= payload.charCodeAt(index) << 8;

      for (let bit = 0; bit < 8; bit += 1) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }

        crc &= 0xffff;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}
