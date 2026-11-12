"use client";

import React, { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Product } from "../types/product";

// Мітки з ціною; кілька речей в одній точці трохи розносимо
function drawMarkers(leaflet: typeof import("leaflet"), m: LeafletMap, group: LayerGroup, items: Product[]) {
  group.clearLayers();
  const seen = new Map<string, number>();
  const points: [number, number][] = [];
  for (const p of items) {
    if (p.approxLat === null || p.approxLng === null) continue;
    // Кілька речей в одній точці — трохи розносимо, щоб усі було видно
    const key = `${p.approxLat},${p.approxLng}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    const angle = n * 2.4;
    const r = n === 0 ? 0 : 0.004 * Math.sqrt(n);
    const lat = p.approxLat + r * Math.cos(angle);
    const lng = p.approxLng + r * Math.sin(angle);
    points.push([lat, lng]);
    const icon = leaflet.divIcon({
      className: "dbju-map-price",
      html: `<span>${p.rentalPricePerDay} ₴</span>`,
      iconSize: undefined,
    });
    const marker = leaflet.marker([lat, lng], { icon, title: p.name, keyboard: true });
    const popup = document.createElement("div");
    popup.className = "dbju-map-popup";
    const a = document.createElement("a");
    a.href = `/product/${encodeURIComponent(p.id)}`;
    a.textContent = p.name; // textContent — без HTML-ін'єкцій з назви
    const meta = document.createElement("div");
    meta.textContent = `${p.rentalPricePerDay} ₴ / доба · ${p.location}${p.rentedUntil ? " · в оренді" : ""}`;
    popup.append(a, meta);
    marker.bindPopup(popup);
    group.addLayer(marker);
  }
  if (points.length === 1) m.setView(points[0], 12);
  else if (points.length > 1) m.fitBounds(leaflet.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
}

// Карта каталогу: приблизні місця речей (~1 км), щоб не розкривати домашні адреси власників
export default function CatalogMap({ items }: { items: Product[] }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((leaflet) => {
      if (cancelled || !box.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(box.current, { scrollWheelZoom: true }).setView([49.0, 31.4], 6);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(m);
      map.current = m;
      layer.current = leaflet.layerGroup().addTo(m);
      drawMarkers(leaflet, m, layer.current, itemsRef.current);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
    if (L.current && map.current && layer.current) drawMarkers(L.current, map.current, layer.current, items);
  }, [items]);

  return <div ref={box} className="dbju-catalog-map" role="application" aria-label="Карта речей" />;
}
