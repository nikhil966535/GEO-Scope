# 🚀 Geoscope Deployment & MongoDB Setup Guide

Complete guide to deploying **Geoscope — Intelligent Business Site Selection System** to production using **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 🏛️ Production Cloud Architecture

```
                    ┌───────────────────────────────────┐
                    │       USER BROWSER / CLIENT       │
                    └─────────────────┬─────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
   ┌───────────────────────┐                     ┌───────────────────────┐
   │    VERCEL FRONTEND    │                     │     RENDER BACKEND    │
   │  • React 18 + Vite    │ ─── REST APIs ────> │  • Node.js + Express  │
   │  • Leaflet GIS Maps   │  (CORS Enabled)     │  • MCDA Spatial Engine│
   │  • Vercel SPA Routing │                     │  • Haversine Kernel   │
   └───────────────────────┘                     └───────────┬───────────┘
                                                             │
                                                             │ Mongoose ODM
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   MONGODB ATLAS DB    │
                                                 │  • Free M0 Cluster    │
                                                 │  • Saved Evaluations  │
                                                 │  • Feasibility Dossier│
                                                 └───────────────────────┘
```

---

## Part 1: Setup MongoDB Atlas (Free Forever M0 Cluster)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create a Deployment** and select the **M0 Free Tier** (AWS or Google Cloud, region closest to your users, e.g., Mumbai `ap-south-1`).
3. Under **Security Quickstart**:
   * Create a **Database User** with a Username (e.g. `geoscope_admin`) and a strong Password. (Remember this password!).
   * Under **Network Access** / **IP Access List**:
     * Click **Add IP Address** $\rightarrow$ Select **Allow Access from Anywhere (`0.0.0.0/0`)** so Render can connect securely.
4. Go to **Database** $\rightarrow$ Click **Connect** $\rightarrow$ Choose **Drivers (Node.js)**.
5. Copy your connection string:
   ```env
   mongodb+srv://geoscope_admin:<password>@cluster0.abcde.mongodb.net/geoscope?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database user password).*

---

## Part 2: Deploy Backend to Render

### Method A: Automatic Deployment using `render.yaml` (Recommended)
1. Push your project repository to **GitHub**.
2. Log in to [Render.com](https://render.com).
3. Click **New +** $\rightarrow$ **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](./render.yaml).
6. Fill in the environment variable:
   * `MONGODB_URI`: Your MongoDB Atlas connection string from Part 1.
7. Click **Apply**. Render will automatically build (`npm install && npm run build`) and start the service (`npm run start`).

---

### Method B: Manual Web Service Setup
1. On Render, click **New +** $\rightarrow$ **Web Service**.
2. Connect your repository.
3. Configure settings:
   * **Name:** `geoscope-backend`
   * **Region:** Any (e.g., Oregon or Singapore)
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start`
   * **Plan:** `Free`
4. Under **Environment Variables**, add:
   * `NODE_ENV` = `production`
   * `PORT` = `10000` *(Render sets this automatically)*
   * `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/geoscope?retryWrites=true&w=majority`
   * *(Optional)* `GOOGLE_MAPS_API_KEY` = `AIzaSy...`
5. Click **Create Web Service**.
6. Once deployed, Render will provide your public backend URL, for example:
   ```
   https://geoscope-backend.onrender.com
   ```
7. Verify by opening in your browser:
   `https://geoscope-backend.onrender.com/api/health`
   You should see:
   ```json
   {
     "status": "healthy",
     "database": {
       "connected": true,
       "status": "connected",
       "dbName": "geoscope"
     }
   }
   ```

---

## Part 3: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your **GitHub repository**.
4. Configure the project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and select `frontend` *(or leave as `./` since root [`vercel.json`](./vercel.json) is already provided)*.
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://geoscope-backend.onrender.com` *(Your Render backend URL from Part 2 without trailing slash)*
6. Click **Deploy**.
7. Vercel will build and assign your production domain:
   ```
   https://geoscope.vercel.app
   ```

---

## Part 4: Testing & Verifying Everything

1. Open your Vercel URL (`https://geoscope.vercel.app`).
2. Notice the **Backend Diagnostics Badge** at the top right: it will show `HEALTHY` and display connected MongoDB status!
3. Click the **"Saved Sites (MongoDB)"** button in the top navigation ribbon:
   * It loads saved evaluations directly from your database.
   * Click **"Bookmark Current Site"** to instantly persist your active site evaluation and MCDA scorecard into MongoDB!
4. Switch between `#map`, `#poi-data`, `#scoring`, and `#recommendations`—all routes render instantly with zero 404s thanks to SPA rewrite rules.

---

## 🛡️ Hybrid In-Memory Fallback
If `MONGODB_URI` is not provided or MongoDB Atlas is temporarily unreachable, **Geoscope will never crash**:
* It automatically activates its **In-Memory Fallback Store**.
* All CRUD operations (`GET`, `POST`, `DELETE` evaluations) continue functioning normally in session memory.
* As soon as a valid `MONGODB_URI` is provided, it automatically resumes persisting directly to MongoDB Atlas.
