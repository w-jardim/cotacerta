import { IsEmail } from 'class-validator';

export class CreateMemberAccessDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}
