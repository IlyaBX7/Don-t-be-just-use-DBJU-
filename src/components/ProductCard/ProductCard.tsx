"use client";

import Link from 'next/link';
import { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/product/${product.id}`} className="card">
      <div className="imageWrapper">
        <img 
          src={product.images[0] || '/placeholder.png'} 
          alt={product.name} 
          className="image" 
        />
      </div>
      
      <div className="content">
        <div className="cardHeader">
          <span className="category">{product.category}</span>
          <span className="rating">⭐ {product.ownerRating} ({product.reviewsCount})</span>
        </div>
        
        <h3 className="title">{product.name}</h3>
        <p className="location">📍 {product.location}</p>
        
        <div className="priceBlock">
          <p className="rentPrice">
            <span>{product.rentalPricePerDay} ₴</span> / день
          </p>
          <p className="minRent">Мінімум {product.minRentDays} дн. • Застава: {product.depositAmount} ₴</p>
        </div>

        <div className="actions">
          <button className="rentBtn">Переглянути</button>
        </div>
      </div>
    </Link>
  );
};