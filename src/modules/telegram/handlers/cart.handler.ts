import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CartService } from '../../cart/cart.service';

@Injectable()
export class CartHandler {
  private logger = new Logger(CartHandler.name);

  constructor(private cartService: CartService) {}

  handle(bot: TelegramBot) {
    bot.onText(/🛒 Savatcha/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing cart for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const cartItems = await this.cartService.getCartItems(telegramId);
        const duration = Date.now() - startTime;
        this.logger.log(`Fetched ${cartItems.length} cart items in ${duration}ms`);
        if (!cartItems.length) {
          await bot.sendMessage(chatId, 'Savatchangiz bo‘sh.');
          return;
        }
        let message = 'Savatchangiz:\n';
        let total = 0;
        cartItems.forEach((item) => {
          message += `${item.product.name} - ${item.quantity} dona, Narxi: ${item.product.price * item.quantity} so‘m\n`;
          total += item.product.price * item.quantity;
        });
        message += `Jami: ${total} so‘m`;
        await bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Buyurtma berish', callback_data: 'place_order' }],
              [{ text: '🗑️ Savatchani tozalash', callback_data: 'clear_cart' }],
            ],
          },
        });
      } catch (error) {
        this.logger.error(`Error in cart: ${error.message}`);
        await bot.sendMessage(chatId, 'Savatchani olishda xato yuz berdi.');
      }
    });
  }
}