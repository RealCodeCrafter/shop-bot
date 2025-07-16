import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';
import { FeedbackService } from '../feedback/feedback.service';
import { PromocodeService } from '../promocode/promocode.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private logger = new Logger(TelegramService.name);
  private readonly adminTelegramId = '5661241603';

  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private feedbackService: FeedbackService,
    private promocodeService: PromocodeService,
    private paymentService: PaymentService,
  ) {
    this.bot = new TelegramBot('7942071036:AAFz_o_p2p2o-Gq-1C1YZMQSdODCHJiu2dY', {
      polling: false,
    });
    this.setupWebhook();
    this.setupCommands();
  }

  private async setupWebhook() {
    const webhookUrl = 'https://telegram-shop-bot-production.up.railway.app/telegram/webhook';
    try {
      this.logger.log(`Setting webhook to ${webhookUrl}`);
      const startTime = Date.now();
      await this.bot.setWebHook(webhookUrl);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook successfully set to ${webhookUrl} in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  private setupCommands() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
      try {
        this.logger.log(`Processing /start for telegramId: ${telegramId}, fullName: ${fullName}`);
        const startTime = Date.now();
        await this.userService.registerUser({ telegramId, fullName });
        const duration = Date.now() - startTime;
        this.logger.log(`User registered successfully for telegramId: ${telegramId} in ${duration}ms`);
        this.bot.sendMessage(chatId, `Xush kelibsiz, ${fullName}! 🛒 Do‘konimizda sizni ko'rganimizdan xursandmiz! Iltimos, telefon raqamingizni yuboring:`, {
          reply_markup: {
            keyboard: [
              [{ text: '📞 Telefon raqamni yuborish', request_contact: true }],
              [{ text: '📁 Kategoriyalar' }, { text: '🛒 Savatcha' }],
              [{ text: '👤 Profilim' }, { text: '🕘 Buyurtma tarixi' }],
              [{ text: 'ℹ️ Biz haqimizda' }, { text: '🆘 Yordam' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      } catch (error) {
        this.logger.error(`Error in /start: ${error.message}`, error.stack);
        this.bot.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      }
    });

    this.bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const phone = msg.contact.phone_number;
  this.logger.log(`Received phone number for telegramId: ${telegramId}, phone: ${phone}`);
  const startTime = Date.now();
  try {
    const user = await this.userService.updatePhoneNumber(telegramId, phone);
    const duration = Date.now() - startTime;
    this.logger.log(`Updated phone number for telegramId: ${telegramId} in ${duration}ms`);
    await this.bot.sendMessage(chatId, 'Telefon raqamingiz saqlandi! Endi do‘konimizdan bemalol foydalanishingiz mumkin.', {
      reply_markup: {
        keyboard: [
          [{ text: '📁 Kategoriyalar' }, { text: '🛒 Savatcha' }],
          [{ text: '👤 Profilim' }, { text: '🕘 Buyurtma tarixi' }],
          [{ text: 'ℹ️ Biz haqimizda' }, { text: '🆘 Yordam' }],
        ],
        resize_keyboard: true,
      },
    });
  } catch (error) {
    this.logger.error(`Error saving phone number for telegramId: ${telegramId}, phone: ${phone}, error: ${error.message}`, error.stack);
    if (error instanceof NotFoundException) {
      await this.bot.sendMessage(chatId, 'Foydalanuvchi topilmadi. Iltimos, /start buyrug‘i bilan qayta urinib ko‘ring.');
    } else {
      await this.bot.sendMessage(chatId, `Telefon raqamini saqlashda xato yuz berdi: ${error.message}. Iltimos, keyinroq urinib ko‘ring.`);
    }
  }
});

    this.bot.onText(/\/about/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 'ℹ️ Biz haqimizda\nBiz onlayn do‘konmiz, sifatli mahsulotlar va tezkor xizmat taklif qilamiz!\nAloqa: @YourShopSupport\nVeb-sayt: https://yourshop.uz');
    });

    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `🆘 Yordam\nSavollaringiz bo‘lsa, admin bilan bog‘laning: @${this.adminTelegramId}\nYoki xabar yozing:`, {
        reply_markup: { force_reply: true },
      });
      this.bot.once('message', async (msg) => {
        try {
          await this.bot.sendMessage(this.adminTelegramId, `Yordam so‘rovi:\nFoydalanuvchi: ${msg.from.id}\nXabar: ${msg.text}`);
          this.bot.sendMessage(chatId, 'Sizning xabaringiz adminga yuborildi. Tez orada javob olasiz!');
        } catch (error) {
          this.logger.error(`Error sending help request: ${error.message}`, error.stack);
          this.bot.sendMessage(chatId, 'Xabar yuborishda xato yuz berdi.');
        }
      });
    });

    this.bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        this.logger.log(`Processing /admin for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const user = await this.userService.findByTelegramId(telegramId);
        const duration = Date.now() - startTime;
        this.logger.log(`User fetched for /admin in ${duration}ms`);
        if (!user || !user.isAdmin) {
          this.logger.warn(`Access denied for /admin, telegramId: ${telegramId}, isAdmin: ${user?.isAdmin}`);
          this.bot.sendMessage(chatId, 'Sizda admin huquqlari yo‘q.');
          return;
        }
        this.bot.sendMessage(chatId, 'Admin paneli', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📋 Kategoriyalarni ko‘rish', callback_data: 'view_categories' },
                { text: '➕ Kategoriya qo‘shish', callback_data: 'add_category' },
                { text: '✏️ Kategoriya tahrirlash', callback_data: 'edit_category' },
                { text: '🗑️ Kategoriya o‘chirish', callback_data: 'delete_category' },
              ],
              [
                { text: '📋 Mahsulotlarni ko‘rish', callback_data: 'view_products' },
                { text: '➕ Mahsulot qo‘shish', callback_data: 'add_product' },
                { text: '✏️ Mahsulot tahrirlash', callback_data: 'edit_product' },
                { text: '🗑️ Mahsulot o‘chirish', callback_data: 'delete_product' },
              ],
              [
                { text: '👥 Foydalanuvchilarni ko‘rish', callback_data: 'view_users' },
                { text: '✏️ Foydalanuvchi tahrirlash', callback_data: 'edit_user' },
                { text: '🗑️ Foydalanuvchi o‘chirish', callback_data: 'delete_user' },
              ],
              [
                { text: '📦 Buyurtmalar', callback_data: 'view_orders' },
                { text: '✏️ Buyurtma tahrirlash', callback_data: 'edit_order' },
              ],
              [
                { text: '🗒️ Feedbacklar', callback_data: 'view_feedback' },
                { text: '🗑️ Feedback o‘chirish', callback_data: 'delete_feedback' },
              ],
              [{ text: '🎟️ Promo-kod yaratish', callback_data: 'create_promocode' }],
              [{ text: '📊 Statistika', callback_data: 'view_stats' }],
            ],
          },
        });
      } catch (error) {
        this.logger.error(`Error in /admin: ${error.message}`, error.stack);
        this.bot.sendMessage(chatId, 'Admin panelni ochishda xato yuz berdi.');
      }
    });

    this.bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const text = msg.text;
  if (!text) {
    this.logger.log(`Ignoring message without text from telegramId: ${telegramId}`);
    return; // Agar text bo‘lmasa, hech narsa qilmaymiz
  }
  try {
    this.logger.log(`Processing message: ${text} from telegramId: ${telegramId}`);
    if (text === '📁 Kategoriyalar') {
      const startTime = Date.now();
      const categories = await this.categoryService.findAll();
      const duration = Date.now() - startTime;
      this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
      const keyboard = categories.map((cat) => [{ text: cat.name, callback_data: `category_${cat.id}` }]);
      this.bot.sendMessage(chatId, 'Kategoriyalarni tanlang:', {
        reply_markup: { inline_keyboard: keyboard },
      });
    } else if (text === '🛒 Savatcha') {
      const startTime = Date.now();
      const cartItems = await this.cartService.getCartItems(telegramId);
      const duration = Date.now() - startTime;
      this.logger.log(`Fetched ${cartItems.length} cart items in ${duration}ms`);
      if (!cartItems.length) {
        this.bot.sendMessage(chatId, 'Savatchangiz bo‘sh.');
        return;
      }
      let message = 'Savatchangiz:\n';
      let total = 0;
      cartItems.forEach((item) => {
        message += `${item.product.name} - ${item.quantity} dona, Narxi: ${item.product.price * item.quantity} so‘m\n`;
        total += item.product.price * item.quantity;
      });
      message += `Jami: ${total} so‘m`;
      this.bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Buyurtma berish', callback_data: 'place_order' }],
            [{ text: '🗑️ Savatchani tozalash', callback_data: 'clear_cart' }],
          ],
        },
      });
    } else if (text === '👤 Profilim') {
      const startTime = Date.now();
      const user = await this.userService.findByTelegramId(telegramId);
      const duration = Date.now() - startTime;
      this.logger.log(`Fetched user profile in ${duration}ms`);
      this.bot.sendMessage(chatId, `Ism: ${user.fullName}\nTelefon: ${user.phone || 'Kiritilmagan'}\nBuyurtmalar soni: ${user.orders.length}`);
    } else if (text === '🕘 Buyurtma tarixi') {
      const startTime = Date.now();
      const orders = await this.orderService.getUserOrders(telegramId);
      const duration = Date.now() - startTime;
      this.logger.log(`Fetched ${orders.length} orders in ${duration}ms`);
      if (!orders.length) {
        this.bot.sendMessage(chatId, 'Sizda hali buyurtmalar yo‘q.');
        return;
      }
      let message = 'Buyurtma tarixingiz:\n';
      orders.forEach((order) => {
        message += `ID: ${order.id}, Jami: ${order.totalAmount} so‘m, Status: ${order.status}\n`;
      });
      this.bot.sendMessage(chatId, message);
    } else if (text === 'ℹ️ Biz haqimizda') {
      this.bot.sendMessage(chatId, 'ℹ️ Biz haqimizda\nBiz onlayn do‘konmiz, sifatli mahsulotlar va tezkor xizmat taklif qilamiz!\nAloqa: @YourShopSupport\nVeb-sayt: https://yourshop.uz');
    } else if (text === '🆘 Yordam') {
      this.bot.sendMessage(chatId, `🆘 Yordam\nSavollaringiz bo‘lsa, admin bilan bog‘laning: @${this.adminTelegramId}\nYoki xabar yozing:`, {
        reply_markup: { force_reply: true },
      });
      this.bot.once('message', async (msg) => {
        try {
          await this.bot.sendMessage(this.adminTelegramId, `Yordam so‘rovi:\nFoydalanuvchi: ${msg.from.id}\nXabar: ${msg.text}`);
          this.bot.sendMessage(chatId, 'Sizning xabaringiz adminga yuborildi. Tez orada javob olasiz!');
        } catch (error) {
          this.logger.error(`Error sending help request: ${error.message}`, error.stack);
          this.bot.sendMessage(chatId, 'Xabar yuborishda xato yuz berdi.');
        }
      });
    } else if (text.startsWith('/promocode')) {
      const code = text.split(' ')[1];
      if (!code) {
        this.bot.sendMessage(chatId, 'Iltimos, promo-kodni kiriting. Masalan: /promocode ABC123');
        return;
      }
      try {
        const startTime = Date.now();
        const promocode = await this.promocodeService.applyPromocode(code);
        const duration = Date.now() - startTime;
        this.logger.log(`Applied promocode ${code} in ${duration}ms`);
        this.bot.sendMessage(chatId, `Promo-kod qo‘llanildi! ${promocode.discountPercent}% chegirma.`);
      } catch (error) {
        this.logger.error(`Error applying promocode: ${error.message}`, error.stack);
        this.bot.sendMessage(chatId, 'Promo-kodni qo‘llashda xato yuz berdi.');
      }
    }
  } catch (error) {
    this.logger.error(`Error in message handler: ${error.message}`, error.stack);
    this.bot.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
  }
});

    this.bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const telegramId = query.from.id.toString();
      const data = query.data;
      try {
        this.logger.log(`Processing callback_query: ${data} from telegramId: ${telegramId}`);
        if (data.startsWith('category_')) {
          const categoryId = parseInt(data.split('_')[1]);
          const startTime = Date.now();
          const products = await this.productService.findByCategory(categoryId);
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products for categoryId: ${categoryId} in ${duration}ms`);
          const keyboard = products.map((prod) => [
            { text: `${prod.name} - ${prod.price} so‘m`, callback_data: `product_${prod.id}` },
          ]);
          this.bot.sendMessage(chatId, 'Mahsulotlar:', { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('product_')) {
          const productId = parseInt(data.split('_')[1]);
          const startTime = Date.now();
          const product = await this.productService.findOne(productId);
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched productId: ${productId} in ${duration}ms`);
          this.bot.sendPhoto(chatId, product.imageUrl, {
            caption: `${product.name}\n${product.description}\nNarxi: ${product.price} so‘m`,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Savatchaga qo‘shish', callback_data: `addtocart_${productId}` }],
                [{ text: '⭐ Feedback qoldirish', callback_data: `feedback_${productId}` }],
              ],
            },
          });
        } else if (data.startsWith('addtocart_')) {
          const productId = parseInt(data.split('_')[1]);
          try {
            const startTime = Date.now();
            await this.cartService.addToCart({ telegramId, productId, quantity: 1 });
            const duration = Date.now() - startTime;
            this.logger.log(`Added to cart productId: ${productId} for telegramId: ${telegramId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Mahsulot savatchaga qo‘shildi.');
          } catch (error) {
            this.logger.error(`Error adding to cart: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Savatchaga qo‘shishda xato yuz berdi.');
          }
        } else if (data === 'place_order') {
          try {
            const startTime = Date.now();
            const order = await this.orderService.createOrder(telegramId);
            const duration = Date.now() - startTime;
            this.logger.log(`Created order for telegramId: ${telegramId} in ${duration}ms`);
            this.bot.sendMessage(chatId, `Buyurtma yaratildi. ID: ${order.id}`, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💵 Click orqali to‘lash', callback_data: `pay_${order.id}_click` }],
                  [{ text: '💵 Payme orqali to‘lash', callback_data: `pay_${order.id}_payme` }],
                ],
              },
            });
          } catch (error) {
            this.logger.error(`Error creating order: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Buyurtma yaratishda xato yuz berdi.');
          }
        } else if (data.startsWith('pay_')) {
          const [_, orderId, paymentType] = data.split('_');
          try {
            const startTime = Date.now();
            const paymentLink = await this.paymentService.generatePaymentLink(parseInt(orderId), paymentType);
            const duration = Date.now() - startTime;
            this.logger.log(`Generated payment link for orderId: ${orderId}, paymentType: ${paymentType} in ${duration}ms`);
            this.bot.sendMessage(chatId, `To‘lov havolasi: ${paymentLink}`);
          } catch (error) {
            this.logger.error(`Error generating payment link: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'To‘lov havolasini yaratishda xato yuz berdi.');
          }
        } else if (data.startsWith('feedback_')) {
          const productId = parseInt(data.split('_')[1]);
          this.bot.sendMessage(chatId, 'Reytingni tanlang:', {
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
          this.bot.sendMessage(chatId, 'Izoh yozing:', { reply_markup: { force_reply: true } });
          this.bot.once('message', async (msg) => {
            try {
              const startTime = Date.now();
              await this.feedbackService.create({
                telegramId: msg.from.id.toString(),
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: msg.text,
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Created feedback for productId: ${productId} in ${duration}ms`);
              this.bot.sendMessage(chatId, 'Feedback qabul qilindi!');
            } catch (error) {
              this.logger.error(`Error in feedback: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Feedback qoldirishda xato yuz berdi.');
            }
          });
        } else if (data === 'clear_cart') {
          try {
            const startTime = Date.now();
            await this.cartService.clearCart(telegramId);
            const duration = Date.now() - startTime;
            this.logger.log(`Cleared cart for telegramId: ${telegramId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Savatcha tozalandi.');
          } catch (error) {
            this.logger.error(`Error clearing cart: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Savatchani tozalashda xato yuz berdi.');
          }
        } else if (data === 'add_category') {
          this.bot.sendMessage(chatId, 'Kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          this.bot.once('message', async (msgName) => {
            const name = msgName.text;
            this.bot.sendMessage(chatId, 'Kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            this.bot.once('message', async (msgDesc) => {
              try {
                const startTime = Date.now();
                await this.categoryService.create({ name, description: msgDesc.text });
                const duration = Date.now() - startTime;
                this.logger.log(`Created category with name: ${name} in ${duration}ms`);
                this.bot.sendMessage(chatId, 'Kategoriya muvaffaqiyatli qo‘shildi!');
              } catch (error) {
                this.logger.error(`Error in add_category: ${error.message}`, error.stack);
                this.bot.sendMessage(chatId, 'Kategoriya qo‘shishda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'view_categories') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          let message = 'Kategoriyalar:\n';
          categories.forEach((cat) => {
            message += `ID: ${cat.id}, Nomi: ${cat.name}, Tavsif: ${cat.description}\n`;
          });
          this.bot.sendMessage(chatId, message || 'Kategoriyalar mavjud emas.');
        } else if (data === 'edit_category') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          const keyboard = categories.map((cat) => [
            { text: `${cat.name}`, callback_data: `edit_cat_${cat.id}` },
          ]);
          this.bot.sendMessage(chatId, 'Tahrir qilinadigan kategoriyani tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('edit_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          this.bot.sendMessage(chatId, 'Yangi kategoriya nomini kiriting:', { reply_markup: { force_reply: true } });
          this.bot.once('message', async (msgName) => {
            const name = msgName.text;
            this.bot.sendMessage(chatId, 'Yangi kategoriya tavsifini kiriting:', { reply_markup: { force_reply: true } });
            this.bot.once('message', async (msgDesc) => {
              try {
                const startTime = Date.now();
                await this.categoryService.update(categoryId, { name, description: msgDesc.text });
                const duration = Date.now() - startTime;
                this.logger.log(`Updated categoryId: ${categoryId} in ${duration}ms`);
                this.bot.sendMessage(chatId, 'Kategoriya muvaffaqiyatli yangilandi!');
              } catch (error) {
                this.logger.error(`Error in edit_category: ${error.message}`, error.stack);
                this.bot.sendMessage(chatId, 'Kategoriyani tahrirlashda xato yuz berdi.');
              }
            });
          });
        } else if (data === 'delete_category') {
          const startTime = Date.now();
          const categories = await this.categoryService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
          const keyboard = categories.map((cat) => [
            { text: `${cat.name}`, callback_data: `delete_cat_${cat.id}` },
          ]);
          this.bot.sendMessage(chatId, 'O‘chiriladigan kategoriyani tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('delete_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          try {
            const startTime = Date.now();
            await this.categoryService.remove(categoryId);
            const duration = Date.now() - startTime;
            this.logger.log(`Deleted categoryId: ${categoryId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Kategoriya o‘chirildi.');
          } catch (error) {
            this.logger.error(`Error deleting category: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Kategoriyani o‘chirishda xato yuz berdi.');
          }
        } else if (data === 'add_product') {
          this.bot.sendMessage(
            chatId,
            'Mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID):',
            { reply_markup: { force_reply: true } },
          );
          this.bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              if (isNaN(parsedCategoryId)) {
                this.bot.sendMessage(chatId, 'Kategoriya ID noto‘g‘ri.');
                return;
              }
              const startTime = Date.now();
              const category = await this.categoryService.findOne(parsedCategoryId);
              const catDuration = Date.now() - startTime;
              this.logger.log(`Fetched categoryId: ${parsedCategoryId} in ${catDuration}ms`);
              if (!category) {
                this.bot.sendMessage(chatId, `Kategoriya ID ${parsedCategoryId} topilmadi.`);
                return;
              }
              const prodStartTime = Date.now();
              await this.productService.create({
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: 10,
                isActive: true,
              });
              const prodDuration = Date.now() - prodStartTime;
              this.logger.log(`Created product with categoryId: ${parsedCategoryId} in ${prodDuration}ms`);
              this.bot.sendMessage(chatId, 'Mahsulot qo‘shildi.');
            } catch (error) {
              this.logger.error(`Error in add_product: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Mahsulot qo‘shishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_products') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          let message = 'Mahsulotlar:\n';
          products.forEach((prod) => {
            message += `ID: ${prod.id}, Nomi: ${prod.name}, Narxi: ${prod.price} so‘m, Kategoriya ID: ${prod.category?.id || 'N/A'}\n`;
          });
          this.bot.sendMessage(chatId, message || 'Mahsulotlar mavjud emas.');
        } else if (data === 'edit_product') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          const keyboard = products.map((prod) => [
            { text: `${prod.name}`, callback_data: `edit_prod_${prod.id}` },
          ]);
          this.bot.sendMessage(chatId, 'Tahrir qilinadigan mahsulotni tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('edit_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          this.bot.sendMessage(
            chatId,
            'Yangi mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID):',
            { reply_markup: { force_reply: true } },
          );
          this.bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              if (isNaN(parsedCategoryId)) {
                this.bot.sendMessage(chatId, 'Kategoriya ID noto‘g‘ri.');
                return;
              }
              const startTime = Date.now();
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                this.bot.sendMessage(chatId, `Kategoriya ID ${parsedCategoryId} topilmadi.`);
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
              this.bot.sendMessage(chatId, 'Mahsulot muvaffaqiyatli yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_product: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Mahsulotni tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_product') {
          const startTime = Date.now();
          const products = await this.productService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${products.length} products in ${duration}ms`);
          const keyboard = products.map((prod) => [
            { text: `${prod.name}`, callback_data: `delete_prod_${prod.id}` },
          ]);
          this.bot.sendMessage(chatId, 'O‘chiriladigan mahsulotni tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('delete_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          try {
            const startTime = Date.now();
            await this.productService.remove(productId);
            const duration = Date.now() - startTime;
            this.logger.log(`Deleted productId: ${productId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Mahsulot o‘chirildi.');
          } catch (error) {
            this.logger.error(`Error deleting product: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Mahsulotni o‘chirishda xato yuz berdi.');
          }
        } else if (data === 'view_users') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          let message = 'Foydalanuvchilar:\n';
          users.forEach((user) => {
            message += `ID: ${user.id}, Telegram ID: ${user.telegramId}, Ism: ${user.fullName}, Telefon: ${user.phone || 'Kiritilmagan'}\n`;
          });
          this.bot.sendMessage(chatId, message || 'Foydalanuvchilar mavjud emas.');
        } else if (data === 'edit_user') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          const keyboard = users.map((user) => [
            { text: `${user.fullName}`, callback_data: `edit_user_${user.id}` },
          ]);
          this.bot.sendMessage(chatId, 'Tahrir qilinadigan foydalanuvchini tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('edit_user_')) {
          const userId = parseInt(data.split('_')[2]);
          this.bot.sendMessage(chatId, 'Yangi ism va telefon raqamini kiriting (ism;telefon):', {
            reply_markup: { force_reply: true },
          });
          this.bot.once('message', async (msg) => {
            try {
              const [fullName, phone] = msg.text.split(';');
              const startTime = Date.now();
              await this.userService.update(userId, { fullName: fullName.trim(), phone: phone.trim() });
              const duration = Date.now() - startTime;
              this.logger.log(`Updated userId: ${userId} in ${duration}ms`);
              this.bot.sendMessage(chatId, 'Foydalanuvchi ma‘lumotlari yangilandi.');
            } catch (error) {
              this.logger.error(`Error in edit_user: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Foydalanuvchini tahrirlashda xato yuz berdi.');
            }
          });
        } else if (data === 'delete_user') {
          const startTime = Date.now();
          const users = await this.userService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${users.length} users in ${duration}ms`);
          const keyboard = users.map((user) => [
            { text: `${user.fullName}`, callback_data: `delete_user_${user.id}` },
          ]);
          this.bot.sendMessage(chatId, 'O‘chiriladigan foydalanuvchini tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('delete_user_')) {
          const userId = parseInt(data.split('_')[2]);
          try {
            const startTime = Date.now();
            await this.userService.remove(userId);
            const duration = Date.now() - startTime;
            this.logger.log(`Deleted userId: ${userId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Foydalanuvchi o‘chirildi.');
          } catch (error) {
            this.logger.error(`Error deleting user: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Foydalanuvchini o‘chirishda xato yuz berdi.');
          }
        } else if (data === 'edit_order') {
          const startTime = Date.now();
          const orders = await this.orderService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${orders.length} orders in ${duration}ms`);
          const keyboard = orders.map((order) => [
            { text: `ID: ${order.id}`, callback_data: `edit_order_${order.id}` },
          ]);
          this.bot.sendMessage(chatId, 'Tahrir qilinadigan buyurtmani tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('edit_order_')) {
          const orderId = parseInt(data.split('_')[2]);
          this.bot.sendMessage(chatId, 'Yangi statusni kiriting (pending, confirmed, shipped, delivered):', {
            reply_markup: { force_reply: true },
          });
          this.bot.once('message', async (msg) => {
            try {
              const startTime = Date.now();
              await this.orderService.updateStatus(orderId, msg.text);
              const duration = Date.now() - startTime;
              this.logger.log(`Updated orderId: ${orderId} status in ${duration}ms`);
              this.bot.sendMessage(chatId, 'Buyurtma statusi yangilandi.');
            } catch (error) {
              this.logger.error(`Error updating order status: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Buyurtma statusini yangilashda xato yuz berdi.');
            }
          });
        } else if (data === 'view_orders') {
          const startTime = Date.now();
          const orders = await this.orderService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${orders.length} orders in ${duration}ms`);
          let message = 'Buyurtmalar:\n';
          orders.forEach((order) => {
            message += `ID: ${order.id}, Jami: ${order.totalAmount} so‘m, Status: ${order.status}\n`;
          });
          this.bot.sendMessage(chatId, message || 'Buyurtmalar mavjud emas.');
        } else if (data === 'view_feedback') {
          const startTime = Date.now();
          const feedbacks = await this.feedbackService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${feedbacks.length} feedbacks in ${duration}ms`);
          let message = 'Feedbacklar:\n';
          feedbacks.forEach((fb) => {
            message += `Mahsulot ID: ${fb.product.id}, Reyting: ${fb.rating}, Izoh: ${fb.comment}\n`;
          });
          this.bot.sendMessage(chatId, message || 'Feedbacklar mavjud emas.');
        } else if (data === 'delete_feedback') {
          const startTime = Date.now();
          const feedbacks = await this.feedbackService.findAll();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched ${feedbacks.length} feedbacks in ${duration}ms`);
          const keyboard = feedbacks.map((fb) => [
            { text: `ID: ${fb.id}, Reyting: ${fb.rating}`, callback_data: `delete_fb_${fb.id}` },
          ]);
          this.bot.sendMessage(chatId, 'O‘chiriladigan feedbackni tanlang:', {
            reply_markup: { inline_keyboard: keyboard },
          });
        } else if (data.startsWith('delete_fb_')) {
          const feedbackId = parseInt(data.split('_')[2]);
          try {
            const startTime = Date.now();
            await this.feedbackService.remove(feedbackId);
            const duration = Date.now() - startTime;
            this.logger.log(`Deleted feedbackId: ${feedbackId} in ${duration}ms`);
            this.bot.sendMessage(chatId, 'Feedback o‘chirildi.');
          } catch (error) {
            this.logger.error(`Error deleting feedback: ${error.message}`, error.stack);
            this.bot.sendMessage(chatId, 'Feedbackni o‘chirishda xato yuz berdi.');
          }
        } else if (data === 'create_promocode') {
          this.bot.sendMessage(chatId, 'Promo-kod ma‘lumotlarini kiriting (kod;foiz;amal qilish muddati yyyy-mm-dd):', {
            reply_markup: { force_reply: true },
          });
          this.bot.once('message', async (msg) => {
            try {
              const [code, discountPercent, validTill] = msg.text.split(';');
              const startTime = Date.now();
              await this.promocodeService.create({
                code: code.trim(),
                discountPercent: parseInt(discountPercent.trim()),
                validTill: new Date(validTill.trim()),
              });
              const duration = Date.now() - startTime;
              this.logger.log(`Created promocode: ${code} in ${duration}ms`);
              this.bot.sendMessage(chatId, 'Promo-kod yaratildi.');
            } catch (error) {
              this.logger.error(`Error in create_promocode: ${error.message}`, error.stack);
              this.bot.sendMessage(chatId, 'Promo-kod yaratishda xato yuz berdi.');
            }
          });
        } else if (data === 'view_stats') {
          const startTime = Date.now();
          const stats = await this.orderService.getStats();
          const duration = Date.now() - startTime;
          this.logger.log(`Fetched stats: totalOrders=${stats.totalOrders}, totalAmount=${stats.totalAmount} in ${duration}ms`);
          this.bot.sendMessage(chatId, `Jami buyurtmalar: ${stats.totalOrders}\nJami summa: ${stats.totalAmount} so‘m`);
        }
      } catch (error) {
        this.logger.error(`Error in callback_query: ${error.message}`, error.stack);
        this.bot.sendMessage(chatId, 'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.');
      }
    });
  }

  async handleWebhookUpdate(update: TelegramBot.Update) {
    try {
      this.logger.log(`Processing webhook update: ${JSON.stringify(update, null, 2)}`);
      const startTime = Date.now();
      await this.bot.processUpdate(update);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook update processed successfully in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Webhook update failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}