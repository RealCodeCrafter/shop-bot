import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}