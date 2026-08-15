MERN Todo App

This is a small MERN (MongoDB, Express, React, Node) todo application.

Overview
- Backend: `backend/` — Express API, push notifications, and a small reminder scheduler.
- Frontend: `frontend/` — React + Vite client with a service worker for push notifications.

Quick start (development)
1. Backend (dev with in-memory Mongo):

```powershell
cd backend
npm install
# Run the dev launcher which uses an in-memory MongoDB (for local testing)
npm run start:dev
```

2. Frontend (dev):

```powershell
cd frontend
npm install
npm run dev
```

Production build (serve frontend from backend)
1. Build the frontend:

```powershell
cd frontend
npm install --production
npm run build
```

2. Configure backend environment. Copy `backend/.env.example` to `backend/.env` and set values:
- `MONGO_URI` — your MongoDB connection string (Atlas recommended)
- `VAPID_PUBLIC` and `VAPID_PRIVATE` — web-push VAPID keys for notifications
- `CORS_ORIGINS` — comma-separated origins allowed to access the API

3. Start backend in production mode (it will serve the built frontend):

```powershell
cd backend
npm start
```

Migrating local data to Atlas
- Use `mongodump`/`mongorestore` or `mongoexport`/`mongoimport` to move data from local `.mongo-data` to your Atlas cluster. See the `backend` docs for examples.

Security notes
- Keep `.env` secret and out of version control. The repository includes `.env.example` files.
- Restrict `CORS_ORIGINS` in production.
- Provide VAPID keys via env vars in production rather than storing them on disk.

If you want, I can add a `Dockerfile` and deployment notes next.
