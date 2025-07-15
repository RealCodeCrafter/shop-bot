import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UserService } from '../user/user.service';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { ORDER_STATUS } from '../../common/constants';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private userService: UserService,
    private cartService: CartService,
    private productService: ProductService,
  ) {}

  async createOrder(telegramId: string): Promise<Order> {
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const cartItems = await this.cartService.getCartItems(telegramId);
    if (!cartItems.length) throw new Error('Savatcha bo‘sh');

    const order = this.orderRepository.create({
      user,
      totalAmount: 0,
      status: ORDER_STATUS.PENDING,
      paymentType: null,
      createdAt: new Date(),
    });
    const savedOrder = await this.orderRepository.save(order);

    // Buyurtma elementlarini yaratish va totalAmount ni hisoblash
    let totalAmount = 0;
    const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await this.productService.findOne(item.product.id);
        if (!product) throw new NotFoundException(`Mahsulot ID ${item.product.id} topilmadi`);
        totalAmount += item.product.price * item.quantity;
        return this.orderItemRepository.save(
          this.orderItemRepository.create({
            order: savedOrder,
            product: item.product,
            quantity: item.quantity,
            price: item.product.price,
          }),
        );
      }),
    );
    savedOrder.totalAmount = totalAmount;
    await this.orderRepository.save(savedOrder);

    await this.cartService.clearCart(telegramId);

    savedOrder.orderItems = orderItems;
    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ relations: ['user', 'orderItems', 'orderItems.product'] });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id }, relations: ['user', 'orderItems', 'orderItems.product'] });
    if (!order) {
      throw new NotFoundException(`ID ${id} bo'yicha buyurtma topilmadi`);
    }
    return order;
  }

  async getUserOrders(telegramId: string): Promise<Order[]> {
    const user = await this.userService.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return this.orderRepository.find({ where: { user: { id: user.id } }, relations: ['orderItems', 'orderItems.product'] });
  }

  async updateStatus(id: number, status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS]): Promise<Order> {
    const result = await this.orderRepository.update(id, { status });
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha buyurtma topilmadi`);
    }
    return this.findOne(id);
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const result = await this.orderRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha buyurtma topilmadi`);
    }
    return this.findOne(id);
  }

  async getStats(): Promise<{ totalOrders: number; totalAmount: number }> {
    const orders = await this.orderRepository.find();
    return {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    };
  }
}