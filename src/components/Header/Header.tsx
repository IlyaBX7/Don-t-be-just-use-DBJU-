"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  SearchIcon, 
  HeartIcon, 
  PlusCircleIcon, 
  CheckIcon,
  UserIcon 
} from "../Icons";
import { useApp } from "../AppProvider";
import { Avatar } from "../Avatar";

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuth, stats } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  };


  return (
    <header className="dbju-header">
      <div className="dbju-header-container">
        {/* Brand Group */}
        <Link href="/" className="dbju-brand-group">
          <div className="dbju-logo-pill">DBJU</div>
          <span className="dbju-slogan">Don&apos;t Buy, Just Use</span>
        </Link>

        {/* Center: Search */}
        <div className="dbju-header-center">
          <form className="dbju-search-box" onSubmit={submitSearch} role="search">
            <SearchIcon size={18} className="dbju-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Дриль, намет, PlayStation..."
              className="dbju-search-input"
              aria-label="Пошук речей"
            />
          </form>
        </div>

        {/* Nav Links */}
        <nav className="dbju-header-nav">
          <Link 
            href="/catalog" 
            className={`dbju-nav-link ${pathname === "/catalog" ? "active" : ""}`}
          >
            Каталог
          </Link>
          <Link 
            href="/rentals" 
            className={`dbju-nav-link ${pathname === "/rentals" ? "active" : ""}`}
          >
            Мої оренди
            {stats && stats.activeRentals > 0 && (
              <span className="dbju-badge-count">{stats.activeRentals}</span>
            )}
          </Link>
        </nav>

        {/* User & Quick Actions */}
        <div className="dbju-header-actions">
          <Link href="/rent-out" className="dbju-btn-add" title="Додати свою річ та заробляти">
            <PlusCircleIcon size={16} />
            <span>Здати річ</span>
          </Link>

          <Link href="/favorites" className="dbju-round-icon-btn" title="Обране" style={{ position: "relative" }}>
            <HeartIcon size={20} />
            {stats && stats.favoritesCount > 0 && (
              <span className="dbju-badge-count" style={{ position: "absolute", top: "-4px", right: "-4px" }}>
                {stats.favoritesCount}
              </span>
            )}
          </Link>

          {/* User pill or Login button */}
          {user ? (
            <Link href="/profile" className="dbju-user-pill" title="Мій профіль">
              <Avatar className="dbju-user-avatar" name={user.name} initials={user.avatar} url={user.avatarUrl} />
              <span>{user.firstName || user.name}</span>
              {user.role === "ADMIN" && (
                <span 
                  style={{ 
                    background: "var(--brand-dark)", 
                    color: "var(--brand-lime)", 
                    fontSize: "10px", 
                    fontWeight: "900", 
                    padding: "2px 6px", 
                    borderRadius: "6px" 
                  }}
                >
                  ADMIN
                </span>
              )}
              {user.isVerified && (
                <div className="dbju-diia-badge">
                  <CheckIcon size={10} />
                  <span>ДІЯ</span>
                </div>
              )}
            </Link>
          ) : (
            <button
              type="button"
              className="dbju-btn-primary"
              style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "var(--radius-full)" }}
              onClick={() => openAuth("LOGIN")}
            >
              <UserIcon size={16} />
              <span>Увійти</span>
            </button>
          )}
        </div>
      </div>

    </header>
  );
};
