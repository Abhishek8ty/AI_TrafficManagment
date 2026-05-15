"""
AI Traffic Congestion Predictor - ML Model Training
Uses the Delhi/NCR traffic dataset to train a Random Forest classifier
that predicts congestion level from traffic features.
"""
import json, os, sys
import numpy as np

# ── Embedded dataset (sampled from the provided CSV) ──────────────────────────
# Columns: traffic_volume, avg_speed, weather_code, rain_mm, accident, event,
#          public_transport_density, hour, congestion_label
# weather_code: 0=Clear,1=Cloudy,2=Fog,3=Rain,4=Heavy Rain
# congestion_label: 0=Low,1=Medium,2=High,3=Very High

WEATHER_MAP = {"Clear":0,"Cloudy":1,"Fog":2,"Rain":3,"Heavy Rain":4}
CONGESTION_MAP = {"Low":0,"Medium":1,"High":2,"Very High":3}

RAW = [
  # [vol, speed, weather, rain, accident, event, ptd, hour, label]
  [420,18,0,0,0,0,65,8,3],[510,12,1,0,1,0,70,8,3],[300,35,0,0,0,0,40,8,1],
  [460,15,3,6,0,1,80,9,2],[620,10,4,14,1,1,90,9,3],[793,6,3,19,0,0,57,0,3],
  [403,44,2,0,0,0,33,0,0],[120,47,0,0,1,1,45,0,0],[539,8,4,12,1,0,60,0,3],
  [337,48,0,0,0,0,23,0,0],[354,35,4,2,0,0,84,0,1],[502,25,4,8,0,0,43,1,1],
  [442,41,0,0,0,0,96,1,0],[774,7,4,2,0,0,12,1,3],[485,26,3,12,0,0,34,1,1],
  [423,42,2,0,0,0,46,1,0],[727,7,0,0,1,0,61,1,3],[183,43,0,0,1,0,70,2,0],
  [848,5,4,5,0,0,75,2,3],[656,27,2,0,0,0,52,2,1],[648,27,1,0,0,0,69,2,1],
  [175,47,4,10,0,0,20,2,0],[441,26,2,0,1,0,32,2,1],[695,5,4,13,1,0,40,3,3],
  [564,33,2,0,0,0,40,3,1],[204,57,1,0,0,0,81,3,0],[338,48,0,0,0,0,53,3,0],
  [557,33,1,0,0,0,68,3,1],[212,41,1,0,1,0,53,3,0],[116,63,0,0,0,0,59,3,0],
  [621,29,1,0,0,1,49,4,1],[488,38,1,0,0,1,55,4,1],[681,13,3,20,0,0,15,4,3],
  [572,20,4,7,0,0,84,4,2],[488,38,1,0,0,1,55,4,1],[676,13,1,0,0,0,15,5,3],
  [774,19,1,0,0,0,55,5,3],[304,38,3,11,0,0,49,5,1],[355,47,2,0,0,0,32,5,0],
  [437,29,4,19,0,1,15,5,1],[568,33,1,0,0,0,84,6,1],[518,21,2,0,1,0,57,6,2],
  [485,38,1,0,0,0,55,6,1],[58,67,0,0,0,1,45,6,0],[525,8,3,6,1,0,52,6,3],
  [125,50,3,1,0,1,42,6,0],[130,62,0,0,0,0,90,7,0],[659,5,3,8,1,1,71,7,3],
  [224,56,1,0,0,0,10,7,0],[804,5,0,0,1,0,49,7,3],[763,8,3,8,0,0,34,7,3],
  [330,36,4,14,0,0,34,7,1],[85,50,2,0,1,0,93,8,0],[706,11,4,1,0,0,26,8,3],
  [141,34,3,10,1,0,49,8,1],[524,36,0,0,0,0,38,8,1],[800,17,0,0,0,0,79,8,3],
  [592,16,1,0,1,0,24,8,2],[365,31,0,0,1,0,23,9,1],[717,11,4,18,0,0,93,9,3],
  [720,7,0,0,1,1,86,9,3],[311,50,2,0,0,0,66,9,0],[230,55,1,0,0,1,54,9,0],
  [546,34,2,0,0,0,89,9,1],[176,32,3,13,1,0,94,10,1],[614,15,1,0,1,0,85,10,2],
  [358,32,1,0,1,0,24,10,1],[876,12,0,0,0,0,55,10,3],[383,45,2,0,0,0,87,10,0],
  [611,30,2,0,0,0,23,11,3],[292,24,4,10,1,0,25,11,2],[303,35,0,0,1,0,47,11,1],
  [338,48,0,0,0,0,53,11,0],[557,33,1,0,0,0,68,11,1],[212,41,1,0,1,0,53,11,0],
  [533,8,4,17,1,1,91,12,3],[539,35,0,0,0,0,61,12,1],[625,17,3,16,0,1,46,12,2],
  [785,5,1,0,1,0,63,12,3],[206,42,2,0,1,0,90,12,0],[133,62,1,0,0,0,44,12,0],
  [413,16,4,8,1,0,73,13,2],[337,33,1,0,1,0,30,13,1],[818,16,1,0,0,0,70,13,3],
  [246,54,2,0,0,0,33,13,0],[101,52,3,18,0,0,21,13,0],[799,17,2,0,0,0,37,13,3],
  [250,39,2,0,1,1,28,14,1],[402,32,4,5,0,1,24,14,1],[724,5,4,14,1,0,86,14,3],
  [734,10,3,19,0,0,11,14,3],[264,26,3,5,1,0,73,14,1],[852,14,2,0,0,0,13,14,3],
  [817,5,2,0,1,0,36,15,3],[479,12,4,9,1,1,100,15,3],[212,56,0,0,0,0,66,15,0],
  [279,52,1,0,0,0,13,15,0],[656,27,1,0,0,0,32,16,1],[806,17,2,0,0,0,53,16,3],
  [288,39,4,7,0,1,25,16,1],[355,47,0,0,0,0,72,16,0],[456,28,3,4,0,0,72,17,1],
  [325,37,3,19,0,0,52,17,1],[873,5,3,6,0,0,25,17,3],[517,21,2,0,1,0,36,17,2],
  [464,25,1,0,1,0,57,17,1],[456,28,3,4,0,0,72,18,1],[325,37,3,19,0,0,52,18,1],
  [899,5,3,12,1,0,66,18,3],[813,5,3,8,1,1,33,18,3],[373,34,4,12,0,0,89,18,1],
  [787,5,3,8,1,0,52,18,3],[257,53,1,0,0,0,29,19,0],[347,35,4,11,0,1,36,19,1],
  [345,47,1,0,0,0,16,19,0],[305,38,4,16,0,0,30,19,1],[548,34,0,0,0,0,13,19,1],
  [494,26,4,2,0,0,87,19,1],[407,43,2,0,0,1,22,20,0],[674,26,1,0,0,0,49,20,1],
  [413,43,2,0,0,0,73,20,0],[786,6,3,10,0,0,17,20,3],[560,21,3,1,0,0,45,20,2],
  [241,54,2,0,0,0,38,20,0],[402,44,1,0,0,0,17,21,0],[646,27,0,0,0,0,36,21,1],
  [662,26,1,0,0,0,20,21,1],[204,57,2,0,0,1,87,21,0],[894,5,4,13,0,0,27,21,3],
  [316,34,0,0,1,0,15,21,1],[647,27,1,0,0,0,77,22,1],[642,13,1,0,1,0,42,22,3],
  [115,63,2,0,0,0,32,22,0],[407,31,3,14,0,0,28,22,1],[732,22,2,0,0,0,93,22,3],
  [555,33,2,0,0,0,23,22,1],[890,5,3,20,1,0,88,23,3],[801,5,4,3,0,0,77,23,3],
  [868,5,4,12,0,0,85,23,3],[448,29,4,11,0,1,67,23,1],[213,56,1,0,0,0,59,23,0],
  [510,24,4,7,0,0,70,23,2],
]

