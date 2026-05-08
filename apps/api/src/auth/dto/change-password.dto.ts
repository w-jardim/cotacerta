import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
