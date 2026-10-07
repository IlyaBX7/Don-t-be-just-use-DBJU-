"use client";

import { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="card">
      <div className="imageWrapper">
        <img 
          src={product.images[0] || '/placeholder.png'} 
          alt={product.name} 
          className="image" 
        />
      </div>
      
      <div className="content">
        <span className="category">{product.category}</span>
        <h3 className="title">{product.name}</h3>
        
        <div className="priceBlock">
          <p className="rentPrice">
            <span>{product.rentalPricePerDay} ₴</span> / день
          </p>
          <p className="buyPrice">Викуп: {product.purchasePrice} ₴</p>
        </div>

        <div className="actions">
          <button className="rentBtn">В оренду</button>
          <button className="buyBtn">Купити</button>
        </div>
      </div>
    </div>
  );
};