def build_dataset():
    X, y = [], []
    for row in RAW:
        vol, spd, wth, rain, acc, evt, ptd, hr, lbl = row
        # Feature engineering
        is_peak = 1 if hr in [7,8,9,17,18,19,20] else 0
        is_night = 1 if hr in [22,23,0,1,2,3,4] else 0
        speed_vol_ratio = spd / (vol + 1)
        X.append([vol, spd, wth, rain, acc, evt, ptd, hr, is_peak, is_night, speed_vol_ratio])
        y.append(lbl)
    return np.array(X, dtype=float), np.array(y)

if __name__ == "__main__":
    try:
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import cross_val_score
        from sklearn.pipeline import Pipeline
        import joblib, os

        X, y = build_dataset()
        print(f"Dataset: {len(X)} samples, {X.shape[1]} features")
        print(f"Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

        # Train Random Forest (best for tabular traffic data)
        model = Pipeline([
            ('scaler', StandardScaler()),
            ('clf', RandomForestClassifier(
                n_estimators=200,
                max_depth=12,
                min_samples_split=3,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            ))
        ])

        scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
        print(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

        model.fit(X, y)

        os.makedirs("ml", exist_ok=True)
        joblib.dump(model, "ml/traffic_model.pkl")

        # Save feature names and label map
        meta = {
            "features": ["traffic_volume","avg_speed","weather_code","rain_mm",
                         "accident","event","public_transport_density","hour",
                         "is_peak","is_night","speed_vol_ratio"],
            "labels": {0:"Low",1:"Medium",2:"High",3:"Very High"},
            "weather_map": WEATHER_MAP,
            "accuracy": float(scores.mean())
        }
        with open("ml/model_meta.json","w") as f:
            json.dump(meta, f, indent=2)

        print("Model saved to ml/traffic_model.pkl")
        print(f"Final accuracy: {scores.mean()*100:.1f}%")

    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Run: pip install scikit-learn numpy joblib")
        sys.exit(1)
