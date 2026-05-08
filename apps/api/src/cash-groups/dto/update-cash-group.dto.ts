import {
  IsString,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  Max,
  IsNumber,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { CashGroupStatus } from '@prisma/client';

export class UpdateCashGroupDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser um texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valor da cota deve ser um número' })
  @IsPositive({ message: 'Valor da cota deve ser maior que zero' })
  quotaValue?: number;

  @IsOptional()
  @IsInt({ message: 'Dia de vencimento deve ser um número inteiro' })
  @Min(1, { message: 'Dia de vencimento deve ser entre 1 e 28' })
  @Max(28, { message: 'Dia de vencimento deve ser entre 1 e 28' })
  dueDay?: number;

  @IsOptional()
  @IsInt({ message: 'Máximo de cotas por membro deve ser um número inteiro' })
  @Min(1, { message: 'Mínimo de 1 cota por membro' })
  @Max(10, { message: 'Máximo de 10 cotas por membro' })
  maxQuotasPerMember?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Taxa de juros deve ser um número' })
  @Min(0, { message: 'Taxa de juros não pode ser negativa' })
  @Max(100, { message: 'Taxa de juros não pode ser maior que 100' })
  defaultLoanInterestRate?: number;

  @IsOptional()
  @IsEnum(CashGroupStatus, { message: 'Status inválido' })
  status?: CashGroupStatus;

  @IsOptional()
  @IsString()
  receivingPixKey?: string;

  @IsOptional()
  @IsString()
  receivingPixKeyHolder?: string;

  @IsOptional()
  @MaxLength(15)
  @IsString()
  receivingPixReceiverCity?: string;

  @IsOptional()
  @MaxLength(72)
  @IsString()
  receivingPixDescriptionPrefix?: string;

  @IsOptional()
  @IsBoolean()
  receivingPixEnabledForCharges?: boolean;

  @IsOptional()
  @IsBoolean()
  receivingPixEnabledForLoans?: boolean;

  @IsOptional()
  @IsString()
  receivingInstructions?: string;
}
