# NLC Material Forecasting

A full-stack web application to forecast material demand and estimate budget allocation from uploaded historical data files.

The project includes:
- A `FastAPI` backend for file ingestion and ML processing.
- A `React + Vite` frontend dashboard for upload and visualization.

## Features

- Upload input files from the UI.
- Parse and process data on the backend.
- Generate forecast output for future periods.
- Display forecast and budget insights in a dashboard.
- Run locally for development and demos.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** FastAPI, Uvicorn, Pandas, Scikit-learn
- **Language:** Python, JavaScript

## Project Structure

```text
nlc-material-forecasting/
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  └─ ml/
│  ├─ main.py
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  └─ vite.config.js
├─ ml_models/
├─ uploads/
├─ start_public.bat
└─ README.md
```

## Prerequisites

Install the following on Windows:
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js LTS](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/download/win) (for version control and GitHub push)

Verify installation:

```powershell
python --version
node --version
npm --version
git --version
```

## Local Setup

### 1) Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Run backend:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:
- API root/static app: `http://localhost:8000/`
- Swagger docs: `http://localhost:8000/docs`

### 2) Frontend Setup

Open a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173/`

## Build for Production

From the `frontend` folder:

```powershell
npm run build
```

This creates the compiled output in `frontend/dist`.

## How to Use

1. Start backend and frontend servers.
2. Open the frontend URL in browser.
3. Upload supported data files (CSV/Excel/PDF as implemented in backend parser).
4. View demand forecast and budget output in dashboard components.

## Public Sharing for Demo

`localhost` links work only on your computer.  
To share with others, use a tunnel and send the generated public URL.

Example options:
- `cloudflared tunnel --url http://localhost:5173`
- `ssh -R 80:localhost:5173 localhost.run`
- `ssh -p 443 -R0:localhost:5173 a.pinggy.io`

## Troubleshooting

- **`ModuleNotFoundError` or package issues**  
  Reinstall backend dependencies:
  ```powershell
  cd backend
  .\venv\Scripts\activate
  pip install -r requirements.txt
  ```

- **`numpy/pandas` binary mismatch**  
  This project pins `numpy==1.26.4` with `pandas==2.1.0` to avoid compatibility issues.

- **Frontend not loading**  
  Ensure backend is running and `frontend/node_modules` exists (`npm install`).

- **Port already in use**  
  Stop existing process or run on a different port.

## Notes

- Generated folders like `backend/venv`, `frontend/node_modules`, and `frontend/dist` are ignored by `.gitignore`.
- Run `npm install` only when dependencies are missing or `package.json` changes.

## License

This project is intended for educational/internal demo use unless a separate license file is added.
