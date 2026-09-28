import { IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * A partial patch merged into `schools.settings`. Each Settings tab sends only its own slice, so an
 * absent key is left alone. The unions and ranges are enforced in the service (`SETTINGS_INVALID`),
 * because they live in JSONB rather than a DB enum — matching the mock's own rule.
 */
export class PatchSchoolSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  academicYear?: string;

  @IsOptional()
  @IsString()
  gradingScale?: string;

  @IsOptional()
  @IsString()
  termStructure?: string;

  @IsOptional()
  @IsNumber()
  passPercentage?: number;

  @IsOptional()
  @IsObject()
  notifications?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  security?: Record<string, unknown>;
}
