/* eslint-disable @next/next/no-img-element -- фото віддаються нашим API */
import React from "react";

interface Props {
  name: string;
  initials?: string | null;
  url?: string | null;
  className: string; // існуючі класи: dbju-user-avatar, dbju-profile-avatar-xl, dbju-owner-avatar-lg
  style?: React.CSSProperties;
}

// Фото профілю або ініціали, якщо фото немає
export const Avatar = ({ name, initials, url, className, style }: Props) => (
  <div className={className} style={{ position: "relative", overflow: "hidden", ...style }}>
    {url ? (
      <img
        src={url}
        alt={name}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      initials || name.slice(0, 2).toUpperCase()
    )}
  </div>
);
