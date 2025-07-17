import { Category } from "../../category/category.entity";
import { Feedback } from "../../feedback/feedback.entity";
import { Order } from "../../order/order.entity";
import { Product } from "../../product/product.entity";
import { User } from "../../user/user.entity";
import { Delivery } from "../../delivery/delivery.entity";
import { ORDER_STATUS } from "../../../common/constants";

export function formatProductMessage(product: Product): string {
  return `${product.name}\n${product.description}\n💸 Narxi: ${product.price} so‘m\n📦 Omborda: ${product.stock} dona`;
}

export function formatCategoryList(categories: Category[]): string {
  if (!categories.length) return '❌ Kategoriyalar mavjud emas.';
  return categories.map((cat) => `📋 <b>ID: ${cat.id}</b>, Nomi: ${cat.name}, Tavsif: ${cat.description}`).join('\n');
}

export function formatProductList(products: Product[]): string {
  if (!products.length) return '❌ Mahsulotlar mavjud emas.';
  return products.map((prod) => `📋 <b>ID: ${prod.id}</b>, Nomi: ${prod.name}, 💸 Narxi: ${prod.price} so‘m, 📌 Kategoriya: ${prod.category?.name || 'N/A'}, 📦 Omborda: ${prod.stock}`).join('\n');
}

export function formatUserList(users: User[]): string {
  if (!users.length) return '❌ Foydalanuvchilar mavjud emas.';
  return users.map((user) => `👤 <b>ID: ${user.id}</b>, Ism: ${user.fullName || 'Kiritilmagan'}, 📞 Telefon: ${user.phone || 'Kiritilmagan'}, 🆔 Telegram ID: ${user.telegramId}, Admin: ${user.isAdmin ? '✅ Ha' : '❌ Yo‘q'}`).join('\n');
}

export function formatOrderList(orders: Order[]): string {
  if (!orders.length) return '❌ Buyurtmalar mavjud emas.';
  return orders.map((order) => {
    const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} dona`).join(', ');
    const delivery = order.deliveries?.[0]
      ? `📍 <b>Manzil:</b> (${order.deliveries[0].latitude}, ${order.deliveries[0].longitude})\n🏠 <b>Qo‘shimcha:</b> ${order.deliveries[0].addressDetails || 'N/A'}\n📊 <b>Yetkazib berish statusi:</b> ${order.deliveries[0].status}\n🚚 <b>Yetkazib beruvchi:</b> ${order.deliveries[0].courierName || 'N/A'}\n📞 <b>Telefon:</b> ${order.deliveries[0].courierPhone || 'N/A'}\n📅 <b>Yetkazib berish sanasi:</b> ${order.deliveries[0].deliveryDate?.toLocaleString('uz-UZ') || 'N/A'}`
      : '❌ Yetkazib berish ma‘lumotlari yo‘q';
    return `
      📋 <b>Buyurtma #${order.id}</b>
      👤 <b>Foydalanuvchi:</b> ${order.user?.fullName || 'Kiritilmagan'}
      💸 <b>Jami:</b> ${order.totalAmount} so‘m
      📊 <b>Status:</b> ${order.status}
      💵 <b>To‘lov turi:</b> ${order.paymentType || 'To‘lanmagan'}
      📦 <b>Mahsulotlar:</b> ${items || 'N/A'}
      ${delivery}
      ━━━━━━━━━━━━━━━`;
        }).join('\n');
}

export function formatFeedbackList(feedbacks: Feedback[]): string {
  if (!feedbacks.length) return '❌ Feedbacklar mavjud emas.';
  return feedbacks.map((fb) => `📋 <b>ID: ${fb.id}</b>, 📦 Mahsulot: ${fb.product.name}, 👤 Foydalanuvchi: ${fb.user?.fullName || 'Kiritilmagan'}, ⭐ Reyting: ${fb.rating}, 💬 Izoh: ${fb.comment}`).join('\n');
}

export function formatDeliveryList(deliveries: Delivery[]): string {
  if (!deliveries.length) return '❌ Yetkazib berishlar mavjud emas.';
  return deliveries.map((delivery) => `
    📋 <b>Yetkazib berish #${delivery.id}</b>
    📋 <b>Buyurtma ID:</b> ${delivery.order.id}
    👤 <b>Foydalanuvchi:</b> ${delivery.order.user?.fullName || 'Kiritilmagan'}
    📍 <b>Manzil:</b> (${delivery.latitude}, ${delivery.longitude})
    🏠 <b>Qo‘shimcha:</b> ${delivery.addressDetails || 'N/A'}
    📊 <b>Status:</b> ${delivery.status}
    🚚 <b>Yetkazib beruvchi:</b> ${delivery.courierName || 'N/A'}
    📞 <b>Telefon:</b> ${delivery.courierPhone || 'N/A'}
    📅 <b>Yetkazib berish sanasi:</b> ${delivery.deliveryDate?.toLocaleString('uz-UZ') || 'N/A'}
    🔍 <b>Kuzatuv raqami:</b> ${delivery.trackingNumber || 'N/A'}
    ━━━━━━━━━━━━━━━`).join('\n');
}

export function formatStats(stats: any): string {
  return `
    📊 <b>Statistika</b>
    ━━━━━━━━━━━━━━━
    📋 <b>Jami buyurtmalar:</b> ${stats.totalOrders}
    💸 <b>Jami summa (to‘langan):</b> ${stats.totalAmount} so‘m
    ⏳ <b>Kutayotgan buyurtmalar:</b> ${stats.pendingOrders}
    ✅ <b>To‘langan buyurtmalar:</b> ${stats.paidOrders}
    🚚 <b>Yetkazib berilayotgan:</b> ${stats.shippedOrders}
    ✔️ <b>Yetkazib berilgan:</b> ${stats.deliveredOrders}
    ❌ <b>Bekor qilingan:</b> ${stats.cancelledOrders}
    📦 <b>Sotilgan mahsulotlar:</b> ${stats.soldProducts}
    🛒 <b>Savatchadagi mahsulotlar:</b> ${stats.cartItems}
    ━━━━━━━━━━━━━━━
    📅 <b>Oylik hisobot (to‘langan):</b>
    ${Object.entries(stats.monthlyStats)
      .map(([month, amount]) => `📆 ${month}: ${amount} so‘m`)
      .join('\n') || 'Ma’lumot yo‘q'}
    ━━━━━━━━━━━━━━━
    📅 <b>Yillik hisobot (to‘langan):</b>
    ${Object.entries(stats.yearlyStats)
      .map(([year, amount]) => `📆 ${year}: ${amount} so‘m`)
      .join('\n') || 'Ma’lumot yo‘q'}
    ━━━━━━━━━━━━━━━`;
}