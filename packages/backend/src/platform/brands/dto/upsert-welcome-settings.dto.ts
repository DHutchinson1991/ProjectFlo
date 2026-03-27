import { IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class TrustBadgeDto {
  @IsString()
  icon: string;

  @IsString()
  text: string;
}

class SocialLinkDto {
  @IsString()
  platform: string;

  @IsString()
  url: string;
}

class TestimonialDto {
  @IsString()
  name: string;

  @IsString()
  text: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  image_url: string;
}

export class UpsertWelcomeSettingsDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  cta_text?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustBadgeDto)
  trust_badges?: TrustBadgeDto[];

  @IsOptional()
  @IsString()
  social_proof_text?: string;

  @IsOptional()
  @IsNumber()
  social_proof_start?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  social_links?: SocialLinkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestimonialDto)
  testimonials?: TestimonialDto[];

  @IsOptional()
  @IsString()
  time_estimate?: string;
}
