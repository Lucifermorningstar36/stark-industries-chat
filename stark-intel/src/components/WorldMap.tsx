import { useEffect, useRef } from 'react'

// Leaflet'i dinamik import ile yükle (SSR sorunlarını önlemek için)
export default function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Leaflet'i dinamik yükle
    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: true,
      })

      // Dark tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // Örnek hotspot'lar
      const hotspots = [
        { lat: 33.8, lng: 35.5, label: 'Middle East', level: 'HIGH', color: '#f87171' },
        { lat: 50.4, lng: 30.5, label: 'Eastern Europe', level: 'HIGH', color: '#f87171' },
        { lat: 35.6, lng: 139.6, label: 'East Asia', level: 'MED', color: '#f59e0b' },
        { lat: 1.3, lng: 103.8, label: 'SE Asia', level: 'LOW', color: '#34d399' },
        { lat: 40.7, lng: -74.0, label: 'North America', level: 'LOW', color: '#34d399' },
        { lat: 51.5, lng: -0.1, label: 'Europe', level: 'LOW', color: '#34d399' },
        { lat: -23.5, lng: -46.6, label: 'South America', level: 'LOW', color: '#34d399' },
        { lat: 9.0, lng: 38.7, label: 'Africa', level: 'MED', color: '#f59e0b' },
      ]

      hotspots.forEach(h => {
        const icon = L.divIcon({
          html: `<div style="
            width: 12px; height: 12px; border-radius: 50%;
            background: ${h.color};
            border: 2px solid ${h.color};
            box-shadow: 0 0 8px ${h.color}, 0 0 16px ${h.color}40;
            animation: pulse 2s ease-in-out infinite;
          "></div>`,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })

        L.marker([h.lat, h.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="background:#020409;border:1px solid rgba(59,130,246,0.3);padding:8px;border-radius:6px;color:#93c5fd;font-family:monospace;font-size:11px;">
              <div style="color:${h.color};font-weight:bold;margin-bottom:4px;">${h.level} ALERT</div>
              <div>${h.label}</div>
            </div>
          `, { className: 'stark-popup' })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-[1000]">
        <div className="flex items-center gap-4 px-4 py-2 rounded-lg"
          style={{ background: 'rgba(2,4,9,0.8)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(8px)' }}>
          {[
            { color: '#f87171', label: 'HIGH' },
            { color: '#f59e0b', label: 'MEDIUM' },
            { color: '#34d399', label: 'LOW' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="text-[9px] font-mono" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
