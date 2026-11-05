# Subject: SDN302 | Semester: FALL 2026
## Final Exam Project Specification: ExpenseTrail

---

## 1. Overview

You will build **ExpenseTrail**, a small web app where each person tracks their own personal expenses: what was spent, how much, on which category, and when — with a few expenses starred as important, and a live summary of spending by category. 

### Tech Stack Requirements:
- **Framework:** Next.js (App Router, TypeScript) exposing its own REST API (Route Handlers).
- **ORM:** Prisma.
- **Database:** PostgreSQL hosted on Supabase.
- **Authentication:** Custom email/password authentication (JWT stored in HttpOnly cookie).
- **Deployment:** Vercel.

> **Note:** This exam describes what the app and its API must do, not how to code them. How you structure the code is up to you, as long as the routes, the visible texts, the `data-testid` names, and the API request/response shapes in this document are **exactly as written** — the API is graded by calling it directly, and the web pages are graded with an automated browser, so both must match this spec precisely.

---

## 2. The Application

### 2.1 Setup
- A Next.js project (App Router, TypeScript) with Tailwind CSS and ShadCN UI (`components.json` in the project root, at least two ShadCN components actually used).
- Must build with `npm install` followed by `npm run build` using only three environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `AUTH_SECRET`
  *(No connection string or secret may be written directly in the code).*
- Your `package.json` build script must run Prisma's client generation before building, e.g.:
  ```json
  "build": "prisma generate && next build"
  ```
- **Supabase Project:** Use its PostgreSQL database only (via Prisma). Create one test account for the grader by registering it through your own app's Register page or API before you submit — do not create it directly in Supabase's dashboard.
- Run your migrations against that Supabase database before submitting (`npx prisma migrate dev` or `prisma migrate deploy`) and commit the `prisma/migrations` folder.

---

### 2.2 Data (Prisma + Supabase Postgres)

Design your Prisma schema in `prisma/schema.prisma`. Create at least two models: `User` and `Expense`. Field names must be **camelCase** and named exactly as specified.

| Model | Field | Type / Requirement | What it holds |
| :--- | :--- | :--- | :--- |
| **User** | `id` | Unique identifier | Unique ID for each user |
| **User** | `email` | String, Unique | The user's e-mail |
| **User** | `passwordHash` | String | A bcrypt hash of the password (never plain text) |
| **User** | `createdAt` | DateTime | When the account was created |
| **Expense** | `id` | Unique identifier | Unique ID for each expense |
| **Expense** | `userId` | Foreign key to User | The user the expense belongs to |
| **Expense** | `title` | String | What the expense was for |
| **Expense** | `amount` | Float / Decimal | Positive number, 2 decimal places |
| **Expense** | `category` | String / Enum | One of: `Food`, `Transport`, `Bills`, `Shopping`, `Other` |
| **Expense** | `note` | String (optional) | Optional note, empty string by default |
| **Expense** | `starred` | Boolean | `true` or `false`, `false` by default |
| **Expense** | `spentAt` | String / Date | The date the expense happened (`YYYY-MM-DD`) |
| **Expense** | `createdAt` | DateTime | Timestamp when the row was added |

#### Security Rules:
1. Every `/api/expenses*` route requires a valid, logged-in session. With no session, or an invalid/expired one, return `401` and touch no data.
2. A user may only read, add, change, or delete their own expenses. The server must derive the owner from the logged-in session — never from a `userId` or `ownerId` sent in the request body or query string.
3. Build every Prisma query through its query builder (`where`, `data`, etc.) — never raw SQL concatenation with user input.
4. Never commit real credentials to Git and never log passwords or hashes.

---

### 2.3 Authentication

Custom email/password authentication using JWT (no NextAuth.js or Supabase Auth required). On successful login, set an **HttpOnly** cookie named `session_token`.

- **`POST /api/auth/register`**
  - **Body:** `{ email, password, confirmPassword }`
  - **Success:** Status `201` with body `{ id, email }`. Does not log the user in.
- **`POST /api/auth/login`**
  - **Body:** `{ email, password }`
  - **Success:** Sets `session_token` cookie (HttpOnly), returns `200` with `{ id, email }`.
  - **Failure:** Returns `401` with `{ "error": "Invalid email or password" }` (no cookie set).
- **`POST /api/auth/logout`**
  - Clears `session_token` cookie and returns `200`. A subsequent `GET /api/auth/me` must return `401`.
- **`GET /api/auth/me`**
  - **Success:** Returns `200` with `{ id, email }` for the logged-in user.
  - **Unauthorized:** Returns `401` with `{ "error": "Unauthorized" }`.

---

### 2.4 Expense API

All endpoints require a valid session.

#### Expense Object JSON Shape:
```json
{
  "id": "cls9f2q1e0000...",
  "title": "Grab to campus",
  "amount": 45000,
  "category": "Transport",
  "note": "Morning class",
  "starred": false,
  "spentAt": "2026-10-20",
  "createdAt": "2026-10-20T08:15:00.000Z"
}
```

