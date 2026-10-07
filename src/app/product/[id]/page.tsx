import { mockProducts } from '../../../data/mockProducts';
import Link from 'next/link';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Отримуємо ID з URL
  const productId = (await params).id;
  // Знаходимо товар у базі
  const product = mockProducts.find(p => p.id === productId);

  if (!product) {
    return <div className="pageLayout"><h1>Товар не знайдено 😔</h1></div>;
  }

  return (
    <div className="pageLayout">
      <div className="productPageWrapper">
        <div className="productGallery">
          <img src={product.images[0] || '/placeholder.png'} alt={product.name} className="productMainImage" />
        </div>

        <div className="productInfo">
          <Link href="/" className="backLink">← Назад до пошуку</Link>
          <span className="category">{product.category}</span>
          <h1 className="productTitle">{product.name}</h1>
          
          <div className="ownerBlock">
            <div className="ownerAvatar">👤</div>
            <div>
              <p className="ownerName">{product.ownerName}</p>
              <p className="rating">⭐ {product.ownerRating} ({product.reviewsCount} відгуків)</p>
            </div>
            <p className="locationLabel">📍 {product.location}</p>
          </div>

          <p className="description">{product.description}</p>

          <div className="specsBlock">
            <h3>Характеристики</h3>
            <ul>
              {product.features && Object.entries(product.features).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          </div>

          <div className="checkoutCard">
            <div className="checkoutPrices">
              <h2>{product.rentalPricePerDay} ₴ <span>/ день</span></h2>
              <p>Обов'язкова застава: <strong>{product.depositAmount} ₴</strong></p>
            </div>
            <button className="rentBtnLarge">Забронювати дати</button>
            {product.purchasePrice && (
               <p className="buyOption">Власник готовий продати річ за {product.purchasePrice} ₴</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}