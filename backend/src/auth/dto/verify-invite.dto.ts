import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyInviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code!: string;
}
