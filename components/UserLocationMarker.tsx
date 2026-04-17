"use client";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

const createIcon = () => L.divIcon({
  className: "",
  html: '<span class="ulm-pulse"></span><span class="ulm-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function UserLocationMarker({ position }: { position: [number, number] | null }) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);
  useEffect(() => { setIcon(createIcon()); }, []);
  if (!position || !icon) return null;
  return <Marker position={position} icon={icon} interactive={false} />;
}
