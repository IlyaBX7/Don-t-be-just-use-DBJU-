"use client";

import React from "react";
import Link from "next/link";
import { Product } from "../../types/product";
import { ProductThumb } from "../ProductThumb";
import { FavoriteButton } from "../FavoriteButton";
import { LocationPinIcon } from "../Icons";
import { isRentedNow, rentalShortLabel } from "../../lib/rentalStatus";

interface ProductCardProps {
  product: Product;
  onBookClick?: (product: Product) => void;
}

export const ProductCard = ({ product, onBookClick }: ProductCardProps) => {
  return (
    <div className="dbju-product-card">
      <Link href={`/product/${product.id}`} style={{ display: "block" }}>
        {/* Pastel Image Container */}
        <div
          className="dbju-product-thumb"
          style={{ backgroundColor: product.accentColor }}
        >
          <ProductThumb image={product.images[0]} categoryKey={product.categoryKey} alt={product.name} />
          {isRentedNow(product) && <span className="dbju-thumb-tag">🔒 {rentalShortLabel(product)}</span>}
          <FavoriteButton productId={product.id} className="dbju-card-favorite-btn" />
        </div>

        {/* Product Meta */}
        <div className="dbju-product-info">
          <h3 className="dbju-product-title">{product.name}</h3>

          <div className="dbju-product-meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <LocationPinIcon size={14} />
              {product.location}
            </span>
            {product.reviewsCount > 0 && (
              <>
                <span>·</span>
                <span>★ {product.ownerRating.toFixed(1)}</span>
              </>
            )}
            {product.rentalCount > 0 && (
              <>
                <span>·</span>
                <span>{product.rentalCount} оренд</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Price & Action Row */}
      <div className="dbju-product-price-row">
        <div className="dbju-price-tag">
          {product.rentalPricePerDay} ₴ <span>/ доба</span>
        </div>

        {isRentedNow(product) ? (
          <span className="dbju-btn-book-quick" style={{ opacity: 0.5, cursor: "not-allowed" }} title={rentalShortLabel(product) ?? undefined}>
            В оренді
          </span>
        ) : onBookClick ? (
          <button
            type="button"
            className="dbju-btn-book-quick"
            onClick={() => onBookClick(product)}
          >
            Забронювати
          </button>
        ) : (
          <Link href={`/product/${product.id}`} className="dbju-btn-book-quick">
            Переглянути
          </Link>
        )}
      </div>
    </div>
  );
};
