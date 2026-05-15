AI Traffic Intelligence — README
# 🚦 AI Traffic Intelligence

A production-grade Smart Traffic Congestion Predictor for Delhi-NCR, built as a real-time full-stack web application with ML-powered route analysis, YOLO camera integration, and a futuristic dark dashboard UI.

---

## 🧠 What It Does

Search any route (e.g. "Connaught Place to Gurgaon") and the entire dashboard updates instantly:

- Real road routes via OSRM (not straight lines)
- ML congestion prediction (Random Forest, 95.8% accuracy)
- Live traffic heatmap from route data + camera feeds
- NHAI toll estimation across 3 route options
- Weather impact on ETA
- YOLO vehicle detection from 10 Delhi-NCR intersections
- Adaptive signal plans per intersection
- Live alerts (accidents, rain, VIP movement, roadblocks)
- Real-time socket updates every 12–25 seconds

---

## 🏗 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| Map | Leaflet + React-Leaflet (OSRM real road routing) |
| Charts | Recharts (sparklines, bar charts, pie/radial) |
| State | Zustand |
| Backend | Node.js + Express 5 + Socket.io |
| Database | MongoDB (graceful fallback to in-memory) |
| ML Server | Python + Flask + scikit-learn (Random Forest) |
| Camera/CV | YOLO v8 integration (simulated when offline) |
| Geocoding | Nominatim (OpenStreetMap) |
| Routing | OSRM public API |
| Weather | OpenWeatherMap API (simulated fallback) |

---

## 📁 Project Structure

traffic/ ├── backend/ │ ├── index.js # Express + Socket.io server │ ├── .env # Environment config │ ├── routes/api.js # All API endpoints │ ├── controllers/ │ │ └── routeController.js # Route search + suggestions │ ├── services/ │ │ ├── routeService.js # OSRM routing + geocoding │ │ ├── cameraService.js # YOLO camera integration │ │ ├── weatherService.js # Weather API │ │ └── alertService.js # Live alert system │ ├── sockets/ │ │ └── trafficSocket.js # Real-time socket events │ ├── utils/ │ │ ├── aiScoring.js # AI route scoring formula │ │ └── trafficSimulator.js # Traffic pattern simulation │ ├── ml/ │ │ ├── train_model.py # Random Forest training script │ │ ├── predict_server.py # Python ML server (port 5001) │ │ ├── predictor.js # JS fallback predictor │ │ └── traffic_model.pkl # Trained model (95.8% accuracy) │ └── models/ │ ├── Route.js # Mongoose route schema │ └── Alert.js # Mongoose alert schema │ ├── frontend/ │ └── src/ │ ├── App.jsx # Root layout + socket init │ ├── store/trafficStore.js # Zustand global state │ ├── hooks/ │ │ ├── useRouteSearch.js # Route search hook │ │ └── useSocket.js # Socket hook │ └── components/ │ ├── Navbar/ # Sticky glassmorphism navbar │ ├── SearchBar/ # Dual-input search with autocomplete │ ├── SmartMap/ # Leaflet map, heatmap, camera markers │ ├── RoutePanel/ # Route cards + NHAI toll intelligence │ ├── PredictionPanel/ # ML prediction + weather impact │ ├── CameraPanel/ # YOLO camera feeds + signal plans │ ├── AlertsPanel/ # Live alert feed │ └── AnalyticsBar/ # Bottom stats strip with sparklines │ └── camera/camera/smart-traffic/ # YOLO + RL traffic system ├── cv/ # detector, tracker, yolo_utils ├── scheduler/ # rule_scheduler, traffic_env, train_sim └── backend/ # app.py stream server (port 8000)


---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (optional — app runs without it)
- pip packages: `scikit-learn flask numpy pandas joblib`

### Install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Python ML dependencies
pip install flask scikit-learn numpy pandas joblib
Run
Start all three servers (in separate terminals or use the provided .bat files):

# 1. ML prediction server (port 5001)
cd backend
python ml/predict_server.py

# 2. Node.js backend (port 5000)
cd backend
node index.js

# 3. React frontend (port 5173)
cd frontend
npm run dev
Or use the batch files in the root:

start-backend.bat
start-frontend.bat
Then open: http://localhost:5173

🔑 Environment Variables
.env
:

PORT=5000
MONGO_URI=mongodb://localhost:27017/traffic_ai
OPENWEATHER_API_KEY=your_key_here   # optional, falls back to simulation
NODE_ENV=development
Get a free OpenWeatherMap key at https://openweathermap.org/api — the app works without it using simulated weather.

🗺 How to Use
Open the app at http://localhost:5173
Type an origin in the left search field — e.g. Connaught Place
Type a destination in the right field — e.g. Gurgaon
Hit Search or press Enter
The map draws 3 real road routes (via OSRM)
The right panel opens with 4 tabs:
Routes — route cards, NHAI toll comparison, AI score
AI Intel — ML congestion probability, weather impact, risk factors
Cameras — YOLO vehicle counts and signal plans per intersection
Alerts — live accident/rain/roadblock alerts
Click any route on the map to select it
Toggle Heatmap and Cameras overlays using the map controls
🤖 AI & ML Details
Route Scoring Formula
AI Score = (ETA efficiency × 40%)
         + (Low traffic    × 30%)
         + (Low toll       × 15%)
         + (Fuel efficiency × 15%)
ML Model
Algorithm: Random Forest Classifier
Dataset: Delhi-NCR traffic patterns
Features: traffic volume, avg speed, weather, rainfall, accidents, events, peak hour, public transport density
Accuracy: 95.8%
Output: Low / Medium / High / Very High congestion level + confidence score
Served via Python Flask on port 5001, with a JS fallback predictor if Python is unavailable
Camera / YOLO
10 Delhi-NCR intersections monitored
Vehicle counts per lane from YOLO v8
Adaptive signal plans using proportional green-time allocation
Falls back to dataset-pattern simulation when YOLO backend is offline
📡 API Endpoints
Method	Endpoint	Description
GET	/api/route/search?origin=&destination=	Full route analysis
GET	/api/route/suggestions?q=	Location autocomplete
GET	/api/camera/all	All camera intersection data
GET	/api/camera/heatmap	Heatmap intensity points
GET	/api/camera/signal/:id	Signal plan for one intersection
GET	/api/camera/intersections	List all intersections
GET	/api/health	Server health check
Socket Events
Event	Direction	Description
traffic:update	server → client	Live vehicle count, speed, congestion index
alert:new	server → client	New accident/rain/roadblock alert
heatmap:update	server → client	Refreshed heatmap points
camera:update	server → client	Updated YOLO camera data
🎨 UI Features
Futuristic dark navy theme with neon blue/green/orange accents
Glassmorphism cards with glow effects
Framer Motion animations on route draw, panel transitions, number updates
Fully responsive — desktop dashboard, collapsible panel on smaller screens
Live pulsing indicators for socket connection, alerts, camera status
Bottom analytics bar with real-time sparklines
📝 Notes
MongoDB is optional. All data falls back to in-memory storage if unavailable.
OSRM routing uses the public demo server. For production, self-host OSRM.
The YOLO camera backend (
app.py
) runs on port 8000. The app simulates camera data when it's offline.
Nominatim geocoding is rate-limited. For production use, add a custom User-Agent and consider a paid geocoding API.
