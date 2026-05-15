import { create } from 'zustand';

const useTrafficStore = create((set, get) => ({
  // Search
  origin: '',
  destination: '',
  isSearching: false,
  searchError: null,

  // Route data
  routes: [],
  selectedRouteId: null,
  originCoords: null,
  destinationCoords: null,

  // Intelligence
  weather: null,
  prediction: null,
  heatmap: [],
  alerts: [],

  // Camera / YOLO data
  cameraData: [],

  // Live socket data
  liveTraffic: { vehicleCount: 1847, avgSpeed: 42, congestionIndex: 0.54 },

  // UI state
  panelExpanded: true,
  activeTab: 'routes',       // 'routes' | 'prediction' | 'alerts' | 'camera'
  mapView: 'normal',         // 'normal' | 'heatmap' | 'satellite'
  showHeatmap: true,
  showCameras: true,

  // Actions
  setSearching: (v) => set({ isSearching: v }),
  setSearchError: (e) => set({ searchError: e }),

  setRouteData: (data) => set({
    routes: data.routes,
    originCoords: data.origin,
    destinationCoords: data.destination,
    weather: data.weather,
    prediction: data.prediction,
    heatmap: data.heatmap,
    alerts: data.alerts || [],
    selectedRouteId: data.routes.find(r => r.tag === 'ai_recommended')?.id || data.routes[0]?.id,
    isSearching: false,
    searchError: null,
    panelExpanded: true,
    activeTab: 'routes',
  }),

  setSelectedRoute: (id) => set({ selectedRouteId: id }),
  addAlert: (alert) => set(s => ({ alerts: [alert, ...s.alerts].slice(0, 10) })),
  updateLiveTraffic: (d) => set({ liveTraffic: d }),
  updateHeatmap: (h) => set({ heatmap: h }),
  setCameraData: (d) => set({ cameraData: d }),
  setActiveTab: (t) => set({ activeTab: t }),
  togglePanel: () => set(s => ({ panelExpanded: !s.panelExpanded })),
  setMapView: (v) => set({ mapView: v }),
  toggleHeatmap: () => set(s => ({ showHeatmap: !s.showHeatmap })),
  toggleCameras: () => set(s => ({ showCameras: !s.showCameras })),

  getSelectedRoute: () => {
    const { routes, selectedRouteId } = get();
    return routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  },
  getBestRoute: () => {
    const { routes } = get();
    return routes.find(r => r.tag === 'ai_recommended') || routes[0] || null;
  },
}));

export default useTrafficStore;
