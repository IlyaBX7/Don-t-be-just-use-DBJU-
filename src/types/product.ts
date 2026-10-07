export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  
  // Оренда та фінанси
  rentalPricePerDay: number;
  depositAmount: number;
  minRentDays: number; // Мінімальна кількість днів оренди
  purchasePrice?: number; // Опціонально, якщо власник готовий продати
  
  // Дані маркетплейсу (довіра та логістика)
  location: string;
  ownerName: string;
  ownerRating: number; // від 1.0 до 5.0
  reviewsCount: number;
  
  status: ProductStatus;
  condition: ProductCondition;
  features?: Record<string, string>;
}