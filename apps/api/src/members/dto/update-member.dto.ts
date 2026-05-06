import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { MemberStatus } from '@prisma/client';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Telefone deve ter no máximo 15 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Chave Pix deve ter no máximo 100 caracteres' })
  pixKey?: string;

  @IsOptional()
  @IsInt({ message: 'Quantidade de cotas deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade de cotas deve ser no mínimo 1' })
  quotasCount?: number;

  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Status inválido' })
  status?: MemberStatus;
}
