# Nova — Full-Stack E-Commerce Website

A full-stack e-commerce application with a React storefront, customer dashboards,
an admin panel, and a multi-branch inventory backend.

## Features

- **Storefront** — Home page, product catalog (`/shop`), product detail pages, search overlay, theme toggle (light/dark), cart, and checkout flow.
- **Authentication** — Register / login with JWT access tokens, session persistence (local or session storage), protected routes per role.
- **Roles** — `master admin` (admin dashboard, analytics, branches & inventory), `branch owner` / `central owner` / `south owner` (per-branch dashboards), and `customer` (account dashboard).
- **Branch inventory** — Per-branch stock levels for products, managed by branch owners.
- **Orders** — Order creation and lookup with a full lifecycle (`pending → confirmed → preparing → ready → shipped → delivered`, plus `cancelled`), status history, stock restocking on cancellation, and admin/branch-owner status management.
- **Reviews** — Customers can review products (one review per user per product, upsert on re-submit); products expose `ratingAverage`/`ratingCount`.
- **Catalog** — Products, categories, and related-product recommendations. `GET /products` supports server-side search (`q`), category, price-range, sort, stock and branch-inventory filters, plus opt-in pagination.
- **Rate limiting** — `@nestjs/throttler` guards every route (100 req/min default); auth endpoints are limited to 5 req/min.
- **CI** — GitHub Actions runs backend lint/tests/build and frontend lint/build on push and PRs.

## Project Structure

```
E-Commerce-FullStack-website/
├── backend/    # NestJS REST API (TypeScript, MongoDB via Mongoose)
└── frontend/   # React + Vite SPA (Tailwind CSS v4)
```

## Tech Stack

### Backend (`backend/`)

| Technology | Purpose |
|---|---|
| NestJS 12 | Application framework / REST API |
| TypeScript | Language |
| MongoDB + Mongoose 9 | Database & ODM (`@nestjs/mongoose`) |
| JWT (`@nestjs/jwt`) | Access-token auth; `bcrypt` for password hashing |
| class-validator / class-transformer | DTO validation & serialization |
| helmet | HTTP security headers |
| Vitest + supertest | Unit & e2e tests |
| oxlint + Prettier | Linting & formatting |

### Frontend (`frontend/`)

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite 8 | Build tool & dev server |
| react-router-dom 7 | Client-side routing & role-based route guards |
| Tailwind CSS 4 (`@tailwindcss/vite`) | Styling |
| axios | HTTP client (two instances — see below) |
| clsx + tailwind-merge | Conditional class utilities |
| ESLint + typescript-eslint | Linting |

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- A MongoDB database (MongoDB Atlas URI works)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` with:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Optional API-key variables referenced in the environment: `ADMIN_API_KEY`, `USER_API_KEY`, `BRANCH_ADMIN_API_KEY`.

Run in development:

```bash
npm run start:dev    # watch mode, http://localhost:3000/api/v1
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Optional: create `frontend/.env` to override the backend URL:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Data Sources

The frontend uses **two API clients** (`frontend/src/lib/api/client.ts`):

- `apiClient` → `https://api.escuelajs.co/api/v1` — public storefront catalog (products/categories) served from the external Escuelajs API.
- `backendClient` → `VITE_API_URL` (default `http://localhost:3000/api/v1`) — the NestJS backend for auth, users, branches, orders, etc. It automatically attaches the stored JWT as a `Bearer` token.

Backend responses are wrapped by a global `TransformInterceptor` as
`{ success, data, timestamp }` — use the `unwrap()` helper in `client.ts` to extract `data`.

## API Reference (Backend)

All routes are prefixed with `/api/v1`. Successful responses are wrapped as
`{ success: true, data, timestamp }`; errors pass through a global
`HttpExceptionFilter`.

### Auth — `auth`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a customer → returns `{ access_token, user }` |
| POST | `/auth/login` | Login → returns `{ access_token, user }` |
| GET | `/auth/me` | Current user profile (JWT required) |
| PATCH | `/auth/profile` | Update own profile (JWT required) |

### Users — `users`

| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create user |
| GET | `/users` | List users (`page` + optional `limit` for pagination) |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| POST | `/users/is-available` | Check email availability |

### Products — `products`

