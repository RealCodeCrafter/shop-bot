import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  paymentType: string;
}