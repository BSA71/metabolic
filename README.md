# Metabolic

Metabolic is a dashboard-first app foundation for weight, nutrition, exercise, and program tracking.

## Local setup

```bash
npm install
docker compose up -d
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs on `http://localhost:8080` and the client on `http://localhost:5173`. Firebase Auth is the authentication source of truth. PostgreSQL stores roles, profiles, programs, meals, foods, exercises, logs, SMS messages, and AI lookup history. Seed users include placeholder Firebase UIDs and can also be linked on first authenticated request by matching email.

Local Docker Postgres is exposed on host port `5433` to avoid conflicts with an existing local PostgreSQL service. Inside Docker it still uses port `5432`.

No deployment is performed by this repo. The server listens on `PORT` and includes a Dockerfile so it can be adapted for Cloud Run later.
