import { TelegramBot } from 'node-telegram-bot-api';
import { KeyboardOptions } from './interfaces';

export function getMainKeyboard(showContact: boolean): TelegramBot.SendMessageOptions['reply_markup'] {
  const keyboard: TelegramBot.KeyboardButton[][] = [
    [{ text: '📁 Kategoriyalar' }, { text: '🛒 Savatcha' }],
    [{ text: '👤 Profilim' }, { text: '🕘 Buyurtma tarixi' }],
    [{ text: 'ℹ️ Biz haqimizda' }, { text: '🆘 Yordam' }],
  ];
  if (showContact) {
    keyboard.unshift([{ text: '📞 Telefon raqamni yuborish', request_contact: true }]);
  }
  return { keyboard, resize_keyboard: true, one_time_keyboard: showContact };
}

export function getAdminKeyboard(): TelegramBot.SendMessageOptions['reply_markup'] {
  return {
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
  };
}