import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveMapProps {
  latitude: number;
  longitude: number;
  gpsFix: boolean;
  hasData: boolean;
  speed?: number;
  satellites?: number;
  altitude?: number;
  farmerLocation?: string;
  mandiName?: string;
}

export function LiveMap({
  latitude,
  longitude,
  gpsFix,
  hasData,
  speed = 0,
  satellites = 0,
  altitude = 0,
  farmerLocation = "Farm Origin",
  mandiName = "Mandi Yard",
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check dark mode
    const isDarkMode = document.documentElement.classList.contains("dark");
    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const defaultLat = hasData && gpsFix ? latitude : 12.3052;
    const defaultLng = hasData && gpsFix ? longitude : 76.6552;

    // Initialize Map if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Custom pulsing truck / marker icon
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; items-center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: #10b981; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              🚚
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([defaultLat, defaultLng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #10b981;">MandiTrace Vehicle Tracker</strong><br/>
          <span>Speed: ${speed.toFixed(1)} km/h</span><br/>
          <span>Satellites: ${satellites} | Alt: ${altitude.toFixed(0)}m</span><br/>
          <span style="font-size: 10px; color: #64748b;">${defaultLat.toFixed(5)}° N, ${defaultLng.toFixed(5)}° E</span>
        </div>
      `);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Smoothly update position if map exists
      const map = mapInstanceRef.current;
      const marker = markerRef.current;

      if (hasData && gpsFix && latitude && longitude) {
        map.panTo([latitude, longitude], { animate: true, duration: 1.0 });
        if (marker) {
          marker.setLatLng([latitude, longitude]);
          marker.setPopupContent(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="color: #10b981;">MandiTrace Vehicle Tracker</strong><br/>
              <span>Speed: ${speed.toFixed(1)} km/h</span><br/>
              <span>Satellites: ${satellites} | Alt: ${altitude.toFixed(0)}m</span><br/>
              <span style="font-size: 10px; color: #64748b;">${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E</span>
            </div>
          `);
        }
      }
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker & popup on props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && hasData && gpsFix) {
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true, duration: 0.8 });
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setPopupContent(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #10b981;">MandiTrace Live GPS Tracker</strong><br/>
          <span>Speed: ${speed.toFixed(1)} km/h</span><br/>
          <span>Satellites: ${satellites} | Alt: ${altitude.toFixed(0)}m</span><br/>
          <span style="font-size: 10px; color: #64748b;">${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E</span>
        </div>
      `);
    }
  }, [latitude, longitude, gpsFix, hasData, speed, satellites, altitude]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-border shadow-inner">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Overlay status if no hardware data or searching for GPS */}
      {(!hasData || !gpsFix) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full animate-pulse border border-amber-500/20">
            <span className="text-xl">📡</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {!hasData ? "No Hardware Device Connected" : "GPS Satellite Search Active"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {!hasData
                ? "Waiting for live hardware packets from ESP32 device. Connect your sensor box to stream real-time GPS coordinates."
                : "GPS module is acquiring satellite fix. Standby for live vehicle positioning..."}
            </p>
          </div>
        </div>
      )}

      {/* Top Floating Badge Bar */}
      {hasData && gpsFix && (
        <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE GPS FIX
          </span>
          <span className="text-muted-foreground">|</span>
          <span>{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
          <span className="text-muted-foreground">|</span>
          <span>{satellites} Sats</span>
        </div>
      )}
    </div>
  );
}
