import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty({ message: 'ID da caixinha é obrigatório' })
  @IsString()
  cashGroupId: string;

  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Telefone deve ter no máximo 15 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Chave Pix deve ter no máximo 100 caracteres' })
  pixKey?: string;

  @IsNotEmpty({ message: 'Quantidade de cotas é obrigatória' })
  @IsInt({ message: 'Quantidade de cotas deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade de cotas deve ser no mínimo 1' })
  quotasCount: number;
}
