# GEO-Scope: Intelligent Business Site Selection & Recommendation System

> **Final-Year B.Tech Computer Science & Engineering Project**  
> An intelligent geospatial decision-support platform for modern retail site suitability evaluation, multi-criteria spatial scoring, and explainable store feasibility dossiers across Indian metropolitan markets.

---

## 🌟 Platform Highlights & Live Modules (Stages 1–5)

```
                       GEO-SCOPE SYSTEM ARCHITECTURE
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER (UI/UX)                       │
│     React 18 • TypeScript • Vite • Leaflet • Lucide • Glassmorphism    │
│    Stage 2 (Map) • Stage 3 (POIs) • Stage 4 (MCDA) • Stage 5 (Dossier) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                       APPLICATION & GIS ENGINE                         │
│           Node.js • Express • MCDA Spatial Suitability Engine          │
│               Geodesic Haversine • Distance-Decay Kernel               │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼────────────────┐   ┌───────────▼───────────────────┐
│     MONGODB ATLAS DATABASE LAYER   │   │  SPATIAL DATASETS & POI APIS  │
│  • Mongoose ODM (Saved Evaluations)│   │  • Verified 202-POI Registry  │
│  • Feasibility Dossier Bookmarks   │   │  • OpenStreetMap (OSM) Live   │
│  • Resilient In-Memory Fallback    │   │  • Google Maps Places API     │
└────────────────────────────────────┘   └───────────────────────────────┘
```

* **Stage 1 — Infrastructure & Diagnostics:** Decoupled full-stack TypeScript client-server architecture with automated health probes and diagnostics.
* **Stage 2 — Multi-City Interactive Map Canvas:** High-performance Leaflet canvas supporting **OSM Standard**, **Esri World Satellite**, **CartoDB Voyager**, and **CartoDB Dark Matter** views with dynamic candidate circle buffers across Pune, Delhi NCR, Kolhapur, Bengaluru, and Hyderabad.
* **Stage 3 — Multi-Sector POI Data Explorer:** Real-time extraction and geodesic Haversine distance calculation across **8 commercial & institutional sectors** (Retail, Dining, Transit, Corporate, Schools/Colleges, Hotels, Healthcare, Banking).
* **Stage 4 — Spatial Site Suitability Scoring Engine:** Multi-Criteria Decision Analysis (0–100 MCDA) factoring:
  * $w_1 = 30\%$: Distance-Decayed Anchor Attraction ($\sum W_{sector} \cdot e^{-d/\lambda}$)
  * $w_2 = 25\%$: Category Market & Dwell Synergy
  * $w_3 = 20\%$: Hotelling Competition Health & Saturation
  * $w_4 = 15\%$: Transit & Micro-Mobility Connectivity
  * $w_5 = 10\%$: Commercial Cluster Agglomeration Density
* **Stage 5 — Explainable AI Feasibility Dossier:** Transparent executive site proposals with store format blueprints, spatial SWOT, micro-market ranking, and **1-click Print PDF / JSON Export**.
* **MongoDB Integration:** Full CRUD persistence for evaluated site dossiers using Mongoose ODM with hybrid in-memory fallback.
* **Cloud Ready:** Pre-configured for **Vercel** (`vercel.json`) and **Render** (`render.yaml`).

---

## 📁 Repository Structure

```
d:\Geoscope/
├── backend/                       # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── db/
│   │   │   └── connection.ts      # Resilient MongoDB Mongoose connector
│   │   ├── models/
│   │   │   └── Evaluation.ts      # Mongoose Schema for saved site evaluations
│   │   ├── data/
│   │   │   └── verifiedLocalPlaces.ts # 202 authentic verified physical POIs
│   │   ├── services/
│   │   │   ├── placesService.ts   # Multi-provider POI search & MCDA engine
│   │   │   └── evaluationService.ts # Hybrid MongoDB / In-memory evaluation service
│   │   └── index.ts               # Express server entrypoint
│   ├── .env.example               # Backend environment variables template
│   └── package.json
│
├── frontend/                      # React 18 + Vite + TypeScript Web Application
│   ├── src/
│   │   ├── components/            # Interactive Map, Scorecards, POI Explorer, Modals
│   │   ├── services/              # API clients, AI suggestions, POI calculators
│   │   ├── data/                  # Multi-city metropolitan coordinates & wards
│   │   ├── App.tsx                # Master workspace & tab routing
│   │   └── index.css              # Custom slate/dark glassmorphic design system
│   ├── .env.example               # Frontend environment variables template
│   ├── vercel.json                # Vercel SPA rewrite rules
│   └── package.json
│
├── DEPLOYMENT.md                  # Comprehensive Vercel, Render & MongoDB Atlas guide
├── render.yaml                    # Render Blueprint (Infrastructure-as-Code)
├── vercel.json                    # Root Vercel deployment configuration
├── package.json                   # Monorepo workspace scripts
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/nikhil966535/GEO-Scope.git
cd GEO-Scope

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Configure Environment Variables (Optional)

Create `.env` inside `backend/`:
```env
PORT=5002
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/geoscope?retryWrites=true&w=majority
GOOGLE_MAPS_API_KEY=
```
*(Note: If `MONGODB_URI` is omitted, Geoscope will automatically operate in zero-configuration In-Memory Fallback Mode).*

### 3. Launch Development Environment

Run both frontend and backend concurrently from the root directory:
```bash
npm run dev
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5002/api/health](http://localhost:5002/api/health)

---

## 🚀 Cloud Deployment

* **Frontend (Vercel):** Connect your GitHub repository, choose root or `frontend/`, and set `VITE_API_URL=https://<your-render-backend>.onrender.com`.
* **Backend (Render):** Deploy using the included [`render.yaml`](./render.yaml) Blueprint or as a Web Service (`npm install && npm run build` $\rightarrow$ `npm run start`).
* **Database (MongoDB Atlas):** Create a free M0 cluster and set `MONGODB_URI`.

For complete step-by-step instructions with screenshots, refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## 📜 Academic Attribution
* **Project:** Geoscope — Intelligent Business Site Selection & Recommendation System
* **Author:** Nikhil ([@nikhil966535](https://github.com/nikhil966535))
* **License:** MIT License
