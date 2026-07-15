# TrackIT Development Guidelines

This document outlines the standard development workflow, linting requirements, and deployment processes for the TrackIT application. Please adhere to these guidelines to ensure code quality and smooth CI/CD pipelines.

---

## 1. Coding Guidelines

### Frontend (React / Vite)
- **Framework**: React 19 + TypeScript + Vite.
- **Directory**: All frontend code lives in the `frontend/` directory.
- **Styling**: Ensure you use the existing CSS variables and utility classes defined in the global styles. 
- **API Calls**: Make all backend requests using the configured `axios` instances to ensure auth tokens are properly attached.
- **Local Development**: 
  - Run `npm install` to install dependencies.
  - Run `npm run dev` to start the Vite development server locally.

### Backend (FastAPI / Python)
- **Framework**: FastAPI + SQLAlchemy + Python 3.
- **Directory**: All backend code lives in the `backend/` directory.
- **Environment**: Use `uv` for managing the Python environment and dependencies (`pyproject.toml`).
- **Database Changes**: If you modify the `models.py` or `budget_model.py`, you must generate a new Alembic migration script using `alembic revision --autogenerate -m "description"` and run it with `alembic upgrade head`.
- **Local Development**:
  - Run `uv sync` to install dependencies in the `.venv`.
  - Start the server using `fastapi dev app/main.py`.

---

## 2. Testing for Lints

The CI/CD pipeline enforces strict linting on both the frontend and backend. **You must run these locally before pushing your code** to prevent build failures.

### Frontend Linting (Biome)
The frontend uses [Biome](https://biomejs.dev/) for formatting and linting.
1. Navigate to the frontend directory: `cd frontend`
2. Run the linter and auto-fix issues: 
   ```bash
   npm run lint
   ```
   *(This runs `biome check --write` to automatically format your TypeScript/React files).*

### Backend Linting (Ruff & Mypy)
The backend uses [Ruff](https://docs.astral.sh/ruff/) for formatting/linting and [Mypy](https://mypy.readthedocs.io/) for static type checking.
1. Navigate to the backend directory: `cd backend`
2. Auto-format your code using the provided script:
   ```bash
   bash scripts/format.sh
   ```
   *(This runs `ruff check --fix` and `ruff format`).*
3. Check for any remaining lint or type errors:
   ```bash
   bash scripts/lint.sh
   ```

---

## 3. Local Docker Deployment & Testing

To test the entire stack (Frontend + Backend + PostgreSQL Database) together in a production-like environment on your local machine, use Docker Compose.

1. **Ensure Docker is running** on your machine.
2. **Set up Environment Variables**: Ensure your `.env` file at the root of the project contains all the necessary variables (DB passwords, secret keys, etc.).
3. **Build and Start the Containers**:
   ```bash
   docker compose up -d --build
   ```
4. **Verify the Services**:
   - The **Frontend** should be accessible at `http://localhost:5173`
   - The **Backend API Docs** should be accessible at `http://localhost:8000/docs`
   - The **Database** is running locally on port `5432`
5. **View Logs**: If something isn't working, check the logs:
   ```bash
   docker compose logs -f
   ```
6. **Stop the Environment**:
   ```bash
   docker compose down
   ```

---

## 4. GitHub Workflow & CI/CD

TrackIT uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). Follow this workflow to contribute:

1. **Pull the Latest Changes**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Code**: Write clear, descriptive commit messages.
   ```bash
   git add .
   git commit -m "Add feature X to improve Y"
   ```
4. **Run Lints Locally**: **(Crucial!)** Ensure you have run both the frontend and backend linters as described in Section 2. The CI pipeline *will* fail if your code is unformatted.
5. **Push to GitHub**:
   ```bash
   git push -u origin feature/your-feature-name
   ```
6. **Let CI/CD Run**: 
   - Open a Pull Request (PR) on GitHub.
   - The CI pipeline will automatically run tests, type checking (mypy), and formatting checks (biome, ruff).
   - Once the checks pass and the PR is merged into `main`, the CD pipeline (`deploy-remote.yml`) will automatically deploy the latest changes to the production server.
