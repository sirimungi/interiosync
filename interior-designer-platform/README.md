# Interior Designer Platform

Full-stack app: **FastAPI** (Python) backend, **React** frontend (Vite + MUI), **PostgreSQL**, JWT auth, role-based access (Designer, Client, Employee), and live updates via WebSockets.

## Get the site up

**Option A – Docker (easiest)**  
Start **Docker Desktop**, then:

```bash
cd interior-designer-platform
docker-compose up --build
```

**Option B – No Docker (SQLite, no PostgreSQL needed)**  
Use two terminals.

**Terminal 1 – Backend:**

```bash
cd interior-designer-platform
chmod +x run-backend.sh
./run-backend.sh
```

(First run creates a venv and installs deps. Backend uses SQLite by default.)

**Terminal 2 – Frontend:**

```bash
cd interior-designer-platform
chmod +x run-frontend.sh
./run-frontend.sh
```

Then open **http://localhost:3000** and **http://localhost:8000/docs** for the API.

---

## Quick start (Docker) – same as Option A

```bash
cd interior-designer-platform
docker-compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API docs:** http://localhost:8000/docs  
- **Health:** http://localhost:8000/health  

Seed data runs on first start. Log in with:

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Designer | designer@example.com | designer123 |
| Client   | client@example.com   | client123   |
| Employee | employee@example.com| employee123 |

## Run without Docker (manual)

### Backend (default: SQLite, no PostgreSQL)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=. python seed_data.py   # once
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

To use PostgreSQL instead, create DB `interior` and set:

```bash
export DATABASE_URL=postgresql://postgres:password@localhost:5432/interior
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if your API is elsewhere (e.g. in `.env`).

## Features

- **Auth:** Login, Signup (register), JWT. Roles: designer, client, employee.
- **Projects:** List/create (designer), view by role.
- **Tasks:** Per-project tasks; status (todo / in_progress / done); designers/employees can add and update.
- **Files:** Upload and list per project.
- **Messages:** Project-scoped chat.
- **Live updates:** WebSockets for tasks, messages, and file uploads.
- **UI:** Material UI, role-based dashboards, project detail with Tasks | Files | Chat tabs.

## Project layout

```
interior-designer-platform/
├── backend/          # FastAPI, SQLAlchemy, PostgreSQL
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/  # auth, projects, tasks, files, messages, users, ws
│   │   ├── models.py, schemas.py, crud.py, utils.py, ws_manager.py
│   │   └── config.py, database.py
│   ├── requirements.txt
│   ├── seed_data.py
│   ├── entrypoint.sh
│   └── Dockerfile
├── frontend/         # React, Vite, MUI
│   ├── src/
│   │   ├── pages/    # Login, Signup, *Dashboard, ProjectDetail
│   │   ├── components/ # PrivateRoute, ProjectCard, TaskList, FileUploader, ChatBox
│   │   ├── context/  # SocketContext
│   │   ├── api.js, App.jsx, main.jsx, theme.js
│   └── package.json, vite.config.js
├── docker-compose.yml
└── README.md
```

You’re ready to open the app and use the seed users above.
