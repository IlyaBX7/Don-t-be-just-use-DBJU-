// src/components/Header/Header.tsx
"use client";

export const Header = () => {
  return (
    <header className="header">
      <div className="headerLeft">
        {/* Логотип */}
        <a href="/" className="logo">DBJU</a>
        
        {/* Кнопка майбутнього каталогу */}
        <button className="catalogBtn">☰ Каталог</button>
      </div>

      <div className="headerCenter">
        {/* Пошук */}
        <input 
          type="text" 
          placeholder="Знайти техніку в оренду..." 
          className="searchInput" 
        />
      </div>

      <div className="headerRight">
        {/* Кнопки акаунта та кошика */}
        <button className="iconBtn">👤 Увійти</button>
        <button className="iconBtn">🛒 Кошик</button>
      </div>
    </header>
  );
};