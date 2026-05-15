import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, X, Loader2, ArrowLeftRight, Navigation } from 'lucide-react'
import axios from 'axios'
import useTrafficStore from '../../store/trafficStore'
import { useRouteSearch } from '../../hooks/useRouteSearch'

function useSuggestions(query, enabled) {
  const [suggestions, setSuggestions] = useState([])
  const timer = useRef(null)
  useEffect(() => {
    if (!enabled || !query || query.length < 2) { setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const res = await axios.get('/api/route/suggestions', { params: { q: query }, timeout: 5000 })
        setSuggestions(res.data.slice(0, 6))
      } catch { setSuggestions([]) }
    }, 280)
    return () => clearTimeout(timer.current)
  }, [query, enabled])
  return [suggestions, setSuggestions]
}

export default function SearchBar() {
  const { isSearching, searchError } = useTrafficStore()
  const { search } = useRouteSearch()
  const [originVal, setOriginVal] = useState('')
  const [destVal, setDestVal] = useState('')
  const [focus, setFocus] = useState(null)
  const originRef = useRef(null)
  const destRef = useRef(null)

  const [originSugg, setOriginSugg] = useSuggestions(originVal, focus === 'origin')
  const [destSugg, setDestSugg] = useSuggestions(destVal, focus === 'dest')
  const suggestions = focus === 'origin' ? originSugg : destSugg

  const doSearch = useCallback(() => {
    if (originVal.trim() && destVal.trim()) search(originVal.trim(), destVal.trim())
  }, [originVal, destVal, search])

  const pick = (field, label) => {
    if (field === 'origin') { setOriginVal(label); setOriginSugg([]) }
    else { setDestVal(label); setDestSugg([]) }
    setFocus(null)
    setTimeout(() => {
      const o = field === 'origin' ? label : originVal
      const d = field === 'dest' ? label : destVal
      if (o && d) search(o.trim(), d.trim())
    }, 80)
  }

  const swap = () => {
    const t = originVal
    setOriginVal(destVal)
    setDestVal(t)
  }

  const inputStyle = (active) => ({
    background: active ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(0,212,255,0.45)' : 'rgba(255,255,255,0.09)'}`,
    boxShadow: active ? '0 0 0 3px rgba(0,212,255,0.07), 0 0 20px rgba(0,212,255,0.08)' : 'none',
    transition: 'all 0.2s',
  })

  return (
    <div className="relative flex items-center gap-2 w-full" style={{ maxWidth: 780 }}>

      {/* Origin input */}
      <div className="relative flex-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 rounded-full"
          style={{ background: 'rgba(0,255,136,0.15)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #00ff88' }} />
        </div>
        <input
          ref={originRef}
          value={originVal}
          onChange={e => setOriginVal(e.target.value)}
          onFocus={() => setFocus('origin')}
          onBlur={() => setTimeout(() => setFocus(null), 180)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="From — Delhi, Noida, CP..."
          className="search-input w-full h-11 rounded-xl pl-10 pr-9 text-sm text-white placeholder-white/20 outline-none"
          style={inputStyle(focus === 'origin')}
        />
        {originVal && (
          <button onClick={() => setOriginVal('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Swap button */}
      <motion.button
        onClick={swap}
        whileTap={{ rotate: 180, scale: 0.9 }}
        transition={{ duration: 0.25 }}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-cyan-500/10"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(226,232,240,0.35)' }}>
        <ArrowLeftRight size={13} />
      </motion.button>

      {/* Destination input */}
      <div className="relative flex-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 rounded-full"
          style={{ background: 'rgba(255,107,53,0.15)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#ff6b35', boxShadow: '0 0 8px #ff6b35' }} />
        </div>
        <input
          ref={destRef}
          value={destVal}
          onChange={e => setDestVal(e.target.value)}
          onFocus={() => setFocus('dest')}
          onBlur={() => setTimeout(() => setFocus(null), 180)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="To — Gurgaon, Airport, NH48..."
          className="search-input w-full h-11 rounded-xl pl-10 pr-9 text-sm text-white placeholder-white/20 outline-none"
          style={inputStyle(focus === 'dest')}
        />
        {destVal && (
          <button onClick={() => setDestVal('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search button */}
      <motion.button
        onClick={doSearch}
        disabled={isSearching || !originVal || !destVal}
        whileTap={{ scale: 0.95 }}
        className="shrink-0 h-11 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: isSearching
            ? 'rgba(0,212,255,0.08)'
            : 'linear-gradient(135deg, rgba(0,212,255,0.22), rgba(0,212,255,0.1))',
          border: '1px solid rgba(0,212,255,0.4)',
          color: '#00d4ff',
          boxShadow: '0 0 24px rgba(0,212,255,0.18)',
        }}>
        {isSearching
          ? <Loader2 size={14} className="animate-spin" />
          : <Navigation size={14} />}
        <span>{isSearching ? 'Analyzing...' : 'Search'}</span>
      </motion.button>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && focus && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full mt-2 left-0 z-[9999] rounded-2xl overflow-hidden"
            style={{
              width: 'calc(100% - 52px)',
              background: 'rgba(3,13,26,0.99)',
              border: '1px solid rgba(0,212,255,0.22)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(0,212,255,0.06)',
            }}>
            {suggestions.map((s, i) => (
              <button key={i} onMouseDown={() => pick(focus, s.label)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-white/[0.04] last:border-0"
                style={{ ':hover': { background: 'rgba(0,212,255,0.06)' } }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,212,255,0.1)' }}>
                  <MapPin size={11} className="text-cyan-400" />
                </div>
                <span className="text-white/70 text-xs truncate">{s.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl px-4 py-3 text-xs flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            <span>⚠</span> {searchError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
