import { Category } from "../../category/category.entity";
import { Feedback } from "../../feedback/feedback.entity";
import { Order } from "../../order/order.entity";
import { Product } from "../../product/product.entity";
import { User } from "../../user/user.entity";
import { Delivery } from "../../delivery/delivery.entity";

export function formatProductMessage(product: Product): string {
  return `${product.name}\n${product.description}\nNarxi: ${product.price} so‘m\nOmborda: ${product.stock} dona`;
}

export function formatCategoryList(categories: Category[]): string {
  if (!categories.length) return 'Kategoriyalar mavjud emas.';
  return categories.map((cat) => `ID: ${cat.id}, Nomi: ${cat.name}, Tavsif: ${cat.description}`).join('\n');
}

export function formatProductList(products: Product[]): string {
  if (!products.length) return 'Mahsulotlar mavjud emas.';
  return products.map((prod) => `ID: ${prod.id}, Nomi: ${prod.name}, Narxi: ${prod.price} so‘m, Kategoriya: ${prod.category?.name || 'N/A'}, Omborda: ${prod.stock}`).join('\n');
}

export function formatUserList(users: User[]): string {
  if (!users.length) return 'Foydalanuvchilar mavjud emas.';
  return users.map((user) => `ID: ${user.id}, Ism: ${user.fullName || 'Kiritilmagan'}, Telefon: ${user.phone || 'Kiritilmagan'}, Telegram ID: ${user.telegramId}, Admin: ${user.isAdmin ? 'Ha' : 'Yo‘q'}`).join('\n');
}

export function formatOrderList(orders: Order[]): string {
  if (!orders.length) return 'Buyurtmalar mavjud emas.';
  return orders.map((order) => {
    const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} dona`).join(', ');
    const delivery = order.deliveries?.[0]
      ? `Yetkazib berish: (${order.deliveries[0].latitude}, ${order.deliveries[0].longitude}), Qo‘shimcha: ${order.deliveries[0].addressDetails || 'N/A'}, Status: ${order.deliveries[0].status}, Yetkazib beruvchi: ${order.deliveries[0].courierName || 'N/A'}, Telefon: ${order.deliveries[0].courierPhone || 'N/A'}, Yetkazib berish sanasi: ${order.deliveries[0].deliveryDate?.toISOString().slice(0, 19) || 'N/A'}`
      : 'Yetkazib berish ma‘lumotlari yo‘q';
    return `ID: ${order.id}, Foydalanuvchi: ${order.user?.fullName || 'Noma’lum'}, Jami: ${order.totalAmount} so‘m, Status: ${order.status}, Mahsulotlar: ${items || 'N/A'}, ${delivery}`;
  }).join('\n\n');
}

export function formatFeedbackList(feedbacks: Feedback[]): string {
  if (!feedbacks.length) return 'Feedbacklar mavjud emas.';
  return feedbacks.map((fb) => `ID: ${fb.id}, Mahsulot: ${fb.product.name}, Foydalanuvchi: ${fb.user?.fullName || 'Noma’lum'}, Reyting: ${fb.rating}, Izoh: ${fb.comment}`).join('\n');
}

export function formatDeliveryList(deliveries: Delivery[]): string {
  if (!deliveries.length) return 'Yetkazib berishlar mavjud emas.';
  return deliveries.map((delivery) => `ID: ${delivery.id}, Buyurtma ID: ${delivery.order.id}, Manzil: (${delivery.latitude}, ${delivery.longitude}), Qo‘shimcha: ${delivery.addressDetails || 'N/A'}, Status: ${delivery.status}, Yetkazib beruvchi: ${delivery.courierName || 'N/A'}, Telefon: ${delivery.courierPhone || 'N/A'}, Yetkazib berish sanasi: ${delivery.deliveryDate?.toISOString().slice(0, 19) || 'N/A'}, Kuzatuv raqami: ${delivery.trackingNumber || 'N/A'}`).join('\n');
}