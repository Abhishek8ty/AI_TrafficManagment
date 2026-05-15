import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Thermometer } from 'lucide-react'
import useTrafficStore from '../../store/trafficStore'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ROUTE_COLORS = {
  ai_recommended: '#00d4ff',
  fastest: '#00ff88',
  cheapest: '#fbbf24',
  default: '#64748b',
}
const TRAFFIC_COLORS = { low: '#00ff88', medium: '#fbbf24', high: '#f97316', 'very high': '#ef4444' }
const CONGESTION_COLORS = { Low: '#00ff88', Medium: '#fbbf24', High: '#f97316', 'Very High': '#ef4444' }

function pinIcon(color, size = 14) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 14px ${color},0 0 6px ${color}"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function cameraIcon(color) {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:rgba(10,22,40,0.9);border:2px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}40;cursor:pointer"><svg width="9" height="9" viewBox="0 0 24 24" fill="${color}"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function MapFly({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 })
  }, [center?.[0], center?.[1], zoom])
  return null
}

function HeatmapLayer({ points }) {
  return (
    <LayerGroup>
      {points.map((p, i) => {
        const r = 10 + p.intensity * 20
        const color = p.intensity > 0.7 ? '#ef4444' : p.intensity > 0.45 ? '#f97316' : p.intensity > 0.2 ? '#fbbf24' : '#00ff88'
        return (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={r}
            pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: 0.18 + p.intensity * 0.22 }}
          >
            <Popup>
              <div style={{ padding: '8px 12px', minWidth: 140 }}>
                <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{p.name || 'Traffic Zone'}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Vehicles: {p.vehicles || Math.round(p.intensity * 400)}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Congestion: {p.congestion || (p.intensity > 0.7 ? 'Very High' : p.intensity > 0.4 ? 'High' : 'Medium')}</div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </LayerGroup>
  )
}

function CameraLayer({ cameras }) {
  return (
    <LayerGroup>
      {cameras.map((cam) => {
        const color = CONGESTION_COLORS[cam.congestionLevel] || '#6b7280'
        return (
          <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={cameraIcon(color)}>
            <Popup>
              <div style={{ padding: '10px 14px', minWidth: 180 }}>
                <div style={{ color, fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📷</span> {cam.name}
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8, opacity: 0.8 }}>
                  <div>Total Vehicles: <b style={{ color }}>{cam.totalVehicles}</b></div>
                  <div>Congestion: <b style={{ color }}>{cam.congestionLevel}</b></div>
                  {cam.counts && Object.entries(cam.counts).map(([lane, count]) => (
                    <div key={lane}>{lane}: <b>{count}</b> vehicles</div>
                  ))}
                  {cam.plan && (
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ color: '#00d4ff', fontSize: 10, marginBottom: 2 }}>Signal Plan (sec)</div>
                      {Object.entries(cam.plan).map(([lane, time]) => (
                        <div key={lane}>{lane}: <b style={{ color: '#00ff88' }}>{time}s</b></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </LayerGroup>
  )
}

export default function SmartMap() {
  const {
    routes, selectedRouteId, originCoords, destinationCoords,
    heatmap, isSearching, setSelectedRoute, cameraData,
    showHeatmap, showCameras, toggleHeatmap, toggleCameras,
  } = useTrafficStore()

  const center = useMemo(() => {
    if (originCoords && destinationCoords)
      return [(originCoords.lat + destinationCoords.lat) / 2, (originCoords.lng + destinationCoords.lng) / 2]
    return [28.6139, 77.2090]
  }, [originCoords?.lat, destinationCoords?.lat])

  const zoom = useMemo(() => {
    if (!originCoords || !destinationCoords) return 11
    const d = Math.sqrt(
      Math.pow(originCoords.lat - destinationCoords.lat, 2) +
      Math.pow(originCoords.lng - destinationCoords.lng, 2)
    )
    return d > 3 ? 8 : d > 1 ? 10 : d > 0.3 ? 12 : 13
  }, [originCoords?.lat, destinationCoords?.lat])

  const allHeatPoints = useMemo(() => {
    const pts = [...heatmap]
    cameraData.forEach(cam => {
      pts.push({
        lat: cam.lat,
        lng: cam.lng,
        intensity: Math.min(1, cam.totalVehicles / 400),
        name: cam.name,
        vehicles: cam.totalVehicles,
        congestion: cam.congestionLevel,
      })
    })
    return pts
  }, [heatmap, cameraData])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.1)' }}>
      <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFly center={center} zoom={zoom} />

        {showHeatmap && allHeatPoints.length > 0 && <HeatmapLayer points={allHeatPoints} />}
        {showCameras && cameraData.length > 0 && <CameraLayer cameras={cameraData} />}

        {routes.map(route => {
          const coords = route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || []
          const isSelected = route.id === selectedRouteId
          const color = ROUTE_COLORS[route.tag] || TRAFFIC_COLORS[route.trafficLevel?.toLowerCase()] || ROUTE_COLORS.default
          return (
            <Polyline
              key={route.id}
              positions={coords}
              pathOptions={{
                color,
                weight: isSelected ? 7 : 4,
                opacity: isSelected ? 1 : 0.5,
                dashArray: route.tag === 'ai_recommended' ? undefined : '10 6',
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{ click: () => setSelectedRoute(route.id) }}
            >
              <Popup>
                <div style={{ padding: '10px 14px', minWidth: 170 }}>
                  <div style={{ color, fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{route.name}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.9, opacity: 0.85 }}>
                    <div>⏱ ETA: <b>{route.eta} min</b></div>
                    <div>📍 Distance: <b>{route.distance} km</b></div>
                    <div>🛣 Toll: <b>{route.toll === 0 ? 'FREE' : `₹${route.toll}`}</b></div>
                    <div>⛽ Fuel: <b>₹{route.fuelCost}</b></div>
                    <div>🤖 ML: <b>{route.mlCongestionLevel}</b></div>
                    <div>📊 Traffic: <b style={{ color: TRAFFIC_COLORS[route.trafficLevel?.toLowerCase()] }}>{route.trafficLevel}</b></div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          )
        })}

        {originCoords && (
          <Marker position={[originCoords.lat, originCoords.lng]} icon={pinIcon('#00ff88', 16)}>
            <Popup>
              <div style={{ padding: '8px 12px' }}>
                <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 12 }}>📍 Origin</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{originCoords.label?.split(',').slice(0, 2).join(', ')}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={pinIcon('#ff6b35', 16)}>
            <Popup>
              <div style={{ padding: '8px 12px' }}>
                <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12 }}>🏁 Destination</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{destinationCoords.label?.split(',').slice(0, 2).join(', ')}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={toggleHeatmap}
          className={`map-control-btn flex items-center gap-1.5 ${showHeatmap ? 'active' : ''}`}
        >
          <Thermometer size={11} />
          <span>Heatmap</span>
        </button>
        <button
          onClick={toggleCameras}
          className={`map-control-btn flex items-center gap-1.5 ${showCameras ? 'active' : ''}`}
        >
          <Camera size={11} />
          <span>Cameras</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl px-3 py-2.5 space-y-1.5">
        <div className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1">Routes</div>
        {[
          { color: '#00d4ff', label: 'AI Recommended' },
          { color: '#00ff88', label: 'Fastest', dash: true },
          { color: '#fbbf24', label: 'Cheapest', dash: true },
        ].map(({ color, label, dash }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width="22" height="4">
              <line x1="0" y1="2" x2="22" y2="2" stroke={color} strokeWidth="2.5" strokeDasharray={dash ? '6 3' : 'none'} strokeLinecap="round" />
            </svg>
            <span style={{ color: 'rgba(226,232,240,0.5)', fontSize: 10 }}>{label}</span>
          </div>
        ))}
        <div className="border-t border-white/[0.06] pt-1.5 mt-1">
          <div className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1">Heatmap</div>
          <div className="flex items-center gap-1.5">
            {['#00ff88', '#fbbf24', '#f97316', '#ef4444'].map((c, i) => (
              <div key={i} className="w-4 h-2 rounded-sm" style={{ background: c, opacity: 0.7 }} />
            ))}
            <span style={{ fontSize: 9, color: 'rgba(226,232,240,0.4)' }}>Low → High</span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1001] flex items-center justify-center rounded-2xl"
            style={{ background: 'rgba(2,12,27,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="absolute inset-0 rounded-full"
                    style={{ border: '1.5px solid rgba(0,212,255,0.6)' }}
                    animate={{ scale: [1, 3], opacity: [0.8, 0] }}
                    transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 16px #00d4ff' }} />
                </div>
              </div>
              <p className="text-cyan-400 text-sm font-bold">AI Analyzing Route</p>
              <p className="text-white/30 text-xs mt-1">Fetching real road data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {routes.length === 0 && !isSearching && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
          <div className="text-center">
            <div className="text-6xl mb-3 opacity-[0.07]">🗺</div>
            <p className="text-white/15 text-sm">Search a route to begin</p>
          </div>
        </div>
      )}
    </div>
  )
}
