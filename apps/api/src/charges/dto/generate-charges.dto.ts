import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class GenerateChargesDto {
  @IsNotEmpty({ message: 'Mês de referência é obrigatório' })
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  referenceMonth: number;

  @IsNotEmpty({ message: 'Ano de referência é obrigatório' })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser entre 2020 e 2100' })
  @Max(2100, { message: 'Ano deve ser entre 2020 e 2100' })
  referenceYear: number;
}
