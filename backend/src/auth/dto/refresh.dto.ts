import { IsNotEmpty, IsString } from 'class-validator';

export class refreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
