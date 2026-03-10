# Interior Designer Platform (INTERIOSYNC)

Full-stack platform for interior design project management in the **Indian market** (INR, GST, IST), aligned with [INTERIOSYNC requirements](docs/INTERIOSYNC-REQUIREMENTS.md) (quotations, appointments, real-time updates, centralized communication). Python (FastAPI) backend, React frontend, PostgreSQL, JWT auth, and role-based dashboards (Designer, Client, Employee). Run locally with Docker.

## Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), bcrypt
- **Frontend:** React 18, Vite, TailwindCSS, React Router, Axios
- **Deploy:** Docker & Docker Compose

## Quick start (Docker)

1. **Prerequisites:** Docker and Docker Compose installed.

2. **Clone and run:**

   ```bash
   cd interior-designer-platform
   docker-compose up --build
   ```

3. **Open:**

   - Frontend: **http://localhost:3000**
   - Backend API docs: **http://localhost:8000/docs**
   - Health: **http://localhost:8000/health**

4. **Seed data** runs automatically on first backend startup. Log in with:

   | Role     | Email                | Password    |
   |----------|----------------------|-------------|
   | Designer | designer@example.com | designer123 |
   | Client   | client@example.com   | client123   |
   | Employee | employee@example.com | employee123 |

## Run without Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set environment (or use defaults):

- `DATABASE_URL=postgresql://postgres:password@localhost:5432/interior`
- `SECRET_KEY=your-secret-key`

Start PostgreSQL (e.g. local install or a `postgres:15` container on port 5432), then:

```bash
export PYTHONPATH=.
python seed_data.py   # once, to seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if your API is not on that URL (e.g. in `.env`).

## Features

- **Auth:** Register, login, JWT. Roles: `designer`, `client`, `employee`.
- **Projects:** CRUD; designers create projects and assign a client.
- **Tasks:** Per-project tasks with status (todo / in_progress / done). Designers/employees can add and update.
- **Files:** Upload and list files per project (stored under `UPLOAD_DIR`, served at `/uploads`).
- **Messages:** Per-project chat-style messages.
- **Role-based dashboards:** Designer (create project, manage tasks/files), Client (view own projects, messages), Employee (view and edit tasks/files on projects they’re part of).

## Project layout

```
interior-designer-platform/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, routes
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── dependencies.py   # (optional)
│   │   ├── utils.py         # JWT, password hashing
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── projects.py
│   │       ├── tasks.py
│   │       ├── files.py
│   │       ├── messages.py
│   │       └── users.py
│   ├── requirements.txt
│   ├── seed_data.py
│   ├── entrypoint.sh
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard, ProjectCard, TaskList, FileUploader, ChatBox
│   │   ├── pages/          # Login, DesignerDashboard, ClientDashboard, EmployeeDashboard, ProjectDetail
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API overview

- `POST /auth/register` – register (name, email, password, role)
- `POST /auth/login` – login (email, password) → JWT + user
- `GET /projects` – list projects (filtered by current user role)
- `POST /projects` – create project (designer only)
- `GET /projects/{id}` – get project
- `GET /tasks?project_id=...` – list tasks
- `POST /tasks` – create task
- `GET /files?project_id=...` – list files
- `POST /files` – upload file (multipart: project_id, file)
- `GET /messages?project_id=...` – list messages
- `POST /messages` – send message
- `GET /users?role=...` – list users (e.g. clients for designer)

All protected routes use header: `Authorization: Bearer <token>`.

## GitHub

After cloning or creating the repo:

```bash
git add .
git commit -m "Interior Designer Platform starter"
git push origin main
```

For production, set strong `SECRET_KEY` and `DATABASE_URL`, and consider moving file storage to S3 and using a production ASGI server (e.g. Gunicorn + Uvicorn).
