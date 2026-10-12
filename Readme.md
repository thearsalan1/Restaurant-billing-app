# Restaurant Billing System

A small point-of-sale app for a restaurant, built for the one-day technical assessment. A waiter can open a table, add items from the menu, generate a bill with discount and GST, take payment, and print the bill. There is also a basic menu admin and an order history with a daily sales summary.

The flow I focused on is **Table → Order → Items → Bill → Payment**. I would rather have that working properly than have a lot of half-finished screens, so a few things I considered "nice to have" are listed under [Known issues](#known-issues) and [What I'd do next](#what-id-do-next).

---

## Tech stack

**Backend**
- Node.js + Express with TypeScript
- MongoDB with Mongoose
- Zod for request validation

**Frontend**
- React (Vite) with TypeScript
- Tailwind CSS
- React Router
- Axios

---

## What it can do

**Tables**
- Floor view of all tables with live status: free, occupied, or bill ready
- Tapping a free table opens a new order, tapping a busy one continues its existing order
- Only one open order per table. This is enforced in the database, not just in the UI, so two waiters tapping the same table at the same time can't create two orders

**Taking an order**
- Menu with category tabs, search, and a veg-only filter
- Adding the same item twice increases the quantity instead of adding a second row
- Change quantity with +/- or remove an item (going below 1 removes it)
- Unavailable items are greyed out in the UI and also rejected by the API
- Cancel an order that hasn't been paid

**Billing**
- Discount as a flat amount or a percentage
- GST applied after the discount (rate comes from `.env`, default 5%)
- **Preview** button to see the final total before committing to the bill
- Once a bill is generated the items are locked. The bill can still be regenerated (for example, to change the discount) until payment is taken
- Payment by cash, UPI, or card. After payment the table becomes free again
- Printable bill using the browser's print dialog (navbar and buttons are hidden when printing)

**Menu management**
- Add, edit, and delete menu items
- Mark an item available or unavailable (handy when something runs out)
- Add, rename, and delete categories. A category that still has items can't be deleted

**Table management**
- Add a table, change its number or seat count, or delete it
- A table that already has orders (even old paid ones) can't be deleted, so history never points to a table that no longer exists

**History**
- List of past orders, filterable by status and by table
- Daily sales summary with the total and a cash / UPI / card split

---

## Architecture

```
restaurant-billing/
├── backend/
│   └── src/
│       ├── config/        env validation, DB connection
│       ├── models/        Mongoose schemas
│       ├── routes/        URL -> controller wiring
│       ├── controllers/   thin: read request, call service, send response
│       ├── services/      business logic lives here
│       ├── validators/    Zod schemas for body, params and query
│       ├── middlewares/   validate, central error handler
│       ├── utils/         billing calculation, AppError, helpers
│       ├── app.ts
│       ├── server.ts
│       └── seed.ts
└── frontend/
    └── src/
        ├── pages/         one file per screen
        ├── api.ts         axios instance + money helpers
        └── App.tsx        routes and navbar
```

A request on the backend goes through: **route → validation (Zod) → controller → service → model**.

A few decisions worth mentioning:

- **Controllers stay thin.** Anything that is a rule of the restaurant (an order can't be edited after billing, a table can't have two open orders) is in a service.
- **One error handler.** Services just `throw new AppError(409, "message")`. The central handler turns that, Zod errors, bad ObjectIds, and duplicate-key errors into proper JSON with the right status code.
- **Billing maths is a pure function** (`utils/billing.ts`) with no database access, so it is easy to test on its own.
- **The frontend keeps things simple.** Each page is a single file using `useState` and `useEffect`. Every order-changing endpoint returns the full updated order, so the page just replaces its state instead of re-fetching.

### API overview

| Area | Endpoints |
| --- | --- |
| Categories | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id` |
| Menu | `GET/POST /api/menu`, `PATCH/DELETE /api/menu/:id`, `PATCH /api/menu/:id/availability` |
| Tables | `GET/POST /api/tables`, `PATCH/DELETE /api/tables/:id` |
| Orders | `GET/POST /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel` |
| Order items | `POST /api/orders/:id/items`, `PATCH/DELETE /api/orders/:id/items/:itemId` |
| Billing | `POST /api/orders/:id/bill/preview`, `POST /api/orders/:id/bill`, `POST /api/orders/:id/pay` |

`GET /api/menu` accepts `search`, `veg`, `available` and `category`. `GET /api/orders` accepts `status`, `table` and `limit`.

---

## Database

MongoDB, with Mongoose for schemas and validation. Collections: `categories`, `menuitems`, `tables`, `orders`, and `counters`.

Some modelling choices:

- **Money is stored as integer paise** (₹250 = `25000`), never as floats. The frontend converts to rupees only for display, in one place (`api.ts`).
- **Order items are embedded inside the order**, because they are always read together with it. Each item stores a copy of the **name and price at the time it was ordered**, so changing a menu price later does not change old bills, and deleting a menu item doesn't break history.
- **The GST rate is saved on the order** when the bill is generated, for the same reason.
- **Rounding:** discount is calculated first, then GST on the discounted amount. Each is rounded once to the nearest paisa, and `total = taxable amount + GST`, so the lines on a printed bill always add up exactly. Percentages are handled in integer arithmetic to avoid floating point surprises.
- **One open order per table** is a partial unique index on `orders` (`table`, only where `status = OPEN`). Paid and cancelled orders are not affected, so a table can have any amount of history.
- **Order numbers** come from a small `counters` collection using an atomic `$inc`.
- **Payments are atomic.** The "mark as paid" step is a single conditional update (`status = OPEN` and billed), so double-clicking Pay, or two cashiers paying the same order, can only succeed once.
- I avoided Mongo transactions because they need a replica set, which makes the project harder to run on someone else's machine. Everything that has to be consistent is a single-document atomic update instead.

---

## How to run it

### Prerequisites
- Node.js 18 or newer
- MongoDB, either installed locally or a free MongoDB Atlas cluster

### 1. Clone

```bash
git clone <your-repo-url>
cd restaurant-billing
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set your Mongo connection string:

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `5000` | Port for the API |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/restaurant_billing` | Your MongoDB connection string (use the Atlas URL if you are using Atlas) |
| `NODE_ENV` | `development` | |
| `TAX_RATE` | `5` | GST percentage added to bills |

Then load the demo data and start the server:

```bash
npm run seed
npm run dev
```

You should see `MongoDB connected` and `Server running on http://localhost:5000`. A quick check: `http://localhost:5000/api/health`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server forwards `/api` calls to the backend on port 5000, so there is nothing else to configure.

### Database setup

There are no migrations. Collections and indexes are created automatically. `npm run seed` fills in 6 categories, 18 menu items (one of them, Ice Cream, is deliberately marked unavailable so you can see that behaviour), and 8 tables.

> Heads up: `npm run seed` **wipes** categories, menu items, tables and orders before inserting. Run it any time you want a clean slate.

### Login

There is no authentication, so there are no credentials. Just open the app.

---

## Testing

- `npm run check:billing` (inside `backend`) runs a few assertions on the billing calculation: rounding, percent and flat discounts, decimal tax rates, and a discount larger than the subtotal.
- The `postman/` folder has a Postman collection that exercises the API end to end (around 90 requests with checks on status codes and exact bill amounts). Run `npm run seed` first, then run the collection top to bottom in the Collection Runner. It assumes `TAX_RATE=5`.

---

## Known issues

Being upfront about the rough edges:

- **No authentication.** Anyone who can open the app can use every screen, including menu editing.
- **No reports endpoint.** The daily sales summary on the History page is calculated in the browser from the latest 100 paid orders. That is fine for a day's sales in a small restaurant, but it would not scale and it ignores anything older than the last 100.
- **No live updates.** The tables screen loads when you open it. If another waiter opens a table on a different device, you need to reload to see it (the API still protects you from creating a duplicate order).
- **Errors are shown with plain browser alerts.** They show the real message from the server, but they are not pretty.
- **One GST rate for everything.** There is no CGST/SGST split and no per-item tax.
- **Automated tests are limited** to the billing function and the Postman collection. There are no unit or integration tests for the services or the UI.
- **The order history is capped** at the latest 100 orders and has no pagination.

---

## What I'd do next

If I had more time, in roughly this order:

1. **Login with roles** (admin vs. waiter), so only an admin can edit the menu or tables
2. **A proper reports endpoint** with date ranges, top-selling items, and an aggregation on the server instead of the browser
3. **Live table status**, either by polling or WebSockets, plus a **kitchen view** so orders can move from pending to preparing to served
4. **Split bill**, CGST/SGST breakdown on the printed bill, and per-item tax rates
5. **Order notes** for things like "no onions", and a takeaway order type
6. **Automated tests** with Jest and Supertest for the services, and a few end-to-end tests for the main flow
7. **Pagination** for history and toast notifications instead of alerts