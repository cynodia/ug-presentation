# Kanban Project Management System

A full-stack Kanban board application built with Vue 3 + Vite (frontend) and Node.js + Express + Prisma (backend).

## Features

- **Kanban Board** — drag-and-drop issues between custom states (columns)
- **Backlog View** — prioritize backlog issues with drag-and-drop reordering
- **Project Configuration** — manage states (create, reorder, color), manage project members
- **Multi-Account** — accounts with optional project limits, multi-user support
- **Super Admin Panel** — manage accounts and users
- **Authentication** — session-based auth with bcrypt password hashing
- **Close Issue Action** — moves issues to the system "Closed" state with confirmation

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Vue 3, Vite, Vue Router, Pinia, vuedraggable |
| Backend  | Node.js, Express, express-session |
| ORM      | Prisma                            |
| Database | SQLite (dev) / PostgreSQL (prod)  |

## Project Structure

```
backend/
  prisma/schema.prisma    # Prisma schema (SQLite)
  src/
    index.js              # Express app entry point
    seed.js               # Demo seed data
    middleware/auth.js    # requireAuth / requireSuperAdmin
    routes/
      auth.js             # Login, logout, /me
      accounts.js         # Account CRUD
      users.js            # User CRUD
      projects.js         # Project CRUD + members
      states.js           # State CRUD + reorder
      issues.js           # Issue CRUD + reorder

frontend/
  src/
    main.js
    App.vue
    router/index.js
    stores/auth.js        # Pinia auth store
    stores/project.js     # Pinia project store
    views/
      LoginView.vue
      KanbanView.vue
      BacklogView.vue
      ProjectConfigView.vue
      SuperAdminView.vue
    components/
      TopNavBar.vue
      IssueModal.vue
      StateColumn.vue
```

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### Backend

```bash
cd backend
cp .env.example .env      # Edit as needed
npm install
npx prisma generate
npx prisma db push        # Creates dev.db (SQLite)
node src/seed.js          # Load demo data (optional — auto-runs when DEV_SEED=true)
npm start                 # or: npm run dev  (with nodemon)
```

Backend runs on **http://localhost:3000**

### Frontend

```bash
cd frontend
npm install
npm run dev               # Dev server with HMR + API proxy
# or: npm run build && npm run preview
```

Frontend runs on **http://localhost:5173**

### In-Memory / SQLite Dev Mode

The default `.env` uses SQLite (`file:./dev.db`) which requires no external database. Set `DEV_SEED=true` to auto-seed demo data on startup.

For a fresh database: `rm backend/dev.db && npx prisma db push --prefix backend`

### PostgreSQL (Production)

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `backend/prisma/schema.prisma`
2. Set `DATABASE_URL=postgresql://user:pass@host:5432/kanban` in `.env`
3. Run `npx prisma db push`

## Environment Variables

| Variable               | Default                     | Description                            |
|------------------------|-----------------------------|----------------------------------------|
| `DATABASE_URL`         | `file:./dev.db`             | Prisma database URL                    |
| `SESSION_SECRET`       | `dev-secret-kanban`         | Express session secret                 |
| `PORT`                 | `3000`                      | Backend port                           |
| `FRONTEND_URL`         | `http://localhost:5173`     | CORS allowed origin                    |
| `SUPER_ADMIN_USERNAME` | `superadmin`                | Super admin username (env-only)        |
| `SUPER_ADMIN_PASSWORD` | `superadmin123`             | Super admin password (env-only)        |
| `DEV_SEED`             | `true`                      | Auto-seed demo data on startup         |

## Demo Credentials

| Username     | Password        | Role        |
|--------------|-----------------|-------------|
| `superadmin` | `superadmin123` | Super Admin |
| `admin`      | `admin123`      | User (Demo Org) |
| `alice`      | `alice123`      | User (Demo Org) |
| `bob`        | `bob123`        | User (Beta Project) |

## API Reference

All endpoints under `/api/`. Session auth via cookies (`credentials: true`).

### Auth

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| POST   | `/api/auth/login`  | Login `{ username, password }` → user |
| POST   | `/api/auth/logout` | Logout (clears session) |
| GET    | `/api/auth/me`     | Get current user        |

### Accounts (Super Admin)

| Method | Path                         | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/api/accounts`              | List accounts                |
| POST   | `/api/accounts`              | Create `{ name, projectLimit? }` |
| GET    | `/api/accounts/:id`          | Get account with users/projects |
| PUT    | `/api/accounts/:id`          | Update account               |
| DELETE | `/api/accounts/:id`          | Delete account               |
| POST   | `/api/accounts/:id/users`    | Add user `{ userId }`        |
| DELETE | `/api/accounts/:id/users/:userId` | Remove user from account |

### Users (Super Admin)

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/api/users`    | List all users                           |
| POST   | `/api/users`    | Create `{ username, password, isSuperAdmin? }` |
| GET    | `/api/users/:id` | Get user                                |
| PUT    | `/api/users/:id` | Update user                             |
| DELETE | `/api/users/:id` | Delete user                             |

### Projects

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/api/projects`               | List user's projects            |
| POST   | `/api/projects`               | Create `{ name, accountId }`   |
| GET    | `/api/projects/:id`           | Get project with states/users  |
| PUT    | `/api/projects/:id`           | Update `{ name }`              |
| DELETE | `/api/projects/:id`           | Delete project                 |
| POST   | `/api/projects/:id/users`     | Add user `{ userId }`          |
| DELETE | `/api/projects/:id/users/:userId` | Remove user from project  |

### States

| Method | Path                                     | Description             |
|--------|------------------------------------------|-------------------------|
| GET    | `/api/projects/:pid/states`              | List states             |
| POST   | `/api/projects/:pid/states`              | Create `{ name, color, order }` |
| PUT    | `/api/projects/:pid/states/reorder`      | Reorder `[{ id, order }]` |
| PUT    | `/api/projects/:pid/states/:id`          | Update state            |
| DELETE | `/api/projects/:pid/states/:id`          | Delete (non-system only) |

### Issues

| Method | Path                                     | Description              |
|--------|------------------------------------------|--------------------------|
| GET    | `/api/projects/:pid/issues`              | List issues with state   |
| POST   | `/api/projects/:pid/issues`              | Create `{ name, type, storyPoints?, stateId, order? }` |
| PUT    | `/api/projects/:pid/issues/reorder`      | Reorder `[{ id, order, stateId }]` |
| PUT    | `/api/projects/:pid/issues/:id`          | Update issue             |
| DELETE | `/api/projects/:pid/issues/:id`          | Delete issue             |

## Data Model

```
Account ──< AccountUser >── User
    └──< Project ──< ProjectUser >── User
              ├──< State
              └──< Issue >── State
```

- **System states** (`isSystem: true`): `Backlog` (order -2) and `Closed` (order -1) — appear in Backlog view, not on Kanban board
- **Custom states** (`isSystem: false`): appear as Kanban columns, ordered by `state.order`
- Issues have `type`: `task`, `bug`, or `feature`
- Issues have `storyPoints` (optional) and `order` (for drag reorder)
