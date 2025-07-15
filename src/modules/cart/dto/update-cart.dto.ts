import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCartDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;
}