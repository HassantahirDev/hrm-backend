import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class CreateWorkLogDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class TeamMemberDTO {
  @IsNotEmpty()
  @IsString()
  userId: string;
}

