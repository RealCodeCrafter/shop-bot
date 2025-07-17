export class CreateDeliveryDto {
  orderId: number;
  latitude: number;
  longitude: number;
  addressDetails?: string;
}