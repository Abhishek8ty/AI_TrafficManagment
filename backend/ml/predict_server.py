"""
Lightweight Flask prediction microservice.
Called by Node.js backend for ML predictions.
Run: python ml/predict_server.py
"""
import json, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    import joblib, numpy as np
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'traffic_model.pkl')
    META_PATH  = os.path.join(os.path.dirname(__file__), 'model_meta.json')
    model = joblib.load(MODEL_PATH)
    with open(META_PATH) as f:
        meta = json.load(f)
    LABELS = meta['labels']
    print(f"Model loaded. Accuracy: {meta['accuracy']*100:.1f}%")
    MODEL_LOADED = True
except Exception as e:
    print(f"Model not loaded: {e}")
    MODEL_LOADED = False

WEATHER_MAP = {"Clear":0,"Cloudy":1,"Fog":2,"Rain":3,"Heavy Rain":4}

def predict(data):
    if not MODEL_LOADED:
        return {"error": "model not loaded"}
    vol  = float(data.get('trafficVolume', 400))
    spd  = float(data.get('avgSpeed', 35))
    wth  = WEATHER_MAP.get(data.get('weather','Clear'), 0)
    rain = float(data.get('rainMm', 0))
    acc  = float(data.get('accident', 0))
    evt  = float(data.get('event', 0))
    ptd  = float(data.get('publicTransportDensity', 50))
    hr   = float(data.get('hour', 12))
    is_peak  = 1.0 if hr in [7,8,9,17,18,19,20] else 0.0
    is_night = 1.0 if hr in [22,23,0,1,2,3,4] else 0.0
    svr  = spd / (vol + 1)
    X = np.array([[vol, spd, wth, rain, acc, evt, ptd, hr, is_peak, is_night, svr]])
    pred = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    return {
        "congestionLevel": LABELS[str(pred)],
        "congestionIndex": pred / 3.0,
        "confidence": int(max(proba) * 100),
        "probabilities": {LABELS[str(i)]: round(float(p)*100,1) for i,p in enumerate(proba)}
    }

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        result = predict(body)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    server = HTTPServer(('localhost', port), Handler)
    print(f"ML prediction server running on http://localhost:{port}")
    server.serve_forever()