#### Error Format:
```json
{ "error": "<exact message>" }
```

#### Endpoints:
- **`GET /api/expenses`**
  - Returns user's expenses as a JSON array sorted by `spentAt` descending (most recent first); ties broken by `title` alphabetically (case-insensitive).
  - **Query parameters:**
    - `?category=` (one of the five categories)
    - `?starred=true`
    - `?q=` (matches title OR note, case-insensitive, trimmed)
    - Parameters must combine (AND logic).
- **`GET /api/expenses/summary`**
  - Accepts same query parameters (`category`, `starred`, `q`).
  - **Response Shape:**
    ```json
    {
      "count": 5,
      "starredCount": 2,
      "totalAmount": 530000,
      "breakdown": [
        { "category": "Food", "count": 3, "total": 300000 },
        { "category": "Transport", "count": 2, "total": 230000 }
      ]
    }
    ```
  - **Breakdown ordering:** Ordered by total amount descending. Equal totals tie-break order: `Food` $\to$ `Transport` $\to$ `Bills` $\to$ `Shopping` $\to$ `Other`.
  - If nothing matches: `count: 0`, `starredCount: 0`, `totalAmount: 0`, `breakdown: []`.
- **`POST /api/expenses`**
  - **Body:** `{ title, amount, category, note?, spentAt }`
  - **Success:** Returns `201` with created expense.
  - **Validation errors:** Returns `400` with exact message from section 2.5.
  - **Duplicate check:** If an expense with the same `title`, `amount`, and `spentAt` already exists for this user, return `409` with:
    `{ "error": "Duplicate expense: an expense with the same title, amount and date already exists" }`
- **`PATCH /api/expenses/:id`**
  - **Body:** Subset of `{ title, amount, category, note, spentAt, starred }`.
  - **Success:** Returns `200` with updated expense.
  - **Not found / Not owner:** Returns `404` with `{ "error": "Expense not found" }`.
- **`DELETE /api/expenses/:id`**
  - **Success:** Deletes expense, returns `200` with `{ "success": true }`.
  - **Not found / Not owner:** Returns `404` with `{ "error": "Expense not found" }`.

---

### 2.5 Pages and UI Specifications

#### Home — `/` (Public)
- **Header:**
  - *Logged out:* App name, Login button, Register button.
  - *Logged in:* User's email, link to `/expenses`, Logout button.
- **Content:** Title (`home-title`, text: `ExpenseTrail`), short description, and at least 3 feature cards (e.g., "Track spending", "Sort into categories", "See where it goes").

#### Register — `/register` & Login — `/login`
- Use custom client validation messages (`noValidate` on forms). Nothing shown prior to first submit; errors clear when valid.
- **Register:** `email`, `password`, `confirmPassword`. On success, calls `POST /api/auth/register` and displays `form-success` with text `Registration successful`.
- **Login:** `email`, `password`. On success, calls `POST /api/auth/login` and redirects to `/expenses`.
- Server errors display in `error-auth`.

**Auth Form Validation Rules:**

| Field | Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Email** (both forms) | Empty | `Email is required` |
| | Not valid format | `Please enter a valid email address` |
| **Password** (both forms) | Empty | `Password is required` |
| **Password** (Register only) | Fewer than 6 characters | `Password must be at least 6 characters` |
| **Confirm password** (Register) | Empty | `Confirm password is required` |
| | Mismatch with password | `Passwords do not match` |

#### Expenses — `/expenses` (Protected)
- If not logged in, redirect to `/login`. No flash of unauthenticated content.
- Page container must have `data-testid="expenses-page"`.

**A. Add an Expense Form (`expense-form`, `noValidate`)**
- Fields: `title`, `amount`, `category` (default empty option "Choose category", followed by `Food`, `Transport`, `Bills`, `Shopping`, `Other`), optional `note`, and `date`.
- On submit success: call `POST /api/expenses`, append to list immediately, clear form, show `expense-success` with text `Expense added`.
- On API error: display inside `error-expense`.

**Expense Form Validation Rules:**

| Field | Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Title** | Empty or whitespace only | `Title is required` |
| | Longer than 80 characters | `Title must be at most 80 characters` |
| **Amount** | Empty or not a number | `Amount is required` |
| | Not a positive number ($\le 0$) | `Amount must be a positive number` |
| **Category** | Nothing chosen | `Please choose a category` |
| | Not one of 5 allowed options | `Invalid category` |
| **Date** | Nothing chosen | `Date is required` |
| | Future date ($> \text{today}$) | `Date cannot be in the future` |

