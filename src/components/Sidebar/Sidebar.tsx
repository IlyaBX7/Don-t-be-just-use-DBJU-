// src/components/Sidebar/Sidebar.tsx
"use client";

export const Sidebar = () => {
  // Тимчасовий масив категорій
  const categories = [
    'VR та AR', 
    'Ноутбуки та ПК', 
    'Ігрові приставки', 
    'Камери та об\'єктиви', 
    'Дрони', 
    'Проектори'
  ];

  return (
    <aside className="sidebar">
      <h3 className="sidebarTitle">Категорії</h3>
      <ul className="categoryList">
        {categories.map((category, index) => (
          <li key={index}>
            <a href="#">{category}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
};