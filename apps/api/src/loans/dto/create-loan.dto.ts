import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  @IsNotEmpty({ message: 'Cotista é obrigatório' })
  @IsString()
  memberId: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Valor principal deve ser um número' })
  @Min(0.01, { message: 'Valor principal deve ser maior que zero' })
  principalAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Juros deve ser um número' })
  @Min(0, { message: 'Juros deve ser maior ou igual a zero' })
  interestRate?: number;

  @IsNotEmpty({ message: 'Data de concessão é obrigatória' })
  @IsDateString({}, { message: 'Data de concessão inválida' })
  grantedAt: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de vencimento inválida' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Observação deve ter no máximo 500 caracteres' })
  notes?: string;
}
