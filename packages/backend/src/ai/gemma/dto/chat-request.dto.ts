import { IsString, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;
}

export class GemmaChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsString()
  requestLabel?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsObject()
  responseFormat?: { type: 'json_object' } | { type: 'json_schema'; json_schema: { name: string; strict?: string; schema: Record<string, unknown> } };
}
