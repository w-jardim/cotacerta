import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  cashGroupId?: string;
}

export class ContactAdminDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  body: string;
}

export class MarkReadDto {
  @IsOptional()
  @IsString({ each: true })
  ids?: string[];
}
