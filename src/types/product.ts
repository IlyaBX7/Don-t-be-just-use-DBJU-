// Визначаємо можливі статуси товару за допомогою об'єднання типів (Union Types)
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

// Визначаємо стан техніки
export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  
  // Фінансовий блок
  rentalPricePerDay: number; // Вартість оренди за один день
  purchasePrice: number;     // Ціна для прямого викупу товару
  depositAmount: number;     // Сума, яка буде "заморожуватись" на картці (застава)
  
  // Логістика та стан
  status: ProductStatus;
  condition: ProductCondition;
  
  // Гнучкі характеристики техніки (наприклад: { "Пам'ять": "16GB", "Процесор": "M1" })
  features?: Record<string, string>; 
}