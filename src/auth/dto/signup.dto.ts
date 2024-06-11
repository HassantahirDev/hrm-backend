

import {
    IsBase64,
    IsDate,
    IsEmail,
    IsEnum,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MinLength,
  } from '@nestjs/class-validator';
  import { Transform } from 'class-transformer';

  
  export class SignUpDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name: string;
  
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    username: string;
  
    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    email_mobile?: string;
  

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
  
    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    unique_code?: number;
  }
  