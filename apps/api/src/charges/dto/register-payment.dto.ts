import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PaymentReceiptDto {
  @IsNotEmpty({ message: 'Nome do arquivo é obrigatório' })
  @IsString()
  @MaxLength(255, { message: 'Nome do arquivo deve ter no máximo 255 caracteres' })
  fileName: string;

  @IsNotEmpty({ message: 'Tipo do arquivo é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Tipo do arquivo deve ter no máximo 100 caracteres' })
  mimeType: string;

  @IsInt({ message: 'Tamanho do arquivo deve ser um número inteiro' })
  @Min(1, { message: 'Arquivo inválido' })
  @Max(5_242_880, { message: 'Comprovante deve ter no máximo 5MB' })
  sizeBytes: number;

  @IsNotEmpty({ message: 'Conteúdo do comprovante é obrigatório' })
  @IsString()
  @MaxLength(8_000_000, { message: 'Comprovante excede o tamanho máximo permitido' })
  dataUrl: string;
}

export class RegisterPaymentDto {
  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @Min(0.01, { message: 'Valor pago deve ser maior que zero' })
  amountPaid: number;

  @IsNotEmpty({ message: 'Data do pagamento é obrigatória' })
  @IsDateString({}, { message: 'Data do pagamento inválida' })
  paidAt: string;

  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentReceiptDto)
  receipt?: PaymentReceiptDto;
}
