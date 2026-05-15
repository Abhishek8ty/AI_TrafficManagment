import { motion } from 'framer-motion'
import { Bell, User, Wifi, WifiOff, CloudSun, ChevronRight, ChevronLeft, Cpu, MapPin } from 'lucide-react'
import SearchBar from '../SearchBar/SearchBar'
import useTrafficStore from '../../store/trafficStore'

export default function Navbar({ socketConnected }) {
  const { weather, alerts, panelExpanded, togglePanel, routes } = useTrafficStore()

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="shrink-0 z-50 flex items-center gap-4 px-5 py-0"
      style={{
        height: 64,
        background: 'rgba(3,13,26,0.97)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg,#0284c7,#00d4ff)',
            boxShadow: '0 0 24px rgba(0,212,255,0.45)',
          }}>
          <Cpu size={16} className="text-white" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#030d1a]"
            style={{ boxShadow: '0 0 6px #00ff88' }} />
        </div>
        <div className="hidden xl:block">
          <div className="text-white font-black text-sm leading-none tracking-tight">AI Traffic Intelligence</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={9} className="text-cyan-400/60" />
            <span className="text-white/25 text-xs">Delhi NCR · Smart City</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Search bar — takes most space */}
      <div className="flex-1 flex items-center justify-center">
        <SearchBar />
      </div>

      {/* Divider */}
      <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Right controls */}
      <div className="flex items-center gap-2.5 shrink-0">

        {/* Live status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{
            background: socketConnected ? 'rgba(0,255,136,0.07)' : 'rgba(239,68,68,0.07)',
            border: `1px solid ${socketConnected ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          {socketConnected
            ? <Wifi size={11} className="text-emerald-400" />
            : <WifiOff size={11} className="text-red-400" />}
          <span className={`text-xs font-bold ${socketConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {socketConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Weather pill */}
        {weather && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CloudSun size={12} className="text-sky-300" />
            <span className="text-white/70 text-xs font-semibold">{weather.temp}°C</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/40 text-xs capitalize">{weather.condition}</span>
          </div>
        )}

        {/* Alerts bell */}
        <button className="relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <Bell size={14} className="text-white/40" />
          {alerts.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-400 pulse-dot" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <User size={13} className="text-purple-300" />
        </div>

        {/* Panel toggle */}
        {routes.length > 0 && (
          <button onClick={togglePanel}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-cyan-500/10"
            style={{ border: '1px solid rgba(0,212,255,0.15)', color: panelExpanded ? '#00d4ff' : 'rgba(226,232,240,0.3)' }}>
            {panelExpanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
    </motion.nav>
  )
}
