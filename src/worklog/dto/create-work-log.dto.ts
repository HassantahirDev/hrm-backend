import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class CreateWorkLogDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
