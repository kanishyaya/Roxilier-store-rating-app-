# Store Rating App

Full-stack app: Express + Prisma (PostgreSQL) backend, React + Vite + Tailwind frontend, JWT auth with role-based access (ADMIN / USER / OWNER).

## Structure
```
backend/    Express API, Prisma schema, auth routes/middleware
frontend/   React app (Login, Signup, Dashboard, protected routing)
```

## Backend setup
```bash
cd backend
npm install
cp .env.example .env   # then edit DATABASE_URL and JWT_SECRET
npm run db:migrate      # runs prisma migrate dev
npm run dev              # starts on http://localhost:5000
```

## Frontend setup
```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:5173
```

## Notes / fixes applied during packaging
- **schema.prisma**: the `Rating.user` and `Rating.store` fields were missing the `@relation(...)` wrapper in the original spec (`user User @fields: [...]`), which would fail to parse. Fixed to `@relation(fields: [userId], references: [id], onDelete: Cascade)`.
- **.env**: shipped as `.env.example` instead of a live `.env` so a real secret isn't committed/distributed — copy it and fill in your own `JWT_SECRET`/`DATABASE_URL` before running.
- Added the frontend scaffolding files needed to actually run the app that weren't in the original snippet: `main.jsx`, `index.html`, `index.css`, `vite.config.js`, `postcss.config.js`, and frontend `package.json`.

## API
| Method | Route              | Body                                  |
|--------|--------------------|----------------------------------------|
| POST   | `/api/auth/signup` | `name, email, address, password`       |
| POST   | `/api/auth/login`  | `email, password`                      |

Password rule: 8–16 chars, at least 1 uppercase letter, at least 1 special character.
Name rule (signup): 20–60 characters.
