import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LoanPaymentMethod } from '@prisma/client';

export class RegisterLoanPaymentDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @Min(0.01, { message: 'Valor pago deve ser maior que zero' })
  amount: number;

  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(LoanPaymentMethod, { message: 'Método de pagamento inválido' })
  method: LoanPaymentMethod;

  @IsNotEmpty({ message: 'Data do pagamento é obrigatória' })
  @IsDateString({}, { message: 'Data do pagamento inválida' })
  paidAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Observação deve ter no máximo 500 caracteres' })
  notes?: string;
}
