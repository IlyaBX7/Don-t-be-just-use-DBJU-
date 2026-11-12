"use client";

import React, { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  center: { lat: number; lng: number; zoom: number };
  pin: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}

// Карта OpenStreetMap: клік або перетягування мітки обирає точку
export default function MapPicker({ center, pin, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // Створення карти (Leaflet працює лише в браузері)
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((leaflet) => {
      if (cancelled || !box.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(box.current, { scrollWheelZoom: true }).setView(
        pin ? [pin.lat, pin.lng] : [center.lat, center.lng],
        pin ? 16 : center.zoom
      );
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(m);
      m.on("click", (e) => pickRef.current(e.latlng.lat, e.latlng.lng));
      map.current = m;
      if (pin) placeMarker(pin.lat, pin.lng);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- карта створюється один раз
  }, []);

  function placeMarker(lat: number, lng: number) {
    const leaflet = L.current;
    const m = map.current;
    if (!leaflet || !m) return;
    if (marker.current) {
      marker.current.setLatLng([lat, lng]);
      return;
    }
    const icon = leaflet.divIcon({ className: "dbju-map-pin", html: "<span></span>", iconSize: [30, 30], iconAnchor: [15, 30] });
    marker.current = leaflet.marker([lat, lng], { icon, draggable: true }).addTo(m);
    marker.current.on("dragend", () => {
      const p = marker.current!.getLatLng();
      pickRef.current(p.lat, p.lng);
    });
  }

  // Мітка слідує за обраною точкою
  useEffect(() => {
    if (pin) placeMarker(pin.lat, pin.lng);
    else if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.lat, pin?.lng]);

  // Обрали інше місто — переміщуємо карту, якщо точки ще немає
  useEffect(() => {
    if (!pin) map.current?.setView([center.lat, center.lng], center.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, center.zoom]);

  return <div ref={box} className="dbju-map-box" role="application" aria-label="Карта для вибору місця" />;
}
