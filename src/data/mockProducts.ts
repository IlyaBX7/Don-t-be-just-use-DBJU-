import { Product } from '../types/product';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Oculus Quest 3 128GB',
    description: 'Автономний шолом віртуальної реальності нового покоління. Ідеально для тестування ігор перед покупкою.',
    category: 'VR',
    images: ['/quest3.jpg'], // Пізніше додамо реальні картинки
    rentalPricePerDay: 450,
    purchasePrice: 22000,
    depositAmount: 5000,
    status: 'AVAILABLE',
    condition: 'NEW',
    features: {
      'Пам\'ять': '128GB',
      'Роздільна здатність': '2064x2208 на око'
    }
  },
  {
    id: '2',
    name: 'Acer Nitro V 15',
    description: 'Потужний ігровий ноутбук, який чудово підійде для геймінгу на вихідних або важкого рендеру відео.',
    category: 'Laptops',
    images: ['/acer-nitro.jpg'],
    rentalPricePerDay: 700,
    purchasePrice: 38000,
    depositAmount: 8000,
    status: 'AVAILABLE',
    condition: 'LIKE_NEW',
    features: {
      'Процесор': 'Intel Core i5',
      'Відеокарта': 'NVIDIA GeForce RTX 3050',
      'ОЗП': '16 GB DDR5',
      'Накопичувач': '512 GB SSD'
    }
  }
];