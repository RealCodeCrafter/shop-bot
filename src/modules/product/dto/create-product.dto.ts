import { IsString, IsNumber, IsNotEmpty, IsBoolean, IsUrl } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsUrl()
  imageUrl: string;

  @IsNumber()
  stock: number;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}