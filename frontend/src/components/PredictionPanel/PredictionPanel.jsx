import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertTriangle, CloudRain, Activity, Brain, Droplets, Wind, Eye } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import useTrafficStore from '../../store/trafficStore'

const RISK_CFG = {
  low:    { color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

function RiskBadge({ level }) {
  const cfg = RISK_CFG[level?.toLowerCase()] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
      style={{ color: cfg.color, background: cfg.bg }}>
      {level}
    </span>
  )
}

function CongestionGauge({ probability }) {
  const color = probability > 70 ? '#ef4444' : probability > 40 ? '#f97316' : '#00ff88'
  const data = [{ value: probability, fill: color }, { value: 100 - probability, fill: 'rgba(255,255,255,0.05)' }]
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={36} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={data[i].fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{probability}%</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-white/50 text-xs mb-1">Congestion Probability</div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }}
            animate={{ width: `${probability}%` }} transition={{ duration: 1, ease: 'easeOut' }}
            style={{ background: `linear-gradient(90deg, #00ff88, ${color})` }} />
        </div>
        <div className="text-white/30 text-xs mt-1">
          {probability > 70 ? 'High risk — depart now' : probability > 40 ? 'Moderate — monitor' : 'Low risk — clear roads'}
        </div>
      </div>
    </div>
  )
}

export default function PredictionPanel() {
  const { prediction, weather, getBestRoute } = useTrafficStore()
  const bestRoute = getBestRoute()
  if (!prediction && !weather) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Brain size={32} className="text-white/10 mb-3" />
      <p className="text-white/20 text-sm">Search a route to see AI predictions</p>
    </div>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

        {/* AI Prediction */}
        {prediction && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={13} className="text-orange-400" />
              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Live AI Prediction</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 pulse-dot" />
                <span className="text-orange-400/60 text-xs">Live</span>
              </div>
            </div>

            <CongestionGauge probability={prediction.probability} />

            <div className="mt-4 space-y-2">
              {[
                { label: 'Expected in', value: `${prediction.minutesUntil} min` },
                { label: 'Accident Risk', value: <RiskBadge level={prediction.accidentRisk} /> },
                { label: 'Expected Level', value: <RiskBadge level={prediction.expectedLevel} /> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-white/40 text-xs">{label}</span>
                  {typeof value === 'string' ? <span className="text-white text-xs font-semibold">{value}</span> : value}
                </div>
              ))}
            </div>

            {prediction.probability > 60 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl p-2.5 flex items-start gap-2"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <TrendingUp size={11} className="text-orange-400 mt-0.5 shrink-0" />
                <p className="text-orange-300 text-xs leading-relaxed">
                  {prediction.probability}% congestion in {prediction.minutesUntil} min. Consider departing now or using AI recommended route.
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* ML Factors */}
        {bestRoute?.mlFactors?.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} className="text-cyan-400" />
              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">ML Congestion Factors</span>
            </div>
            <div className="space-y-1.5">
              {bestRoute.mlFactors.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-white/60 text-xs">{f.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40 text-xs">{f.value}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        color: f.impact === 'high' ? '#ef4444' : f.impact === 'medium' ? '#f97316' : '#00ff88',
                        background: f.impact === 'high' ? 'rgba(239,68,68,0.1)' : f.impact === 'medium' ? 'rgba(249,115,22,0.1)' : 'rgba(0,255,136,0.1)',
                        fontSize: 9
                      }}>{f.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weather */}
        {weather && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CloudRain size={13} className="text-blue-400" />
              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Weather Impact</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-bold capitalize text-sm">{weather.condition}</div>
                <div className="text-white/35 text-xs mt-0.5">{weather.description}</div>
              </div>
              {weather.impact?.etaMultiplier > 1 && (
                <div className="text-right">
                  <div className="text-orange-400 font-black text-base">+{Math.round((weather.impact.etaMultiplier - 1) * 100)}%</div>
                  <div className="text-white/30 text-xs">ETA impact</div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { Icon: Droplets, l: 'Humidity', v: `${weather.humidity}%`, c: '#60a5fa' },
                { Icon: Wind, l: 'Wind', v: `${weather.windSpeed}km/h`, c: '#a78bfa' },
                { Icon: Eye, l: 'Visibility', v: `${weather.visibility}km`, c: '#00d4ff' },
              ].map(({ Icon, l, v, c }) => (
                <div key={l} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Icon size={10} style={{ color: c }} className="mx-auto mb-1" />
                  <div className="text-white font-semibold text-xs">{v}</div>
                  <div className="text-white/30" style={{ fontSize: 9 }}>{l}</div>
                </div>
              ))}
            </div>
            {weather.impact?.severity !== 'none' && (
              <div className="rounded-xl p-2.5 flex items-center gap-2"
                style={{
                  background: weather.impact.severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
                  borderLeft: `2px solid ${weather.impact.severity === 'high' ? '#ef4444' : '#fbbf24'}`,
                }}>
                <AlertTriangle size={10} style={{ color: weather.impact.severity === 'high' ? '#ef4444' : '#fbbf24' }} />
                <span className="text-xs" style={{ color: weather.impact.severity === 'high' ? '#fca5a5' : '#fde68a' }}>
                  {weather.impact.label}
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
