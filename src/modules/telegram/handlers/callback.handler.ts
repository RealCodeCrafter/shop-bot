import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../../order/order.service';
import { FeedbackService } from '../../feedback/feedback.service';
import { PromocodeService } from '../../promocode/promocode.service';
import { PaymentService } from '../../payment/payment.service';
import { UserService } from '../../user/user.service';
import { TelegramService } from '../telegram.service';
import { formatProductMessage, formatCategoryList, formatProductList, formatUserList, formatOrderList, formatFeedbackList } from '../utils/helpers';

@Injectable()
export class CallbackHandler {
  private logger = new Logger(CallbackHandler.name);

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private feedbackService: FeedbackService,
    private promocodeService: PromocodeService,
    private paymentService: PaymentService,
    private userService: UserService,
    private telegramService: TelegramService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const telegramId = query.from.id.toString();
      const data = query.data;
      try {
        this.logger.log(`Processing callback: ${data} for telegramId: ${telegramId}`);
        if (data.startsWith('category_')) {
          const categoryId = parseInt(data.split('_')[1]);
          const startTime = Date.now();
          const products = await this.productService.findByCategory(categoryId);
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          const keyboard = products.map((prod) => [{ text: `${prod.name} - ${prod.price} so‘m`, callback_data: `product_${prod.id}` }]);
          await this.telegramService.sendMessage(chatId, 'Mahsulotlar:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('product_')) {
          const productId = parseInt(data.split('_')[1]);
          const startTime = Date.now();
          const product = await this.productService.findOne(productId);
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched productId: ${productId} in ${duration}ms`);
          await this.telegramService.sendPhoto(chatId, product.imageUrl, {
            caption: formatProductMessage(product),
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Savatchaga qo‘shish', callback_data: `addtocart_${productId}` }],
                [{ text: '⭐ Feedback qoldirish', callback_data: `feedback_${productId}` }],
              ],
            },
          });
        } else if (data.startsWith('addtocart_')) {
          const productId = parseInt(data.split('_')[1]);
          const startTime = Date.now();
          await this.cartService.addToCart({ telegramId, productId, quantity: 1 });
          const duration = Date.now() - startTime;
          this.logger.log(`Added to cart productId: ${productId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Mahsulot savatchaga qo‘shildi.');
        } else if (data === 'place_order') {
          const startTime = Date.now();
          const order = await this.orderService.createOrder(telegramId);
          const duration = Date.now() - startTime;
          this.logger.log(`Created order in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, `Buyurtma yaratildi. ID: ${order.id}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '💵 Click orqali to‘lash', callback_data: `pay_${order.id}_click` }],
                [{ text: '💵 Payme orqali to‘lash', callback_data: `pay_${order.id}_payme` }],
              ],
            },
          });
        } else if (data.startsWith('pay_')) {
          const [_, orderId, paymentType] = data.split('_');
          const startTime = Date.now();
          const paymentLink = await this.paymentService.generatePaymentLink(parseInt(orderId), paymentType);
          const duration = Date.now() - startTime;
          this.logger.log(`Generated payment link for orderId: ${orderId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, `To‘lov havolasi: ${paymentLink}`);
        } else if (data.startsWith('feedback_')) {
          const productId = parseInt(data.split('_')[1]);
          await this.telegramService.sendMessage(chatId, 'Reytingni tanlang:', {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⭐ 1', callback_data: `rate_${productId}_1` },
                  { text: '⭐ 2', callback_data: `rate_${productId}_2` },
                  { text: '⭐ 3', callback_data: `rate_${productId}_3` },
                  { text: '⭐ 4', callback_data: `rate_${productId}_4` },
                  { text: '⭐ 5', callback_data: `rate_${productId}_5` },
                ],
              ],
            },
          });
        } else if (data.startsWith('rate_')) {
          const [_, productId, rating] = data.split('_');
          await this.telegramService.sendMessage(chatId, 'Izoh yozing:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const startTime = Date.now();
              await this.feedbackService.create({
                telegramId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: msg.text,
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Created feedback for productId: ${productId} in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Feedback qabul qilindi!');
            } catch (error) {
              this.logger.error(`Error in feedback: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Feedback qoldirishda xato yuz berdi.');
            }
          });
        } else if (data === 'clear_cart') {
          const startTime = Date.now();
          await this.cartService.clearCart(telegramId);
          const duration = Date.now() - startTime;
          this.logger.log(`Cleared cart in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Savatcha tozalandi.');
        } else if (data === 'add_category') {
          await this.telegramService.sendMessage(chatId, 'Kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            await this.telegramService.sendMessage(chatId, 'Kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                const startTime = Date.now();
                await this.categoryService.create({ name, description: msgDesc.text });
                const duration = Date.now() - startTime;
                this.logger.log(`Created category in ${duration}ms`);
                await this.telegramService.sendMessage(chatId, 'Kategoriya qo‘shildi!');
              } catch (error) {
                this.logger.error(`Error in add_category: ${error.message}`);
                await this.telegramService.sendMessage(chatId, 'Kategoriya qo‘shishda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'view_categories') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, formatCategoryList(categories));
        } else if (data === 'edit_category') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          const keyboard = categories.map((cat) => [{ text: cat.name, callback_data: `edit_cat_${cat.id}` }]);
          await this.telegramService.sendMessage(chatId, 'Tahrir qilinadigan kategoriyani tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, 'Yangi kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            await this.telegramService.sendMessage(chatId, 'Yangi kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                const startTime = Date.now();
                await this.categoryService.update(categoryId, { name, description: msgDesc.text });
                const duration = Date.now() - startTime;
                this.logger.log(`Updated categoryId: ${categoryId} in ${duration}ms`);
                await this.telegramService.sendMessage(chatId, 'Kategoriya yangilandi!');
              } catch (error) {
                this.logger.error(`Error in edit_category: ${error.message}`);
                await this.telegramService.sendMessage(chatId, 'Kategoriyani tahrirlashda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'delete_category') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          const keyboard = categories.map((cat) => [{ text: cat.name, callback_data: `delete_cat_${cat.id}` }]);
          await this.telegramService.sendMessage(chatId, 'O‘chiriladigan kategoriyani tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          const startTime = Date.now();
          await this.categoryService.remove(categoryId);
          const duration = Date.now() - startTime;
          this.logger.log(`Deleted categoryId: ${categoryId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Kategoriya o‘chirildi.');
        } else if (data === 'add_product') {
          await this.telegramService.sendMessage(chatId, 'Mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              if (isNaN(parsedCategoryId)) {
                await this.telegramService.sendMessage(chatId, 'Kategoriya ID noto‘g‘ri.');
                return;
              }
              const startTime = Date.now();
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                await this.telegramService.sendMessage(chatId, `Kategoriya ID ${parsedCategoryId} topilmadi.`);
                return;
              }
              await this.productService.create({
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: 10,
                isActive: true,
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Created product in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Mahsulot qo‘shildi.');
            } catch (error) {
              this.logger.error(`Error in add_product: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Mahsulot qo‘shishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_products') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, formatProductList(products));
        } else if (data === 'edit_product') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          const keyboard = products.map((prod) => [{ text: prod.name, callback_data: `edit_prod_${prod.id}` }]);
          await this.telegramService.sendMessage(chatId, 'Tahrir qilinadigan mahsulotni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, 'Yangi mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              if (isNaN(parsedCategoryId)) {
                await this.telegramService.sendMessage(chatId, 'Kategoriya ID noto‘g‘ri.');
                return;
              }
              const startTime = Date.now();
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                await this.telegramService.sendMessage(chatId, `Kategoriya ID ${parsedCategoryId} topilmadi.`);
                return;
              }
              await this.productService.update(productId, {
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Updated productId: ${productId} in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Mahsulot yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_product: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Mahsulotni tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_product') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          const keyboard = products.map((prod) => [{ text: prod.name, callback_data: `delete_prod_${prod.id}` }]);
          await this.telegramService.sendMessage(chatId, 'O‘chiriladigan mahsulotni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          const startTime = Date.now();
          await this.productService.remove(productId);
          const duration = Date.now() - startTime;
          this.logger.log(`Deleted productId: ${productId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Mahsulot o‘chirildi.');
        } else if (data === 'view_users') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, formatUserList(users));
        } else if (data === 'edit_user') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          const keyboard = users.map((user) => [{ text: user.fullName, callback_data: `edit_user_${user.id}` }]);
          await this.telegramService.sendMessage(chatId, 'Tahrir qilinadigan foydalanuvchini tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_user_')) {
          const userId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, 'Yangi ism va telefon raqamini kiriting (ism;telefon):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [fullName, phone] = msg.text.split(';');
              const startTime = Date.now();
              await this.userService.update(userId, { fullName: fullName.trim(), phone: phone.trim() });
              const duration = Date.now() - startTime;
              this.logger.log(`Updated userId: ${userId} in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Foydalanuvchi ma‘lumotlari yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_user: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Foydalanuvchini tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_user') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          const keyboard = users.map((user) => [{ text: user.fullName, callback_data: `delete_user_${user.id}` }]);
          await this.telegramService.sendMessage(chatId, 'O‘chiriladigan foydalanuvchini tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_user_')) {
          const userId = parseInt(data.split('_')[2]);
          const startTime = Date.now();
          await this.userService.remove(userId);
          const duration = Date.now() - startTime;
          this.logger.log(`Deleted userId: ${userId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Foydalanuvchi o‘chirildi.');
        } else if (data === 'edit_order') {
          const startTime = Date.now();
          const orders = await this.orderService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${orders.length} orders in ${duration}ms`);
          const keyboard = orders.map((order) => [{ text: `ID: ${order.id}`, callback_data: `edit_order_${order.id}` }]);
          await this.telegramService.sendMessage(chatId, 'Tahrir qilinadigan buyurtmani tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_order_')) {
          const orderId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, 'Yangi statusni kiriting (pending, confirmed, shipped, delivered):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const startTime = Date.now();
              await this.orderService.updateStatus(orderId, msg.text);
              const duration = Date.now() - startTime;
              this.logger.log(`Updated orderId: ${orderId} in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Buyurtma statusi yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_order: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Buyurtma statusini yangilashda xato yuz berdi.');
            }
          });
        } else if (data === 'view_orders') {
          const startTime = Date.now();
          const orders = await this.orderService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${orders.length} orders in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, formatOrderList(orders));
        } else if (data === 'view_feedback') {
          const startTime = Date.now();
          const feedbacks = await this.feedbackService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${feedbacks.length} feedbacks in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, formatFeedbackList(feedbacks));
        } else if (data === 'delete_feedback') {
          const startTime = Date.now();
          const feedbacks = await this.feedbackService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${feedbacks.length} feedbacks in ${duration}ms`);
          const keyboard = feedbacks.map((fb) => [{ text: `ID: ${fb.id}, Reyting: ${fb.rating}`, callback_data: `delete_fb_${fb.id}` }]);
          await this.telegramService.sendMessage(chatId, 'O‘chiriladigan feedbackni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_fb_')) {
          const feedbackId = parseInt(data.split('_')[2]);
          const startTime = Date.now();
          await this.feedbackService.remove(feedbackId);
          const duration = Date.now() - startTime;
          this.logger.log(`Deleted feedbackId: ${feedbackId} in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, 'Feedback o‘chirildi.');
        } else if (data === 'create_promocode') {
          await this.telegramService.sendMessage(chatId, 'Promo-kod ma‘lumotlarini kiriting (kod;foiz;amal qilish muddati yyyy-mm-dd):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [code, discountPercent, validTill] = msg.text.split(';');
              const startTime = Date.now();
              await this.promocodeService.create({
                code: code.trim(),
                discountPercent: parseInt(discountPercent.trim()),
                validTill: new Date(validTill.trim()),
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Created promocode in ${duration}ms`);
              await this.telegramService.sendMessage(chatId, 'Promo-kod yaratildi.');
            } catch (error) {
              this.logger.error(`Error in create_promocode: ${error.message}`);
              await this.telegramService.sendMessage(chatId, 'Promo-kod yaratishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_stats') {
          const startTime = Date.now();
          const stats = await this.orderService.getStats();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched stats in ${duration}ms`);
          await this.telegramService.sendMessage(chatId, `Jami buyurtmalar: ${stats.totalOrders}\nJami summa: ${stats.totalAmount} so‘m`);
        }
      } catch (error) {
        this.logger.error(`Error in callback: ${error.message}`);
        await this.telegramService.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      }
    });
  }
}