**B. Expense List**
- Displays user's expenses (`expense-list`) ordered by `spentAt` desc, then title asc.
- Each item (`expense-item`) shows: `expense-title`, `expense-amount` (formatted to 2 decimal places), `expense-category`, `expense-date`, `btn-toggle-star` (with `aria-pressed="true"|"false"`), and `btn-delete-expense`.
- Empty state: show `expenses-empty` with text `No expenses found`.

**C. Filters, Search & Summary**
- **Controls:** Category filter (`filter-category`, select, empty value = All), starred checkbox (`filter-starred`), search box (`search-input`), and clear button (`btn-clear-filters`).
- Immediate filtering without reload or submit buttons.
- **Summary:**
  - `expense-count`: plain integer.
  - `starred-count`: plain integer.
  - `total-amount`: 2 decimal places.
  - `category-breakdown`: container containing `breakdown-row` elements with `breakdown-name`, `breakdown-count`, `breakdown-total`.

### 2.6 Shared State
- Expenses must be held in React Context so form, list, filters, and summary share data.
- On logout / switch account, previous state must be purged completely from memory.

### 2.7 Responsive Design
- Mobile ($375\text{px}$): No horizontal scroll.
- Desktop ($1280\text{px}$): Form and summary sit alongside list.
- ShadCN UI & Tailwind CSS used across components.

---

## 3. Required Test Hooks (`data-testid`)

| Route / Component | Element | `data-testid` |
| :--- | :--- | :--- |
| `/` and header | Logged out Login & Register buttons | `btn-login`, `btn-register` |
| Header (logged in) | User email, Logout button, Expenses link | `user-email`, `btn-logout`, `link-expenses` |
| `/` | Page main title | `home-title` |
| `/login` | Form, email, password, submit button | `login-form`, `login-email`, `login-password`, `login-submit` |
| `/register` | Form, email, password, confirm pass, submit | `register-form`, `register-email`, `register-password`, `register-confirm-password`, `register-submit` |
| `/login`, `/register` | Validation & feedback messages | `error-email`, `error-password`, `error-confirm-password` (register only), `error-auth`, `form-success` (register only) |
| `/expenses` | Page container | `expenses-page` |
| `/expenses` (Form) | Form, inputs, submit button | `expense-form`, `input-title`, `input-amount`, `input-category`, `input-note`, `input-date`, `btn-add-expense` |
| `/expenses` (Form) | Status messages | `error-title`, `error-amount`, `error-category`, `error-date`, `error-expense`, `expense-success` |
| `/expenses` (List) | Container, item, empty state | `expense-list`, `expense-item`, `expenses-empty` |
| `/expenses` (Item) | Details and action buttons | `expense-title`, `expense-amount`, `expense-category`, `expense-date`, `btn-toggle-star` (with `aria-pressed`), `btn-delete-expense` |
| `/expenses` (Filters) | Filter controls | `filter-category`, `filter-starred`, `search-input`, `btn-clear-filters` |
| `/expenses` (Summary) | Summary statistics & breakdown | `expense-count`, `starred-count`, `total-amount`, `category-breakdown`, `breakdown-row`, `breakdown-name`, `breakdown-count`, `breakdown-total` |

> **Crucial:** Render error/success elements **only** when a message exists. Text matching is exact (case-sensitive).

---

## 4. Submission Checklist

Submit a single folder named with your student ID (e.g., `QE123456`) containing two files:

### 1. `QE123456.docx`
Must contain exact visible text matching:
```text
Student Code: QE123456
Full Name: Nguyen Van A
GitHub Repository URL: https://github.com/username/repo-name
Vercel Production URL: https://your-project.vercel.app
Test account email: grader.qe123456@example.com
Test account password: Test1234!
```
*(Do NOT include credentials in this document; configure them solely in Vercel).*

### 2. `QE123456.zip`
- Must contain `package.json` at root level.
- Include: lockfile, `app/` (or `src/`), `components/`, `public/`, `components.json`, `prisma/`, `.env.example`.
- **Exclude:** `node_modules`, `.next`, `.git`, `.env` (with real values).

---

## 5. Self-Check Verification Checklist

- [ ] New registration works and duplicate registration shows message in `error-auth`.
- [ ] Logged-out access to `/expenses` redirects to `/login`.
- [ ] Submitting empty expense form triggers validation messages without page reload.
- [ ] Adding an expense updates the list immediately; adding duplicate (title + amount + date) returns 409 and shows `error-expense`.
- [ ] Favorite star toggles `aria-pressed` and persists after page refresh.
- [ ] Starred filter hides unstarred items immediately upon un-starring.
- [ ] Filters (category, search, starred) update summary and list dynamically; Clear button resets state.
- [ ] Deleting an expense removes it immediately and persists after refresh.
- [ ] Unauthenticated API calls to `/api/expenses` return status `401`.
- [ ] Fresh directory builds cleanly with:
  ```bash
  npm install && npm run build
  ```
- [ ] Submission `.zip` is free of `node_modules`, `.next`, and `.git`.