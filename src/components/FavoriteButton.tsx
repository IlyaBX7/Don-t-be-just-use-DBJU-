"use client";

import React from "react";
import { HeartIcon } from "./Icons";
import { useApp } from "./AppProvider";

interface Props {
  productId: string;
  className: string;
  size?: number;
}

export const FavoriteButton = ({ productId, className, size = 18 }: Props) => {
  const { favoriteIds, toggleFavorite } = useApp();
  const active = favoriteIds.has(productId);
  return (
    <button
      type="button"
      className={className}
      title={active ? "Прибрати з обраного" : "Додати в обране"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
    >
      <HeartIcon size={size} filled={active} color={active ? "#DC2626" : "currentColor"} />
    </button>
  );
};
