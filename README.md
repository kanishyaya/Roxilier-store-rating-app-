# 🏪 Store Rating App

A small full-stack web app where people can rate the stores they visit — think Google Maps reviews, but simpler. Admins manage the platform, normal users leave 1–5 star ratings, and store owners get to see how their store is doing.

Built as my submission for a full-stack coding challenge. 🙂

---

## 🛠️ Tech stack

- **Backend** — Node.js + Express, Prisma ORM
- **Database** — PostgreSQL
- **Frontend** — React (Vite) + Tailwind CSS
- **Auth** — JWT with role-based access (three roles: `ADMIN`, `USER`, `OWNER`)
- **Everything wired together** — Docker Compose

---

## 👥 The three roles

There's one login page for everyone. What you see after logging in depends on your role.

**🛡️ System Administrator** — the person running the platform.
- Adds new stores, normal users, and other admins
- Dashboard with total users, stores, and ratings
- Can view and filter every user and every store (by name, email, address, role)
- Can drill into any user's details

**👤 Normal User** — the person leaving reviews.
- Signs up through the registration page
- Browses all stores, searches by name or address
- Rates any store 1–5 ⭐, or updates a rating they've already left
- Can change their own password

**🏬 Store Owner** — the person running a store.
- Sees a dashboard of everyone who rated their store
- Sees the store's average rating at a glance
- Can change their own password

---

## 🚀 Getting it running

### The easy way — Docker Compose

If you have Docker installed, this is a two-step process:

```bash
cp .env.example .env      # then edit .env and set a real password + JWT secret
docker compose up --build
```

That's it. It starts Postgres, the backend, and the frontend all together.

| What      | Where                        |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| Backend   | http://localhost:6001/api    |
| Postgres  | localhost:5433               |

The backend runs `prisma migrate deploy` on startup, so the database schema is ready to go the first time you launch.

### The manual way

If you'd rather run everything on your own machine:

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # edit DATABASE_URL and JWT_SECRET
npm run db:migrate        # apply the Prisma migrations
npm run dev               # boots on http://localhost:6001
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL defaults to http://localhost:6001/api
npm run dev               # boots on http://localhost:5173
```

---

## 🌱 Seeding sample data

Rather than clicking through the signup form a dozen times, you can populate the DB with an admin, a few normal users, a few store owners with their stores, and a spread of ratings:

```bash
cd backend
npm run seed
```

It's idempotent — safe to re-run without creating duplicates.

Every seeded account uses the same password: **`Password@123`**

| Role  | Email                       |
|-------|-----------------------------|
| ADMIN | `admin@example.com`         |
| OWNER | `suresh.owner@example.com` (and 3 more) |
| USER  | `ananya.k@example.com` (and 4 more)     |

---

## ✅ Form validation rules

These come straight from the challenge spec and are enforced on both the backend (source of truth) and the frontend (for instant feedback):

- **Name** — 20 to 60 characters
- **Address** — max 400 characters
- **Password** — 8 to 16 characters, must include at least one uppercase letter and one special character
- **Email** — standard email format

---

## 🧪 Running the tests

```bash
cd backend
npm test
```

Runs the Vitest suite — no real database needed, Prisma is mocked. Currently covers signup/login, the JWT auth middleware, and password-change logic.

---

## 🔐 Security stuff

A few things I did to keep the app reasonably safe:

- Passwords are hashed with **bcrypt** (cost factor 12) — nothing is ever stored in plain text
- **JWTs** signed with a secret from the environment, roles baked into the token
- **Role checks on every protected route** — server-side, not just hidden in the UI (so you can't get past guards by editing localStorage)
- **Input sanitization** middleware strips HTML tags from every request field, but skips password fields (nothing should ever transform a password before it's hashed)
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` on every response
- **Strict CORS** — origin allowlist via the `CORS_ORIGIN` env var
- **Body-size limit** — 10 KB, so nobody can flood the server with huge payloads
- **`sortBy` allowlists** on all list endpoints so people can't inject arbitrary column names
- **SQL injection** — Prisma parameterises everything, so this is handled by design

Also — **`.env` is `.gitignore`d and not shipped with the code**. `.env.example` shows the shape; you fill it in with your own secrets.

---

## 📄 Pagination

Every list endpoint returns a paginated envelope:

```json
{
  "data": [ /* rows */ ],
  "pagination": { "total": 120, "page": 2, "limit": 20, "totalPages": 6 }
}
```

Query params: `page` (default 1) and `limit` (default 20, max 100).

Sort by `avgRating` / `rating` on the stores endpoints works correctly across pages — averages are computed for every matching store first, sorted, and only then sliced for the page. (Sounds obvious, but paginating before sorting is a subtle trap and a common bug.)

---

## 📚 API reference

Every route except `/api/auth/*` needs `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Route     | Body                              |
|--------|-----------|-----------------------------------|
| POST   | `/signup` | `name, email, address, password`  |
| POST   | `/login`  | `email, password`                 |

### Admin — `/api/admin` (ADMIN only)
| Method | Route                                                          | Notes |
|--------|----------------------------------------------------------------|-------|
| GET    | `/dashboard-stats`                                             | `{ totalUsers, totalStores, totalRatings }` |
| GET    | `/users?name=&email=&address=&role=&sortBy=&order=&page=&limit=` | Paginated |
| GET    | `/users/:id`                                                   | Single user detail |
| POST   | `/users`                                                       | `name, email, address, password, role` |
| GET    | `/stores?name=&email=&address=&sortBy=&order=&page=&limit=`    | Paginated |
| POST   | `/stores`                                                      | `name, email, address, ownerId` |

### User — `/api/user`
| Method | Route                          | Roles | Notes |
|--------|--------------------------------|-------|-------|
| GET    | `/stores?search=&sortBy=&order=&page=&limit=` | any auth | Paginated |
| POST   | `/ratings`                     | USER only | `storeId, score (1–5)` — upsert |
| PUT    | `/ratings/:storeId`            | USER only | `score (1–5)` — upsert |
| PUT    | `/change-password`             | any auth | `currentPassword, newPassword` |

### Owner — `/api/owner` (OWNER only)
| Method | Route             | Notes |
|--------|-------------------|-------|
| GET    | `/store`          | Store info + all ratings with rater details |
| PUT    | `/change-password`| `currentPassword, newPassword` |

---

## 🎨 A note on the theme

The interface uses a light blue palette. It's intentionally soft, but `bg-blue-300` / `bg-blue-400` buttons with white text sit around a 2.5:1 contrast ratio — below the WCAG AA threshold of 4.5:1 for normal text. If accessibility matters for your use case, either darken the button text to `text-gray-900` or bump the button backgrounds to `bg-blue-500` / `bg-blue-600`.

---

## 📂 What's inside

```
backend/                 Express API + Prisma
  src/
    routes/              auth, admin, user, owner
    middleware/          JWT guard, input sanitization
    utils/               validation, shared change-password logic
  prisma/                schema.prisma + migrations
  seed.js                sample data
  tests/                 Vitest specs (Prisma mocked)

frontend/                React + Vite + Tailwind
  src/
    pages/               Login, Signup, Dashboard, Stores, OwnerDashboard, ChangePassword
    components/          Sidebar, StarRating, ProtectedRoute
    utils/               shared client-side validation

docker-compose.yml       Postgres + backend + frontend
.env.example             Copy to .env and fill in
update.sql               Quick SQL to promote a user to ADMIN
```

---

That's the tour. If anything breaks or feels off, feel free to open an issue — always happy to hear feedback. 👋
