import { IsOptional, IsNumber, Min } from 'class-validator';

export class MarkPaidDto {
  @IsOptional()
  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  amountPaid?: number;
}
