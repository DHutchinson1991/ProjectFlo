import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateCalendarSettingsDto {
    @IsOptional()
    @IsString()
    default_view?: string;

    @IsOptional()
    @IsInt()
    week_starts_on?: number;

    @IsOptional()
    @IsString()
    working_hours_start?: string;

    @IsOptional()
    @IsString()
    working_hours_end?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsBoolean()
    email_notifications?: boolean;

    @IsOptional()
    @IsBoolean()
    browser_notifications?: boolean;

    @IsOptional()
    @IsInt()
    default_reminder_minutes?: number;
}