| Method | Path | Description |
|---|---|---|
| POST | `/products` | Create product |
| GET | `/products` | List products. Query params: `q` (title/description search), `categoryId`, `categoryIds` (csv), `minPrice`, `maxPrice`, `sort` (`newest`, `price_asc`, `price_desc`, `name`), `inStock`, `branchId` (restrict to a branch's inventory), `page`, `limit`. With `page` returns `{ items, total, page, limit, totalPages }`; otherwise a plain array. Category is populated onto each product. |
| GET | `/products/:id` | Get product by id |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| GET | `/products/:id/related` | Related products by id |
| GET | `/products/slug/:slug` | Get product by slug |
| GET | `/products/slug/:slug/related` | Related products by slug |

### Reviews — `products/:productId/reviews`

| Method | Path | Description |
|---|---|---|
| GET | `/products/:productId/reviews` | List reviews with `{ items, average, count, myReview }` (JWT optional — `myReview` populated when signed in) |
| POST | `/products/:productId/reviews` | Create or update the caller's review `{ rating: 1-5, title?, comment }` (JWT required) |
| DELETE | `/products/:productId/reviews/:reviewId` | Delete a review (master admin) |

### Category — `category`

| Method | Path | Description |
|---|---|---|
| POST | `/category` | Create category |
| GET | `/category` | List categories (`page` + optional `limit` for pagination) |
| GET | `/category/:id` | Get category |
| GET | `/category/slug/:slug` | Get category by slug |
| GET | `/category/:id/products` | Products in a category |
| PATCH | `/category/:id` | Update category |
| DELETE | `/category/:id` | Delete category |

### Branches — `branches`

| Method | Path | Description |
|---|---|---|
| GET | `/branches` | List branches (auto-seeds 3 defaults when empty) |
| GET | `/branches/:id` | Get branch |
| POST | `/branches` | Create branch |
| PATCH | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Delete branch |
| GET | `/branches/:branchId/inventory` | Branch inventory |
| PUT | `/branches/:branchId/inventory/:productId` | Update stock for a product |
| DELETE | `/branches/:branchId/inventory/:productId` | Remove product from inventory |

### Orders — `orders`

| Method | Path | Description |
|---|---|---|
| POST | `/orders` | Create order |
| GET | `/orders/me` | Current user's orders (`page` + optional `limit` for pagination) |
| GET | `/orders/me/:id` | One of the current user's orders (JWT required) |
| GET | `/orders/branch/:branchId` | Branch orders (master admin or that branch's owner) |
| PATCH | `/orders/:id/status` | Move an order to an allowed next status `{ status, note? }`; cancelling restocks the branch. Master admin or the order's branch owner. |
| GET | `/orders` | List all orders (master admin; `page` + optional `limit` for pagination) |
| GET | `/orders/:id` | Get order (master admin) |

Order statuses: `pending`, `confirmed`, `preparing`, `ready`, `shipped`, `delivered`, `cancelled`. Each order keeps a `statusHistory` timeline and single-order responses include `allowedTransitions`.

## Backend Architecture

Feature modules under `backend/src/`:

- **`auth/`** — `AuthService` (register/login/JWT issuance), `JwtAuthGuard`, `tokens.ts`, DTOs.
- **`users/`** — User CRUD, bcrypt credential validation, `userSeed.ts` (seed users: `admin@nova.local`, `ava@nova.local`, etc.).
- **`products/`** — Product CRUD, slug lookups, related products, `productsSeed.ts`. Products store `branch` (`north | center | south`) and `stock`.
- **`category/`** — Category CRUD with slug support, `category.seed.ts`.
- **`branches/`** — Branch CRUD plus per-branch inventory via `BranchInventoryService`.
- **`orders/`** — Order creation and queries.
- **`common/`** — Cross-cutting concerns:
  - `middleware/request-id.middleware.ts` — assigns a request ID to every request.
  - `interceptors/transform.interceptor.ts` — wraps responses in `{ success, data, timestamp }`.
  - `interceptors/logging.interceptor.ts` — request logging.
  - `filters/http-exception.filter.ts` — uniform error responses.
  - `guards/` & `decorators/` — JWT auth + role guards (`@Roles`).

Global setup in `main.ts`: `helmet`, CORS (origin from `FRONTEND_URL`, credentials enabled), global prefix `api/v1`, and a global `ValidationPipe` with `whitelist` + `transform`.

## Frontend Architecture

- **Routing** (`src/Router.tsx`) — `RoleRoute` guards redirect unauthenticated users to `/login` and enforce roles: `admin` → `/admin/*`, `branch-owner` → `/:branchName/dashboard`, `customer` → `/account`.
- **Auth** (`src/lib/auth.ts`, `src/lib/api/auth.service.ts`) — session stored under `nova-auth-session` (localStorage when "remember me" is checked, otherwise sessionStorage); helpers `isAdmin`, `isBranchOwner`, `getDashboardDestination`.
- **API layer** (`src/lib/api/`) — `client.ts` (axios instances + `unwrap`), plus `auth.service.ts`, `products.service.ts`, `branches.service.ts`.
- **State** — cart state via React context (`src/store/cart-context.tsx`, `cart-provider.tsx`).
- **Hooks** — `useFetch`, `use-products`, `use-branches`, `use-theme`, `use-click-outside`.
- **UI** — custom design system in `src/components/ui` (button, dialog, drawer, icons, smart-image, etc.), layout components (`store-layout`, `admin-layout`, `branch-layout`, header/footer), and feature components for cart, checkout, products, and storefront.
- **Pages** (`src/pages/`) — `HomePage`, `ProductsPage`, `ProductPage`, `CartPage`, `CheckoutPage`, `Login`, `Signup`, `UserDashboard`, `AdminDashboard`, `AdminAnalytics`, `AdminBranches`, `BranchesPage`, `BranchInventoryPage`.

## Scripts

### Backend

| Command | Description |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run build` / `npm run start:prod` | Build / run production bundle |
| `npm run lint` | oxlint (type-aware) |
| `npm run format` | Prettier write |
| `npm test` / `npm run test:e2e` | Vitest unit / e2e tests |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## Notes & Caveats

- The NestJS boilerplate `backend/README.md` is still present alongside this file.
- Seed data exists for users, categories, and products (`*.seed.ts` / `*Seed.ts`); branches auto-seed three default locations when the collection is empty.
- `backend/.env` is gitignored-style local config — never commit real secrets.
- Role detection is string-based (`role.toLowerCase().includes('admin' | 'owner')`), so keep seeded role names consistent.
- Per `backend/AGENTS.md`, production telemetry can be sent to NestJS Observe via `npx @nestjs/observe link` (not yet wired in).

## License

UNLICENSED (private project).
