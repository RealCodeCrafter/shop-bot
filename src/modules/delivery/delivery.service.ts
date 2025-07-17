import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { OrderService } from '../order/order.service';
import { DELIVERY_STATUS } from '../../common/constants';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @Inject(forwardRef(() => OrderService)) private orderService: OrderService,
  ) {}

  async create(dto: CreateDeliveryDto): Promise<Delivery> {
    const order = await this.orderService.findOne(dto.orderId);
    if (!order) throw new NotFoundException(`Order ID ${dto.orderId} topilmadi`);

    const delivery = this.deliveryRepository.create({
      order,
      address: dto.address,
      status: DELIVERY_STATUS.PENDING,
      createdAt: new Date(),
    });

    return this.deliveryRepository.save(delivery);
  }

  async findAll(): Promise<Delivery[]> {
    return this.deliveryRepository.find({ relations: ['order', 'order.user'] });
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });
    if (!delivery) throw new NotFoundException(`Delivery ID ${id} topilmadi`);
    return delivery;
  }

  async update(id: number, dto: UpdateDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);
    if (dto.status) {
      delivery.status = dto.status;
      delivery.updatedAt = new Date();
      if (dto.status === DELIVERY_STATUS.DELIVERED) {
        delivery.deliveryDate = new Date();
      }
    }
    if (dto.trackingNumber) {
      delivery.trackingNumber = dto.trackingNumber;
    }
    return this.deliveryRepository.save(delivery);
  }

  async remove(id: number): Promise<void> {
    const result = await this.deliveryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Delivery ID ${id} topilmadi`);
    }
  }
}