import {
  IsString,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateCashGroupDto {
  @IsString({ message: 'Nome deve ser um texto' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  description?: string;

  @IsInt({ message: 'Ano do ciclo deve ser um número inteiro' })
  @Min(2000, { message: 'Ano do ciclo deve ser maior ou igual a 2000' })
  cycleYear: number;

  @IsNumber({}, { message: 'Valor da cota deve ser um número' })
  @IsPositive({ message: 'Valor da cota deve ser maior que zero' })
  quotaValue: number;

  @IsInt({ message: 'Dia de vencimento deve ser um número inteiro' })
  @Min(1, { message: 'Dia de vencimento deve ser entre 1 e 28' })
  @Max(28, { message: 'Dia de vencimento deve ser entre 1 e 28' })
  dueDay: number;

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
  @IsBoolean()
  receivingPixEnabledForCharges?: boolean;

  @IsOptional()
  @IsBoolean()
  receivingPixEnabledForLoans?: boolean;

  @IsOptional()
  @IsString()
  receivingPixKey?: string;

  @IsOptional()
  @IsString()
  receivingPixKeyHolder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  receivingPixReceiverCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  receivingPixDescriptionPrefix?: string;

  @IsOptional()
  @IsString()
  receivingInstructions?: string;
}
