import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterSchoolDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  schoolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminFirstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  adminLastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
