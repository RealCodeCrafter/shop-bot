import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async registerUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ telegramId: dto.telegramId });
    if (user) return user;
    return this.userRepository.save({
      telegramId: dto.telegramId,
      fullName: dto.fullName,
      createdAt: new Date(),
    });
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { telegramId }, relations: ['orders'] });
    if (!user) {
      throw new NotFoundException(`Telegram ID ${telegramId} bo'yicha foydalanuvchi topilmadi`);
    }
    return user;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`ID ${id} bo'yicha foydalanuvchi topilmadi`);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const result = await this.userRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha foydalanuvchi topilmadi`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha foydalanuvchi topilmadi`);
    }
  }
}