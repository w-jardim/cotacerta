import { IsEnum, IsOptional } from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class ListLoansDto {
  @IsOptional()
  @IsEnum(LoanStatus, { message: 'Status do empréstimo inválido' })
  status?: LoanStatus;
}
