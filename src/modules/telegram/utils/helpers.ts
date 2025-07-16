import { Category } from "src/modules/category/category.entity";
import { Feedback } from "src/modules/feedback/feedback.entity";
import { Order } from "src/modules/order/order.entity";
import { Product } from "src/modules/product/product.entity";
import { User } from "src/modules/user/user.entity";


export function formatProductMessage(product: Product): string {
  return `${product.name}\n${product.description}\nNarxi: ${product.price} so‘m`;
}

export function formatCategoryList(categories: Category[]): string {
  if (!categories.length) return 'Kategoriyalar mavjud emas.';
  return categories.map((cat) => `ID: ${cat.id}, Nomi: ${cat.name}, Tavsif: ${cat.description}`).join('\n');
}

export function formatProductList(products: Product[]): string {
  if (!products.length) return 'Mahsulotlar mavjud emas.';
  return products.map((prod) => `ID: ${prod.id}, Nomi: ${prod.name}, Narxi: ${prod.price} so‘m, Kategoriya ID: ${prod.category?.id || 'N/A'}`).join('\n');
}

export function formatUserList(users: User[]): string {
  if (!users.length) return 'Foydalanuvchilar mavjud emas.';
  return users.map((user) => `ID: ${user.id}, Telegram ID: ${user.telegramId}, Ism: ${user.fullName}, Telefon: ${user.phone || 'Kiritilmagan'}`).join('\n');
}

export function formatOrderList(orders: Order[]): string {
  if (!orders.length) return 'Buyurtmalar mavjud emas.';
  return orders.map((order) => `ID: ${order.id}, Jami: ${order.totalAmount} so‘m, Status: ${order.status}`).join('\n');
}

export function formatFeedbackList(feedbacks: Feedback[]): string {
  if (!feedbacks.length) return 'Feedbacklar mavjud emas.';
  return feedbacks.map((fb) => `Mahsulot ID: ${fb.product.id}, Reyting: ${fb.rating}, Izoh: ${fb.comment}`).join('\n');
}