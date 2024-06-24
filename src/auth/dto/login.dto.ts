import { Transform } from '@nestjs/class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  isNotEmpty,
} from '@nestjs/class-validator';

export class LogInDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  email_mobile: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  newEmail: string;

  @IsNotEmpty()
  @IsString()
  verifyOTP: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  lat: string;

  @IsOptional()
  @IsString()
  lng: string;



  @IsNotEmpty()
  @IsString()
  @Matches(
  /^(?=[A-Za-z0-9@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]+$)(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]).{8,}$/,
  {
      message:
      'Password should contain at least 8 characters with 1 special character and 1 number',
  }
     )
  password: string;
}

export class TeamDTO{
  @IsNotEmpty()
  @IsString()
  departmentId: string
}