# Chess Tournament Management System

A full-stack web application designed to manage chess tournaments, players, and match simulations. It features automated Swiss-style match generation, round simulation, real-time leaderboards, and role-based access control.

## Overview & Tech Stack

This project is built with modern, scalable technologies:

**Backend:**
- **Framework:** Django 5.2 + Django REST Framework (DRF)
- **Database:** SQLite (local) / PostgreSQL (production)
- **Authentication:** JWT via `djangorestframework-simplejwt`
- **Optimization:** Optimized queries (`select_related`), caching, and paginated endpoints.
- **Production Readiness:** Configured with WhiteNoise (static files) and Gunicorn.

**Frontend:**
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (via inline custom styles in components)
- **State/Routing:** Context API & React Router DOM
- **HTTP Client:** Axios (with automatic token refresh interceptors)
- **UI Notifications:** React-Toastify

## Local Setup

### 1. Backend Setup

1. **Clone the repository** and navigate to the backend directory (`Student Turnament management system`).
2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**: Create a `.env` file in the root based on `.env.example`.
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   ```
5. **Run Migrations & Start Server**:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   *The backend will be running at http://localhost:8000*

### 2. Frontend Setup

1. Navigate to the frontend directory (`chess_tournament_frontend`).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**: Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend will be running at http://localhost:5173*

## Testing

**Backend:**
```bash
python manage.py test
```

**Frontend:**
```bash
npm run test
```

## Production Deployment

This repository is pre-configured for platform-as-a-service deployment.

- **Backend (Render)**: Simply connect this repository to Render and deploy using the provided `render.yaml` configuration. Set your environment variables (`SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`).
- **Frontend (Vercel/Netlify)**: Connect the `chess_tournament_frontend` folder. `vercel.json` is provided to handle SPA fallback routing. Set `VITE_API_BASE_URL` to your live backend API URL.

## API Endpoints Summary

- **Auth**: `/api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/`
- **Players**: `/api/players/` (CRUD, Search)
- **Tournaments**: `/api/tournaments/` (CRUD, Filters)
- **Tournament Details**:
  - `/api/tournaments/{id}/players/`
  - `/api/tournaments/{id}/add_player/`
  - `/api/tournaments/{id}/remove_player/`
  - `/api/tournaments/{id}/rankings/`
- **Matches**: `/api/matches/` (Filter by tournament, round)
  - `/api/tournaments/{id}/generate_matches/`
  - `/api/tournaments/{id}/simulate_round/`

> A complete Postman Collection is available in the `/postman` directory for easy testing.
