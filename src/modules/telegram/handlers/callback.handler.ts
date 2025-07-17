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
import { DeliveryService } from '../../delivery/delivery.service';
import { TelegramService } from '../telegram.service';
import { formatProductMessage, formatCategoryList, formatProductList, formatUserList, formatOrderList, formatFeedbackList, formatDeliveryList, formatStats } from '../utils/helpers';
import { PAYMENT_TYPE, ORDER_STATUS } from '../../../common/constants';

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
    private deliveryService: DeliveryService,
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
          const products = await this.productService.findByCategory(categoryId);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: `${prod.name} - ${prod.price} so‘m`, callback_data: `product_${prod.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '📦 Mahsulotlar:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('product_')) {
          const productId = parseInt(data.split('_')[1]);
          const product = await this.productService.findOne(productId);
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
          await this.cartService.addToCart({ telegramId, productId, quantity: 1 });
          await this.telegramService.sendMessage(chatId, '✅ Mahsulot savatchaga qo‘shildi.');
        } else if (data === 'place_order') {
          const order = await this.orderService.createOrder(telegramId);
          await this.telegramService.sendMessage(chatId, '📍 Iltimos, yetkazib berish manzilingizni yuboring:', {
            reply_markup: {
              keyboard: [[{ text: '📍 Manzilni yuborish', request_location: true }]],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          });
          bot.once('location', async (msg) => {
            try {
              await this.telegramService.sendMessage(chatId, '🏠 Iltimos, xonadon raqami, qavat yoki qo‘shimcha ma’lumotlarni kiriting (masalan: 12-xonadon, 3-qavat):', {
                reply_markup: { force_reply: true },
              });
              bot.once('message', async (msgDetails) => {
                try {
                  const delivery = await this.deliveryService.create({
                    orderId: order.id,
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude,
                    addressDetails: msgDetails.text,
                  });
                  const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} dona`).join(', ');
                  const message = `💳 Buyurtma yaratildi! Iltimos, quyidagi havola orqali to‘lovni amalga oshiring.\n` +
                                 `  📋 ID: ${order.id}\n` +
                                 `  👤 Foydalanuvchi: ${order.user?.fullName || 'Kiritilmagan'}\n` +
                                 `  📦 Mahsulotlar: ${items || 'N/A'}\n` +
                                 `  💸 Jami: ${order.totalAmount} so‘m\n` +
                                 `  📍 Manzil: (${delivery.latitude}, ${delivery.longitude})\n` +
                                 `  🏠 Qo‘shimcha: ${delivery.addressDetails || 'N/A'}\n` +
                                 `━━━━━━━━━━━━━━━`;
                  await this.telegramService.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '💵 Click orqali to‘lash', callback_data: `confirm_payment_${order.id}_click` }],
                        [{ text: '💵 Payme orqali to‘lash', callback_data: `confirm_payment_${order.id}_payme` }],
                      ],
                    },
                  });
                } catch (error) {
                  this.logger.error(`Error in delivery: ${error.message}`);
                  await this.telegramService.sendMessage(chatId, '❌ Yetkazib berish ma’lumotlarini saqlashda xato yuz berdi.');
                }
              });
            } catch (error) {
              this.logger.error(`Error in delivery: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Yetkazib berish manzilini saqlashda xato yuz berdi.');
            }
          });
        } else if (data.startsWith('confirm_payment_')) {
          const parts = data.split('_');
          const orderId = parseInt(parts[2], 10);
          const paymentType = parts[3];

          this.logger.log(`Confirming payment for orderId: ${orderId}, paymentType: ${paymentType}`);

          if (![PAYMENT_TYPE.CLICK, PAYMENT_TYPE.PAYME].includes(paymentType)) {
            this.logger.error(`Invalid payment type: ${paymentType}`);
            await this.telegramService.sendMessage(chatId, '❌ Noto‘g‘ri to‘lov turi.');
            return;
          }

          const order = await this.orderService.findOne(orderId);
          if (!order) {
            this.logger.error(`Order not found for ID: ${orderId}`);
            await this.telegramService.sendMessage(chatId, '❌ Buyurtma topilmadi.');
            return;
          }

          const delivery = await this.deliveryService.findOneByOrderId(order.id);
          if (!delivery) {
            this.logger.error(`Delivery not found for order ID: ${orderId}`);
            await this.telegramService.sendMessage(chatId, '❌ Yetkazib berish ma’lumotlari topilmadi.');
            return;
          }

          await this.orderService.updateStatus(orderId, ORDER_STATUS.PAID);
          await this.orderService.update(orderId, { paymentType });

          const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} dona`).join(', ');

          const message = `✅ Buyurtma tasdiqlandi!\n` +
                         `  📋 ID: ${order.id}\n` +
                         `  👤 Foydalanuvchi: ${order.user?.fullName || 'Kiritilmagan'}\n` +
                         `  📦 Mahsulotlar: ${items || 'N/A'}\n` +
                         `  💸 Jami: ${order.totalAmount} so‘m\n` +
                         `  📊 Status: ${ORDER_STATUS.PAID}\n` +
                         `  💵 To‘lov turi: ${paymentType}\n` +
                         `  📍 Manzil: (${delivery.latitude}, ${delivery.longitude})\n` +
                         `  🏠 Qo‘shimcha: ${delivery.addressDetails || 'N/A'}\n` +
                         `  🚚 Yetkazib beruvchi: ${delivery.courierName || 'N/A'}\n` +
                         `  📞 Telefon: ${delivery.courierPhone || 'N/A'}\n` +
                         `  📅 Taxminiy yetkazib berish sanasi: ${delivery.deliveryDate?.toLocaleString('uz-UZ') || 'N/A'}\n` +
                         `━━━━━━━━━━━━━━━`;

          await this.telegramService.sendMessage(chatId, message, { parse_mode: 'HTML' });

          const adminChatId = '5661241603';
          await this.telegramService.sendMessage(adminChatId, message, { parse_mode: 'HTML' });
        } else if (data.startsWith('feedback_')) {
          const productId = parseInt(data.split('_')[1]);
          await this.telegramService.sendMessage(chatId, '⭐ Reytingni tanlang:', {
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
          await this.telegramService.sendMessage(chatId, '💬 Izoh yozing:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              await this.feedbackService.create({
                telegramId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: msg.text,
              });
              await this.telegramService.sendMessage(chatId, '✅ Feedback qabul qilindi!');
            } catch (error) {
              this.logger.error(`Error in feedback: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Feedback qoldirishda xato yuz berdi.');
            }
          });
        } else if (data === 'clear_cart') {
          await this.cartService.clearCart(telegramId);
          await this.telegramService.sendMessage(chatId, '🗑 Savatcha tozalandi.');
        } else if (data === 'add_category') {
          await this.telegramService.sendMessage(chatId, '📋 Kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            await this.telegramService.sendMessage(chatId, '📝 Kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                await this.categoryService.create({ name, description: msgDesc.text });
                await this.telegramService.sendMessage(chatId, '✅ Kategoriya qo‘shildi!');
              } catch (error) {
                this.logger.error(`Error in add_category: ${error.message}`);
                await this.telegramService.sendMessage(chatId, '❌ Kategoriya qo‘shishda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'view_categories') {
          const categories = await this.categoryService.findAll();
          await this.telegramService.sendMessage(chatId, formatCategoryList(categories), { parse_mode: 'HTML' });
        } else if (data === 'edit_category') {
          const categories = await this.categoryService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = categories.map((cat) => [
            { text: cat.name, callback_data: `edit_cat_${cat.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '✏️ Tahrir qilinadigan kategoriyani tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, '📋 Yangi kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            await this.telegramService.sendMessage(chatId, '📝 Yangi kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                await this.categoryService.update(categoryId, { name, description: msgDesc.text });
                await this.telegramService.sendMessage(chatId, '✅ Kategoriya yangilandi!');
              } catch (error) {
                this.logger.error(`Error in edit_category: ${error.message}`);
                await this.telegramService.sendMessage(chatId, '❌ Kategoriyani tahrirlashda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'delete_category') {
          const categories = await this.categoryService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = categories.map((cat) => [
            { text: cat.name, callback_data: `delete_cat_${cat.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '🗑 O‘chiriladigan kategoriyani tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          await this.categoryService.remove(categoryId);
          await this.telegramService.sendMessage(chatId, '✅ Kategoriya o‘chirildi.');
        } else if (data === 'add_product') {
          await this.telegramService.sendMessage(chatId, '📦 Mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID;ombordagi soni):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId, stock] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              const parsedStock = parseInt(stock.trim());
              if (isNaN(parsedCategoryId) || isNaN(parsedStock)) {
                await this.telegramService.sendMessage(chatId, '❌ Kategoriya ID yoki ombor soni noto‘g‘ri.');
                return;
              }
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                await this.telegramService.sendMessage(chatId, `❌ Kategoriya ID ${parsedCategoryId} topilmadi.`);
                return;
              }
              await this.productService.create({
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: parsedStock,
                isActive: true,
              });
              await this.telegramService.sendMessage(chatId, '✅ Mahsulot qo‘shildi.');
            } catch (error) {
              this.logger.error(`Error in add_product: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Mahsulot qo‘shishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_products') {
          const products = await this.productService.findAll();
          await this.telegramService.sendMessage(chatId, formatProductList(products), { parse_mode: 'HTML' });
        } else if (data === 'edit_product') {
          const products = await this.productService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: prod.name, callback_data: `edit_prod_${prod.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '✏️ Tahrir qilinadigan mahsulotni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, '📦 Yangi mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID;ombordagi soni):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId, stock] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              const parsedStock = parseInt(stock.trim());
              if (isNaN(parsedCategoryId) || isNaN(parsedStock)) {
                await this.telegramService.sendMessage(chatId, '❌ Kategoriya ID yoki ombor soni noto‘g‘ri.');
                return;
              }
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                await this.telegramService.sendMessage(chatId, `❌ Kategoriya ID ${parsedCategoryId} topilmadi.`);
                return;
              }
              await this.productService.update(productId, {
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: parsedStock,
              });
              await this.telegramService.sendMessage(chatId, '✅ Mahsulot yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_product: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Mahsulotni tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_product') {
          const products = await this.productService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: prod.name, callback_data: `delete_prod_${prod.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '🗑 O‘chiriladigan mahsulotni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          await this.productService.remove(productId);
          await this.telegramService.sendMessage(chatId, '✅ Mahsulot o‘chirildi.');
        } else if (data === 'view_users') {
          const users = await this.userService.findAll();
          await this.telegramService.sendMessage(chatId, formatUserList(users), { parse_mode: 'HTML' });
        } else if (data === 'edit_user') {
          const users = await this.userService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = users.map((user) => [
            { text: user.fullName || 'Kiritilmagan', callback_data: `edit_user_${user.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '✏️ Tahrir qilinadigan foydalanuvchini tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_user_')) {
          const userId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, '👤 Yangi ism va telefon raqamini kiriting (ism;telefon):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [fullName, phone] = msg.text.split(';');
              await this.userService.update(userId, { fullName: fullName.trim(), phone: phone.trim() });
              await this.telegramService.sendMessage(chatId, '✅ Foydalanuvchi ma‘lumotlari yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_user: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Foydalanuvchini tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_user') {
          const users = await this.userService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = users.map((user) => [
            { text: user.fullName || 'Kiritilmagan', callback_data: `delete_user_${user.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '🗑 O‘chiriladigan foydalanuvchini tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_user_')) {
          const userId = parseInt(data.split('_')[2]);
          await this.userService.remove(userId);
          await this.telegramService.sendMessage(chatId, '✅ Foydalanuvchi o‘chirildi.');
        } else if (data.startsWith('view_orders_')) {
          const page = parseInt(data.split('_')[2]) || 1;
          const orders = await this.orderService.getUserOrders(telegramId, page, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
          if (orders.length === 10) {
            keyboard.push([{ text: '➡️ Keyingi sahifa', callback_data: `view_orders_${page + 1}` }]);
          }
          if (page > 1) {
            keyboard.push([{ text: '⬅️ Oldingi sahifa', callback_data: `view_orders_${page - 1}` }]);
          }
          await this.telegramService.sendMessage(chatId, formatOrderList(orders), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'view_orders') {
          const orders = await this.orderService.getUserOrders(telegramId, 1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = orders.length === 10 ? [[{ text: '➡️ Keyingi sahifa', callback_data: 'view_orders_2' }]] : [];
          await this.telegramService.sendMessage(chatId, formatOrderList(orders), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data.startsWith('view_deliveries_')) {
          const page = parseInt(data.split('_')[2]) || 1;
          const deliveries = await this.deliveryService.findAll(page, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
          if (deliveries.length === 10) {
            keyboard.push([{ text: '➡️ Keyingi sahifa', callback_data: `view_deliveries_${page + 1}` }]);
          }
          if (page > 1) {
            keyboard.push([{ text: '⬅️ Oldingi sahifa', callback_data: `view_deliveries_${page - 1}` }]);
          }
          await this.telegramService.sendMessage(chatId, formatDeliveryList(deliveries), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'view_deliveries') {
          const deliveries = await this.deliveryService.findAll(1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = deliveries.length === 10 ? [[{ text: '➡️ Keyingi sahifa', callback_data: 'view_deliveries_2' }]] : [];
          await this.telegramService.sendMessage(chatId, formatDeliveryList(deliveries), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'edit_delivery') {
          const deliveries = await this.deliveryService.findAll(1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = deliveries.map((delivery) => [
            { text: `📋 ID: ${delivery.id}`, callback_data: `edit_delivery_${delivery.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '✏️ Tahrir qilinadigan yetkazib berishni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_delivery_')) {
          const deliveryId = parseInt(data.split('_')[2]);
          await this.telegramService.sendMessage(chatId, '📊 Yangi statusni kiriting (pending, in_transit, delivered, cancelled):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              await this.deliveryService.update(deliveryId, { status: msg.text });
              await this.telegramService.sendMessage(chatId, '✅ Yetkazib berish statusi yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_delivery: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Yetkazib berish statusini yangilashda xato yuz berdi.');
            }
          });
        } else if (data === 'view_feedback') {
          const feedbacks = await this.feedbackService.findAll();
          await this.telegramService.sendMessage(chatId, formatFeedbackList(feedbacks), { parse_mode: 'HTML' });
        } else if (data === 'delete_feedback') {
          const feedbacks = await this.feedbackService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = feedbacks.map((fb) => [
            { text: `📋 ID: ${fb.id}, Reyting: ${fb.rating}`, callback_data: `delete_fb_${fb.id}` },
          ]);
          await this.telegramService.sendMessage(chatId, '🗑 O‘chiriladigan feedbackni tanlang:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_fb_')) {
          const feedbackId = parseInt(data.split('_')[2]);
          await this.feedbackService.remove(feedbackId);
          await this.telegramService.sendMessage(chatId, '✅ Feedback o‘chirildi.');
        } else if (data === 'create_promocode') {
          await this.telegramService.sendMessage(chatId, '🎟 Promo-kod ma‘lumotlarini kiriting (kod;foiz;amal qilish muddati yyyy-mm-dd):', { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [code, discountPercent, validTill] = msg.text.split(';');
              await this.promocodeService.create({
                code: code.trim(),
                discountPercent: parseInt(discountPercent.trim()),
                validTill: new Date(validTill.trim()),
              });
              await this.telegramService.sendMessage(chatId, '✅ Promo-kod yaratildi.');
            } catch (error) {
              this.logger.error(`Error in create_promocode: ${error.message}`);
              await this.telegramService.sendMessage(chatId, '❌ Promo-kod yaratishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_stats') {
          const stats = await this.orderService.getStats();
          const message = formatStats(stats);
          await this.telegramService.sendMessage(chatId, message, { parse_mode: 'HTML' });
        }
      } catch (error) {
        this.logger.error(`Error in callback: ${error.message}`);
        await this.telegramService.sendMessage(chatId, '❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      } finally {
        try {
          await bot.answerCallbackQuery(query.id);
        } catch (err) {
          this.logger.error(`Error in answerCallbackQuery: ${err.message}`);
        }
      }
    });
  }
}