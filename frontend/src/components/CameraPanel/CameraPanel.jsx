import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Activity, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import useTrafficStore from '../../store/trafficStore'

const CONGESTION_COLORS = {
  Low: '#00ff88', Medium: '#fbbf24', High: '#f97316', 'Very High': '#ef4444'
}

function SignalBar({ lane, time, maxTime = 60 }) {
  const pct = (time / maxTime) * 100
  const color = time > 40 ? '#00ff88' : time > 25 ? '#fbbf24' : '#f97316'
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-xs w-10 shrink-0">{lane}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }} />
      </div>
      <span className="text-xs font-bold shrink-0" style={{ color }}>{time}s</span>
    </div>
  )
}

function CameraCard({ cam, index }) {
  const color = CONGESTION_COLORS[cam.congestionLevel] || '#6b7280'
  const chartData = cam.counts ? Object.entries(cam.counts).map(([lane, count]) => ({ lane, count })) : []

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl p-3" style={{ background: `${color}06`, border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
            <Camera size={11} style={{ color }} />
          </div>
          <div>
            <div className="text-white text-xs font-semibold">{cam.name}</div>
            <div className="text-white/30" style={{ fontSize: 9 }}>{cam.id}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold" style={{ color }}>{cam.congestionLevel}</div>
          <div className="text-white/40" style={{ fontSize: 9 }}>{cam.totalVehicles} vehicles</div>
        </div>
      </div>

      {/* Vehicle count bar chart */}
      {chartData.length > 0 && (
        <div className="h-16 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="lane" tick={{ fontSize: 8, fill: 'rgba(226,232,240,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'rgba(226,232,240,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(2,12,27,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                formatter={(v) => [`${v} vehicles`, 'Count']}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Signal plan */}
      {cam.plan && (
        <div className="space-y-1">
          <div className="text-white/30 text-xs mb-1">Signal Plan</div>
          {Object.entries(cam.plan).map(([lane, time]) => (
            <SignalBar key={lane} lane={lane} time={time} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function CameraPanel() {
  const { cameraData } = useTrafficStore()

  if (!cameraData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Camera size={32} className="text-white/10 mb-3" />
        <p className="text-white/20 text-sm">Loading camera data...</p>
        <p className="text-white/10 text-xs mt-1">YOLO vehicle detection active</p>
      </div>
    )
  }

  const totalVehicles = cameraData.reduce((a, c) => a + c.totalVehicles, 0)
  const avgCongestion = cameraData.filter(c => c.congestionLevel === 'Very High' || c.congestionLevel === 'High').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Summary */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={13} className="text-cyan-400" />
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">YOLO Detection Summary</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            <span className="text-green-400/60 text-xs">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: 'Cameras', v: cameraData.length, c: '#00d4ff' },
            { l: 'Vehicles', v: totalVehicles.toLocaleString(), c: '#00ff88' },
            { l: 'High Traffic', v: avgCongestion, c: '#ef4444' },
          ].map(({ l, v, c }) => (
            <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="font-bold text-sm" style={{ color: c }}>{v}</div>
              <div className="text-white/30 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Camera cards */}
      <div className="space-y-2">
        {cameraData.map((cam, i) => <CameraCard key={cam.id} cam={cam} index={i} />)}
      </div>
    </motion.div>
  )
}
