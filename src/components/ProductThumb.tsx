/* eslint-disable @next/next/no-img-element -- фото віддаються нашим API, оптимізація next/image не потрібна */
import React from "react";
import { CategoryIcon } from "./CategoryIcon";

interface Props {
  image?: string | null;
  categoryKey: string;
  iconSize?: number;
  alt?: string;
}

// Фото товару або пастельна іконка категорії, якщо фото немає
export const ProductThumb = ({ image, categoryKey, iconSize = 54, alt = "" }: Props) =>
  image ? (
    <img
      src={image}
      alt={alt}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
    />
  ) : (
    <CategoryIcon categoryKey={categoryKey} size={iconSize} />
  );
