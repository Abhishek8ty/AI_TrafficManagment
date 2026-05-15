import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { io } from 'socket.io-client'
import { Brain, Route, Bell, Camera } from 'lucide-react'
import axios from 'axios'
import Navbar from './components/Navbar/Navbar'
import SmartMap from './components/SmartMap/SmartMap'
import RoutePanel from './components/RoutePanel/RoutePanel'
import PredictionPanel from './components/PredictionPanel/PredictionPanel'
import AlertsPanel from './components/AlertsPanel/AlertsPanel'
import CameraPanel from './components/CameraPanel/CameraPanel'
import AnalyticsBar from './components/AnalyticsBar/AnalyticsBar'
import useTrafficStore from './store/trafficStore'

const TABS = [
  { id: 'routes',     label: 'Routes',  Icon: Route,  badge: null },
  { id: 'prediction', label: 'AI Intel', Icon: Brain,  badge: null },
  { id: 'camera',     label: 'Cameras', Icon: Camera, badge: null },
  { id: 'alerts',     label: 'Alerts',  Icon: Bell,   badge: 'alerts' },
]

export default function App() {
  const [socketConnected, setSocketConnected] = useState(false)
  const {
    updateLiveTraffic, addAlert, updateHeatmap, setCameraData,
    routes, panelExpanded, activeTab, setActiveTab, alerts,
  } = useTrafficStore()

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      timeout: 5000,
    })
    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('traffic:update', updateLiveTraffic)
    socket.on('alert:new', addAlert)
    socket.on('heatmap:update', updateHeatmap)
    socket.on('camera:update', setCameraData)
    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    const load = () => axios.get('/api/camera/all').then(r => setCameraData(r.data)).catch(() => {})
    load()
    const iv = setInterval(load, 25000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#071525', color: '#e2e8f0', border: '1px solid rgba(0,212,255,0.2)', fontSize: 12, borderRadius: 10 }
      }} />

      <Navbar socketConnected={socketConnected} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Map — left side, takes remaining width */}
        <div className="flex-1 min-w-0 p-3 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-0">
            <SmartMap />
          </div>
        </div>

        {/* Right panel — always visible after search, fixed width */}
        <AnimatePresence>
          {panelExpanded && (
            <motion.aside
              key="side-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col shrink-0 overflow-hidden"
              style={{ borderLeft: '1px solid rgba(0,212,255,0.08)' }}
            >
              {/* Tab bar */}
              <div className="flex items-center gap-1.5 px-3 pt-3 pb-2.5 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {TABS.map(({ id, label, Icon, badge }) => {
                  const isActive = activeTab === id
                  const count = badge === 'alerts' ? alerts.length : 0
                  return (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`tab-btn ${isActive ? 'active' : ''}`}>
                      <Icon size={11} />
                      {label}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center font-bold"
                          style={{ fontSize: 8 }}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'thin' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'routes' && (
                    <motion.div key="routes"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      <RoutePanel />
                    </motion.div>
                  )}
                  {activeTab === 'prediction' && (
                    <motion.div key="prediction"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      <PredictionPanel />
                    </motion.div>
                  )}
                  {activeTab === 'camera' && (
                    <motion.div key="camera"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      <CameraPanel />
                    </motion.div>
                  )}
                  {activeTab === 'alerts' && (
                    <motion.div key="alerts"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
                      <AlertsPanel />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AnalyticsBar />
    </div>
  )
}
