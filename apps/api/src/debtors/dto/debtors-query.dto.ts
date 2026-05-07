import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DebtorsQueryDto {
  @IsOptional()
  cashGroupId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Mês de referência deve ser um número inteiro' })
  @Min(1, { message: 'Mês de referência deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês de referência deve ser entre 1 e 12' })
  referenceMonth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ano de referência deve ser um número inteiro' })
  @Min(2020, { message: 'Ano de referência deve ser >= 2020' })
  @Max(2100, { message: 'Ano de referência deve ser <= 2100' })
  referenceYear?: number;
}
