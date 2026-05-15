import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CloudRain, Construction, Shield, Siren, Bell } from 'lucide-react'
import useTrafficStore from '../../store/trafficStore'

const ALERT_CFG = {
  accident:  { Icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  rain:      { Icon: CloudRain,     color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
  roadblock: { Icon: Construction,  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
  vip:       { Icon: Shield,        color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  emergency: { Icon: Siren,         color: '#ff6b35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)' },
}

function timeAgo(date) {
  const m = Math.floor((Date.now() - new Date(date)) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`
}

export default function AlertsPanel() {
  const { alerts } = useTrafficStore()

  if (!alerts.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Bell size={32} className="text-white/10 mb-3" />
      <p className="text-white/20 text-sm">No active alerts</p>
      <p className="text-white/10 text-xs mt-1">Live monitoring active</p>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={13} className="text-red-400" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Live Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />
            <span className="text-red-400/60 text-xs">{alerts.length} active</span>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence initial={false}>
            {alerts.map((alert, i) => {
              const cfg = ALERT_CFG[alert.type] || ALERT_CFG.accident
              const { Icon } = cfg
              return (
                <motion.div key={alert._id || i}
                  initial={{ opacity: 0, x: -8, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5 rounded-xl p-2.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Icon size={12} style={{ color: cfg.color }} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 leading-relaxed">{alert.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.6 }}>{timeAgo(alert.createdAt)}</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
