# starlink-mission-planner
Starlink ground tracks + ML pass-quality scoring 

## possible structure:
```text
starlink-mission-planner/
  app/                       # Next.js app router
    page.tsx                 # main UI
    api/
      tle/route.ts           # fetch+cache TLEs (server)
      passes/route.ts        # compute passes for observer
      score/route.ts         # optional: score in server
  components/
    MapView.tsx              # Leaflet map + layers
    TimeScrubber.tsx         # slider + play/pause
    SatellitePicker.tsx
    PassTable.tsx            # list of passes + score
    ExplainPanel.tsx         # why score (feature contributions)
  lib/
    tle.ts                   # parsing, caching
    orbit.ts                 # propagate -> lat/lon
    passes.ts                # detect passes above elevation threshold
    features.ts              # feature extraction for ML
    model/
      weights.json           # model params for JS inference
      scaler.json            # optional normalization
      infer.ts               # scorePass(features)
  ml/
    00_build_dataset.py
    01_train_model.ipynb
    02_export_model.py
    data/
      tle_snapshots/         # cached TLE snapshots (optional)
      dataset.parquet
  public/
    demo.gif
  README.md
