import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts'
import { Car, Gauge, TrendingUp, Activity, Zap } from 'lucide-react'
import useTrafficStore from '../../store/trafficStore'

function Spark({ data, color, type = 'area' }) {
  const id = `grad_${color.replace('#', '')}`
  if (type === 'line') return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
        <Tooltip contentStyle={{ background: '#020c1b', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10, padding: '3px 8px' }}
          formatter={v => [Math.round(v), '']} labelFormatter={() => ''} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsBar() {
  const { liveTraffic, cameraData } = useTrafficStore()
  const pct = Math.round(liveTraffic.congestionIndex * 100)
  const congColor = pct > 70 ? '#ef4444' : pct > 40 ? '#f97316' : '#00ff88'

  const densityData = useMemo(() =>
    Array.from({ length: 20 }, () => ({ v: Math.max(5, pct + (Math.random() - 0.5) * 22) })), [pct])
  const speedData = useMemo(() =>
    Array.from({ length: 20 }, () => ({ v: Math.max(8, liveTraffic.avgSpeed + (Math.random() - 0.5) * 20) })), [liveTraffic.avgSpeed])

  const totalCamVehicles = cameraData.reduce((a, c) => a + c.totalVehicles, 0)

  return (
    <div className="glass border-t border-white/[0.05] px-4 py-2 flex items-center gap-4 shrink-0 overflow-x-auto">
      {/* Live dot */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
        <span className="text-white/30 text-xs font-bold tracking-widest">LIVE</span>
      </div>
      <div className="w-px h-5 bg-white/[0.06] shrink-0" />

      {/* Vehicles */}
      <div className="flex items-center gap-2 shrink-0">
        <Car size={12} className="text-cyan-400" />
        <div>
          <motion.div key={liveTraffic.vehicleCount} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold text-sm leading-none">{liveTraffic.vehicleCount.toLocaleString()}</motion.div>
          <div className="text-white/30 text-xs">Vehicles</div>
        </div>
      </div>
      <div className="w-px h-5 bg-white/[0.06] shrink-0" />

      {/* Speed with sparkline */}
      <div className="flex items-center gap-2 shrink-0">
        <Gauge size={12} className="text-green-400" />
        <div>
          <div className="text-white font-bold text-sm leading-none">{liveTraffic.avgSpeed} km/h</div>
          <div className="text-white/30 text-xs">Avg Speed</div>
        </div>
        <div className="w-16 h-7"><Spark data={speedData} color="#00ff88" /></div>
      </div>
      <div className="w-px h-5 bg-white/[0.06] shrink-0" />

      {/* Congestion */}
      <div className="flex items-center gap-2 shrink-0">
        <TrendingUp size={12} style={{ color: congColor }} />
        <div>
          <div className="font-bold text-sm leading-none" style={{ color: congColor }}>{pct}%</div>
          <div className="text-white/30 text-xs">Congestion</div>
        </div>
      </div>
      <div className="w-px h-5 bg-white/[0.06] shrink-0" />

      {/* Camera vehicles */}
      {cameraData.length > 0 && (
        <>
          <div className="flex items-center gap-2 shrink-0">
            <Activity size={12} className="text-purple-400" />
            <div>
              <div className="text-white font-bold text-sm leading-none">{totalCamVehicles.toLocaleString()}</div>
              <div className="text-white/30 text-xs">YOLO Detected</div>
            </div>
          </div>
          <div className="w-px h-5 bg-white/[0.06] shrink-0" />
        </>
      )}

      {/* Density sparkline */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-white/25 text-xs shrink-0">Traffic Density</span>
        <div className="flex-1 h-8 min-w-[80px]"><Spark data={densityData} color={congColor} /></div>
      </div>

      {/* Status badge */}
      <div className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1"
        style={{ background: `${congColor}12`, border: `1px solid ${congColor}25` }}>
        <Zap size={10} style={{ color: congColor }} />
        <span className="text-xs font-bold" style={{ color: congColor }}>
          {pct > 70 ? 'Very High' : pct > 40 ? 'Moderate' : 'Smooth'}
        </span>
      </div>
    </div>
  )
}
