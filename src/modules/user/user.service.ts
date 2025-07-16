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
    try {
      const user = await this.userRepository.findOneBy({ telegramId: dto.telegramId });
      if (user) return user;
      return await this.userRepository.save({
        telegramId: dto.telegramId,
        fullName: dto.fullName,
        createdAt: new Date(),
      });
    } catch (error) {
      throw new Error('Foydalanuvchi ro‘yxatdan o‘tkazishda xato yuz berdi');
    }
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { telegramId }, relations: ['orders'] });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
      return user;
    } catch (error) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
      return user;
    } catch (error) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new Error('Foydalanuvchilarni olishda xato yuz berdi');
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    try {
      const result = await this.userRepository.update(id, dto);
      if (result.affected === 0) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
      return await this.findOne(id);
    } catch (error) {
      throw new NotFoundException('Foydalanuvchi ma‘lumotlarini yangilashda xato yuz berdi');
    }
  }

  async updatePhoneNumber(telegramId: string, phone: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { telegramId } });
      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
      user.phone = phone;
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      throw new Error('Telefon raqamini yangilashda xato yuz berdi');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException('Foydalanuvchi topilmadi');
      }
    } catch (error) {
      throw new Error('Foydalanuvchini o‘chirishda xato yuz berdi');
    }
  }
}