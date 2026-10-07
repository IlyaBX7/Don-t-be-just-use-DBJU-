import { Product } from '../types/product';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Намет двомісний Terra Incognita',
    description: 'Легкий та надійний намет для походів у гори. Витримує сильний вітер та дощ. Збирався 3 рази.',
    category: 'Кемпінг',
    images: ['/placeholder.png'],
    rentalPricePerDay: 150,
    depositAmount: 1500,
    minRentDays: 2,
    location: 'Київ, м. Почайна',
    ownerName: 'Олексій',
    ownerRating: 4.8,
    reviewsCount: 12,
    status: 'AVAILABLE',
    condition: 'LIKE_NEW',
    features: { 'Вага': '2.5 кг', 'Водостійкість': '4000 мм' }
  },
  {
    id: '2',
    name: 'Oculus Quest 3 128GB',
    description: 'VR-шолом нового покоління. Ідеально для тестування перед покупкою або на вечірку.',
    category: 'VR',
    images: ['/placeholder.png'],
    rentalPricePerDay: 450,
    depositAmount: 5000,
    minRentDays: 1,
    purchasePrice: 22000,
    location: 'Київ, Троєщина',
    ownerName: 'RentGadget (Магазин)',
    ownerRating: 5.0,
    reviewsCount: 145,
    status: 'AVAILABLE',
    condition: 'NEW',
    features: { 'Пам\'ять': '128GB', 'Тип': 'Автономний' }
  },
  {
    id: '3',
    name: 'Мийка високого тиску Kärcher K4',
    description: 'Чудово підійде, щоб помити машину чи фасад будинку на вихідних. Віддаю з усіма насадками.',
    category: 'Інструменти',
    images: ['/placeholder.png'],
    rentalPricePerDay: 300,
    depositAmount: 3000,
    minRentDays: 1,
    location: 'Київ, Оболонь',
    ownerName: 'Дмитро',
    ownerRating: 4.5,
    reviewsCount: 3,
    status: 'AVAILABLE',
    condition: 'GOOD',
    features: { 'Тиск': '130 бар', 'Продуктивність': '420 л/год' }
  }
];