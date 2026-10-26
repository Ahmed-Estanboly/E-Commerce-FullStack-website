# E-Commerce Frontend — 4 People, 4 Days

**Stack:** React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form  
**Scope:** Frontend MVP only. The goal is a working, presentable demo—not a complete production e-commerce platform.

## 1. What We Will Build

### Customer side
- Home page with featured products
- Product listing with basic search/category filter
- Product details
- Cart: add/remove items and change quantity
- Checkout form and order confirmation screen

### Staff side
- Staff login screen (demo UI)
- Admin dashboard with summary cards
- Product management: list, add, edit, delete (using mock data)
- Inventory page showing stock by branch/warehouse
- Orders page with status and basic order details

### Shared UI
- Responsive header/navigation
- Admin sidebar
- Buttons, inputs, cards, tables, badges, dialogs
- Loading, empty, and error states where practical

## 2. Keep the Scope Small

To finish in four days:
- Use mock data and local frontend state if the backend is not ready.
- Do not implement real payment processing.
- Do not build purchasing, supplier management, transfers, returns, reports, customer accounts, or complex warehouse-location workflows.
- Keep product and order data structures simple and shared across pages.
- Use simple inline SVGs or text symbols for icons; do not install an icon library.
- Use React Hook Form for forms and its built-in validation; do not add Zod.
- Use React hooks and a small API helper if backend endpoints are available; do not add TanStack Query.

## 3. Suggested Project Structure

```text
src/
├── app/
│   ├── App.tsx
│   └── router.tsx
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Modal, Table, skeleton
│   ├── layout/             # StoreHeader, AdminLayout, AdminSidebar, mobile header
│   └── feedback/           # EmptyState, LoadingState, Toast
├── data/                   # Mock products, orders, inventory
├── pages/
│   ├── storefront/         # Home, product listing, product details
│   ├── cart/               # Cart and checkout
│   ├── admin/              # Dashboard and demo login
│   ├── products/           # Product CRUD screens
│   ├── inventory/          # Stock overview
│   └── orders/             # Orders list/details
├── hooks/
├── types/
├── lib/                    # Formatting and optional API helper
├── main.tsx
└── index.css
```

## 4. Routes

```text
/                         Home
/shop                     Product listing
/products/:id             Product details
/cart                     Cart
/checkout                 Checkout form
/checkout/success         Order confirmation
/admin/login              Demo staff login
/admin                    Dashboard
/admin/products            Product management
/admin/products/new        Add product
/admin/products/:id        Edit product
/admin/inventory           Branch/warehouse stock overview
/admin/orders              Orders list
/admin/orders/:id          Order details
```

## 5. Basic Data Types

Create these types early and use them everywhere:

```ts
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered";
};

export type InventoryItem = {
  productId: string;
  productName: string;
  branchName: string;
  warehouseName: string;
  quantity: number;
};
```

For the demo, totals and stock can be calculated from mock state. If a backend is connected, display authoritative values returned by the API.

## 6. Team Split

Each person owns their pages and related components. Agree on types, routes, and shared component props on Day 1.

### Person 1 — Storefront
- Home page
- Product listing
- Search/category filter
- Product details
- Responsive customer header

### Person 2 — Cart and Checkout
- Cart page
- Add/remove/update quantity behavior
- Checkout form
- Order confirmation
- Shared cart state (Context or a small custom hook)

### Person 3 — Admin Products and Inventory
- Admin layout/sidebar (coordinate with Person 4)
- Product list, add, edit, delete screens
- Inventory table with branch and warehouse columns
- Mock product/inventory data

### Person 4 — Admin Dashboard and Orders
- Demo staff login
- Dashboard summary cards
- Orders list and order details
- Shared admin layout/sidebar (coordinate with Person 3)
- Final integration support and responsive fixes

## 7. Four-Day Schedule

### Day 1 — Setup and skeleton
**Everyone:**
- Create Vite React TypeScript project and configure Tailwind.
- Agree on types, routes, colors, spacing, and shared components.
- Create mock data and confirm the app runs.

**Deliverable:** All routes render placeholder pages; shared layout and navigation are ready.

### Day 2 — Build main pages
- Person 1: Home, product listing, product details.
- Person 2: Cart UI and quantity controls.
- Person 3: Product management table/form and inventory table.
- Person 4: Admin dashboard and orders table.

**Deliverable:** Main screens work with mock data; no page is left as a blank placeholder.

### Day 3 — Connect interactions
- Person 1: Search/filter and product-to-cart actions.
- Person 2: Shared cart state, checkout validation, confirmation page.
- Person 3: Product create/edit/delete in local state; inventory display.
- Person 4: Order details/status UI and demo login flow.

**Everyone:** Integrate through the agreed routes and shared types. Fix TypeScript errors.

**Deliverable:** User can browse products, add to cart, complete demo checkout, and staff can navigate admin pages.

### Day 4 — Integration and polish
- Test every route and main user flow.
- Fix layout problems on mobile and desktop.
- Add empty states, basic error feedback, and form validation.
- Remove broken buttons and unused code.
- Prepare demo data and rehearse the demo.

**Deliverable:** Stable frontend MVP ready to present.

## 8. Required User Flows

### Customer flow
1. Open home page.
2. Browse/search products.
3. Open a product.
4. Add it to cart.
5. Update quantity or remove item.
6. Enter checkout details.
7. Submit demo checkout.
8. See order confirmation.

### Staff flow
1. Open admin login.
2. Use demo credentials or a demo login button.
3. View dashboard.
4. Open products and add/edit/delete a product.
5. Open inventory and view stock by branch/warehouse.
6. Open orders and view order details/status.

## 9. Definition of Done

- [ ] App starts without errors.
- [ ] All listed routes render.
- [ ] Navigation works between customer and admin sections.
- [ ] Product search/filter works.
- [ ] Cart supports add, remove, and quantity changes.
- [ ] Checkout validates required fields and shows confirmation.
- [ ] Product management supports add/edit/delete in mock state.
- [ ] Inventory shows product, branch, warehouse, and quantity.
- [ ] Orders list and details render with status.
- [ ] Pages are usable on mobile and desktop.
- [ ] No dead buttons, obvious TypeScript errors, or unfinished blank pages.

## 10. Team Rules to Avoid Integration Problems

1. **Do not edit another person's feature files without coordinating.**
2. Use the shared `Product`, `CartItem`, and `Order` types; do not create duplicates.
3. Keep routes exactly as listed unless the team agrees to change them.
4. Build simple components first; avoid spending time on advanced animations.
5. Commit small changes and integrate at least twice per day.
6. If a feature is behind schedule, reduce its scope instead of delaying integration.
7. Prioritize working flows over extra pages.

## Final Priority

**Must have:** storefront, product details, cart, checkout demo, admin dashboard, product CRUD demo, inventory overview, orders view.

**Only if time remains:** charts, advanced filters, pagination, animations, real API integration, advanced permissions, and additional admin modules.
