import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateAIConfigDto {
  @IsOptional()
  @IsBoolean({ message: 'aiEnabled deve ser um booleano' })
  aiEnabled?: boolean;

  @IsOptional()
  @IsIn(['local', 'openai'], { message: 'provider deve ser "local" ou "openai"' })
  provider?: string;
}
