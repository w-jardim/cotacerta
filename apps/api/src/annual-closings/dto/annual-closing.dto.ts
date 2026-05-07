import { IsInt, Min, Max } from 'class-validator';

export class AnnualClosingDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  cycleYear: number;
}

export class ConfirmClosingDto {
  confirm: boolean;
}
