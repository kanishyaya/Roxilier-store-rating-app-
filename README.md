# Store Rating App

A full-stack web app where people can rate stores registered on the platform, on a scale of 1 to 5. Built as a submission for a full-stack coding challenge.

There's a single login for everyone. What you see after logging in depends on your role — System Administrator, Normal User, or Store Owner.

## Tech stack

- **Backend** — Node.js, Express, Prisma ORM
- **Database** — PostgreSQL
- **Frontend** — React (Vite), Tailwind CSS
- **Auth** — JWT with role-based access control
- **Local dev / deployment** — Docker Compose

## The three roles

**System Administrator**
- Adds new stores, normal users, and other admins
- Sees a dashboard with total users, total stores, and total ratings
- Can view and filter every user and every store, by name, email, address, or role
- Can open any user's details — if that user is a Store Owner, their store's rating is shown too

**Normal User**
- Signs up through the registration page
- Browses all stores and can search by name or address
- Rates any store from 1 to 5, and can update a rating they've already given
- Can change their own password

**Store Owner**
- Sees a dashboard listing everyone who's rated their store
- Sees their store's average rating
- Can change their own password

Everyone can log out.

## Running it locally

### With Docker Compose (recommended)

```bash
cp .env.example .env
```

Open `.env` and set a real `POSTGRES_PASSWORD` and `JWT_SECRET`. Then:

```bash
docker compose up --build
```

This starts Postgres, the backend, and the frontend together, and runs the Prisma migrations automatically.

| Service   | URL                          |
|-----------|-------------------------------|
| Frontend  | http://localhost:5173         |
| Backend   | http://localhost:6001/api     |
| Postgres  | localhost:5433                |

### Without Docker

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # set DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run dev                # http://localhost:6001
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL defaults to http://localhost:6001/api
npm run dev                 # http://localhost:5173
```

## Seeding sample data

Instead of registering test accounts by hand, you can seed the database with an admin, five normal users, four store owners with linked stores, and a spread of ratings:

```bash
cd backend
npm run seed
```

Safe to run more than once — it uses `upsert`, so it won't create duplicates.

Every seeded account uses the password `Password@123`.

| Role  | Email                        |
|-------|-------------------------------|
| Admin | admin@example.com             |
| Owner | suresh.owner@example.com (and three more) |
| User  | ananya.k@example.com (and four more)      |

## Form validation

Enforced on both the backend (source of truth) and the frontend (for immediate feedback):

- **Name** — 20 to 60 characters
- **Address** — up to 400 characters
- **Password** — 8 to 16 characters, with at least one uppercase letter and one special character
- **Email** — standard email format

## Running the tests

```bash
cd backend
npm test
```

Runs the Vitest suite with Prisma mocked, so no live database is needed. Covers signup/login, the JWT auth middleware, and password-change logic.

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- JWTs signed with a secret from the environment; role is embedded in the token
- Every protected route checks the role server-side, not just in the UI
- Input sanitization strips HTML tags from request fields, but skips password fields so nothing is altered before hashing
- Security headers set on every response (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`)
- CORS restricted to an origin allowlist via `CORS_ORIGIN`
- Request body size capped at 10 KB
- `sortBy` query params are checked against an allowlist on every list endpoint, to prevent arbitrary column access
- SQL injection isn't a concern here since Prisma parameterizes all queries
- `.env` is excluded from version control; `.env.example` shows the expected shape

## Pagination

Every list endpoint returns:

```json
{
  "data": [ ],
  "pagination": { "total": 120, "page": 2, "limit": 20, "totalPages": 6 }
}
```

Query params: `page` (default 1) and `limit` (default 20, max 100).

Sorting by rating on the stores endpoints is computed across the full result set before pagination is applied, so rankings stay consistent across pages rather than only sorting within the current page.

## API reference

Every route except `/api/auth/*` requires `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Route     | Body                              |
|--------|-----------|-------------------------------------|
| POST   | `/signup` | `name, email, address, password`  |
| POST   | `/login`  | `email, password`                   |

### Admin — `/api/admin` (ADMIN only)
| Method | Route                                                          | Notes |
|--------|------------------------------------------------------------------|-------|
| GET    | `/dashboard-stats`                                                | `{ totalUsers, totalStores, totalRatings }` |
| GET    | `/users?name=&email=&address=&role=&sortBy=&order=&page=&limit=` | Paginated |
| GET    | `/users/:id`                                                      | Single user detail |
| POST   | `/users`                                                          | `name, email, address, password, role` |
| GET    | `/stores?name=&email=&address=&sortBy=&order=&page=&limit=`      | Paginated |
| POST   | `/stores`                                                          | `name, email, address, ownerId` |

### User — `/api/user`
| Method | Route                          | Roles     | Notes |
|--------|----------------------------------|-----------|-------|
| GET    | `/stores?search=&sortBy=&order=&page=&limit=` | any authenticated role | Paginated |
| POST   | `/ratings`                      | USER only | `storeId, score (1-5)`, upsert |
| PUT    | `/ratings/:storeId`             | USER only | `score (1-5)`, upsert |
| PUT    | `/change-password`               | any authenticated role | `currentPassword, newPassword` |

### Owner — `/api/owner` (OWNER only)
| Method | Route              | Notes |
|--------|----------------------|-------|
| GET    | `/store`             | Store info plus all ratings with rater details |
| PUT    | `/change-password`   | `currentPassword, newPassword` |

## A note on the theme

The interface uses a light blue palette. It's intentionally soft, but the primary buttons (`bg-blue-300` / `bg-blue-400` with white text) sit around a 2.5:1 contrast ratio, below the WCAG AA threshold of 4.5:1 for normal text. If accessibility matters for your use case, darkening the button text to `text-gray-900`, or moving the background to `bg-blue-500` / `bg-blue-600`, resolves this.

## Project structure

```
backend/                 Express API + Prisma
  src/
    routes/              auth, admin, user, owner
    middleware/           JWT guard, input sanitization
    utils/                validation, shared change-password logic
  prisma/                 schema.prisma and migrations
  seed.js                 sample data
  tests/                  Vitest specs (Prisma mocked)

frontend/                React + Vite + Tailwind
  src/
    pages/                Login, Signup, Dashboard, Stores, OwnerDashboard, ChangePassword
    components/           Sidebar, StarRating, ProtectedRoute
    utils/                shared client-side validation

docker-compose.yml        Postgres, backend, and frontend wired together
.env.example              Copy to .env and fill in your own values
update.sql                 Quick SQL to promote a user to ADMIN
```