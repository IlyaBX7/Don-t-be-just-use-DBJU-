import { prisma } from "./prisma";
import { getStorage } from "./storage";
import { isUploadUrl } from "./uploads";

// Видаляє зі сховища фото, на які більше ніщо в БД не посилається.
// Викликається після видалення оголошення, зміни фото в ньому чи зміни аватарки.
export async function removeUnusedImages(urls: unknown[]): Promise<void> {
  const candidates = [...new Set(urls.filter(isUploadUrl))];
  for (const url of candidates) {
    try {
      const [inProducts, inBookings, inAvatars] = await Promise.all([
        prisma.product.count({ where: { images: { array_contains: url } } }),
        prisma.booking.count({ where: { returnPhoto: url } }),
        prisma.user.count({ where: { avatarUrl: url } }),
      ]);
      if (inProducts === 0 && inBookings === 0 && inAvatars === 0) {
        await getStorage().remove(url.slice("/api/uploads/".length));
      }
    } catch (error) {
      // Залишений файл не критичний — не ламаємо через це запит користувача
      console.error("Не вдалося прибрати фото", url, error);
    }
  }
}
