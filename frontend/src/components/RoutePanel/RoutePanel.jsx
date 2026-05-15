import { motion, AnimatePresence } from 'framer-motion'
import { Zap, DollarSign, Brain, Clock, Fuel, Leaf, Star, Shield, Route } from 'lucide-react'
import useTrafficStore from '../../store/trafficStore'

const TAG_CONFIG = {
  ai_recommended: { label: 'AI Pick', color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.3)', Icon: Brain },
  fastest:        { label: 'Fastest', color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.3)', Icon: Zap },
  cheapest:       { label: 'Cheapest', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', Icon: DollarSign },
}
const TRAFFIC_COLORS = { low: '#00ff88', medium: '#fbbf24', high: '#f97316', 'very high': '#ef4444' }

function MiniBar({ value, color }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
        animate={{ width: `${Math.min(value * 100, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }} style={{ background: color }} />
    </div>
  )
}

function RouteCard({ route, isSelected, onSelect, index }) {
  const cfg = TAG_CONFIG[route.tag] || TAG_CONFIG.fastest
  const { Icon } = cfg
  const tc = TRAFFIC_COLORS[route.trafficLevel?.toLowerCase()] || '#6b7280'
  return (
    <motion.button onClick={() => onSelect(route.id)}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }} whileHover={{ scale: 1.008 }} whileTap={{ scale: 0.995 }}
      className="w-full text-left rounded-xl p-3 transition-all duration-200"
      style={{ background: isSelected ? cfg.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelected ? cfg.border : 'rgba(255,255,255,0.06)'}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={11} style={{ color: cfg.color }} />
          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          {route.isTollFree && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ color: '#00ff88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', fontSize: 9 }}>FREE</span>
          )}
        </div>
        <span className="text-white/30 text-xs">{route.name}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { l: 'ETA', v: `${route.eta}m`, c: '#00d4ff' },
          { l: 'Toll', v: route.toll === 0 ? 'Free' : `₹${route.toll}`, c: route.toll === 0 ? '#00ff88' : '#fbbf24' },
          { l: 'Fuel', v: `₹${route.fuelCost}`, c: '#f97316' },
          { l: 'Dist', v: `${route.distance}km`, c: '#a78bfa' },
        ].map(({ l, v, c }) => (
          <div key={l} className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="font-bold text-xs" style={{ color: c }}>{v}</div>
            <div className="text-white/30" style={{ fontSize: 9 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <MiniBar value={route.congestion} color={tc} />
        <span className="text-xs shrink-0 font-medium" style={{ color: tc }}>{route.trafficLevel}</span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 9, color: 'rgba(226,232,240,0.35)' }}>🤖 ML: {route.mlCongestionLevel}</span>
        {route.tag === 'ai_recommended' && (
          <div className="flex items-center gap-1">
            <Star size={9} className="text-cyan-400" />
            <span style={{ fontSize: 9, color: '#00d4ff' }}>{route.aiScore}%</span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

function TollIntelligence({ routes }) {
  if (!routes.length) return null
  const fastest = routes.find(r => r.tag === 'fastest') || routes[0]
  const cheapest = routes.find(r => r.tag === 'cheapest') || routes[routes.length - 1]
  const ai = routes.find(r => r.tag === 'ai_recommended') || routes[0]
  const tollFree = routes.find(r => r.isTollFree)
  const maxToll = Math.max(...routes.map(r => r.toll))

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={13} className="text-cyan-400" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">NHAI Toll Intelligence</span>
      </div>
      <div className="space-y-2">
        {[
          { route: fastest, label: 'Route A – Fastest', icon: Zap, color: '#00ff88' },
          { route: cheapest, label: 'Route B – Economical', icon: DollarSign, color: '#fbbf24' },
          { route: ai, label: 'Route C – AI Recommended', icon: Brain, color: '#00d4ff' },
        ].filter(x => x.route).map(({ route, label, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl p-3" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={10} style={{ color }} />
              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { k: 'Time', v: `${route.eta}m` },
                { k: 'Toll', v: route.toll === 0 ? '₹0 Free' : `₹${route.toll}` },
                { k: 'Traffic', v: route.trafficLevel },
                { k: 'Fuel', v: `₹${route.fuelCost}` },
              ].map(({ k, v }) => (
                <div key={k}>
                  <div className="text-white font-semibold" style={{ fontSize: 11 }}>{v}</div>
                  <div className="text-white/30" style={{ fontSize: 9 }}>{k}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      {tollFree && maxToll > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-3 rounded-xl p-2.5 flex items-start gap-2"
          style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot mt-1 shrink-0" />
          <span className="text-emerald-300 text-xs leading-relaxed">
            Toll-free via <b>{tollFree.name}</b> saves ₹{maxToll} — adds {Math.max(0, tollFree.eta - Math.min(...routes.map(r => r.eta)))} min
          </span>
        </motion.div>
      )}
    </div>
  )
}

export default function RoutePanel() {
  const { routes, selectedRouteId, setSelectedRoute, getBestRoute } = useTrafficStore()
  const best = getBestRoute()
  if (!routes.length) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {/* Best route summary */}
        {best && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 glow-blue">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} className="text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Recommended</span>
              <div className="ml-auto flex items-center gap-1">
                <Star size={10} className="text-cyan-400" />
                <span className="text-cyan-400 text-xs font-bold">{best.aiScore}%</span>
              </div>
            </div>
            <div className="text-white font-bold text-base mb-0.5">{best.name}</div>
            <div className="text-white/40 text-xs mb-3">{best.distance} km · {best.trafficLevel} · ML: {best.mlCongestionLevel}</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { Icon: Clock, l: 'ETA', v: `${best.eta} min`, c: '#00d4ff' },
                { Icon: Shield, l: 'Toll', v: best.toll === 0 ? 'FREE' : `₹${best.toll}`, c: best.toll === 0 ? '#00ff88' : '#fbbf24' },
                { Icon: Fuel, l: 'Fuel', v: `₹${best.fuelCost}`, c: '#f97316' },
                { Icon: Leaf, l: 'CO₂', v: `${best.co2} kg`, c: '#00ff88' },
              ].map(({ Icon, l, v, c }) => (
                <div key={l} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-1"><Icon size={10} style={{ color: c }} /><span className="text-white/35 text-xs">{l}</span></div>
                  <div className="text-white font-bold text-sm">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs">AI Score</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${best.aiScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }} style={{ background: 'linear-gradient(90deg,#0ea5e9,#00d4ff)' }} />
              </div>
              <span className="text-cyan-400 text-xs font-bold">{best.aiScore}%</span>
            </div>
          </motion.div>
        )}

        {/* Route options */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Route size={13} className="text-white/40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Route Options</span>
          </div>
          <div className="space-y-2">
            {routes.map((r, i) => (
              <RouteCard key={r.id} route={r} index={i} isSelected={r.id === selectedRouteId} onSelect={setSelectedRoute} />
            ))}
          </div>
        </div>

        {/* NHAI Toll Intelligence */}
        <TollIntelligence routes={routes} />
      </motion.div>
    </AnimatePresence>
  )
}
