# Practical Exam: SDN302
**Semester:** FALL 2026 | **Internet Access:** Yes  
**Application Name:** ReadLog

---

## 1. Overview
You will build **ReadLog**, a small web app where each person tracks their own reading sessions: which book, how many minutes, what genre, and when — with a few sessions marked as favorites, and a live summary of minutes read by genre. 

The project will be built with:
- **Framework:** Next.js (App Router, TypeScript) exposing its own REST API (Route Handlers)
- **ORM:** Prisma
- **Database:** PostgreSQL hosted on Supabase
- **Authentication:** Custom email/password authentication (JWT via HttpOnly cookies)
- **Deployment:** Vercel

> **Important:** This exam describes what the app and its API must do, not how to code them. How you structure the code is up to you, as long as the routes, the visible texts, the `data-testid` names, and the API request/response shapes in this document are **exactly as written** — the API is graded by calling it directly, and the web pages are graded with an automated browser, so both must match this spec precisely.

---

## 2. The Application Specification

### 2.1 Setup
- Next.js project (App Router, TypeScript) with **Tailwind CSS** and **ShadCN UI** (`components.json` in the project root, at least two ShadCN components actually used).
- Must build with `npm install` followed by `npm run build` using only three environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `AUTH_SECRET`
  *(No connection string or secret may be written directly in the code).*
- Your `package.json` build script must run Prisma's client generation before building, e.g.:
  ```json
  "build": "prisma generate && next build"
  ```
  so a fresh checkout builds without extra manual steps.
- **Supabase configuration:**
  - Use its PostgreSQL database only (via Prisma).
  - Create one test account for the grader by registering it through your own app's Register page or API before you submit — do not create it directly in Supabase's dashboard.
  - Run your migrations against that Supabase database before submitting (e.g., `npx prisma migrate dev`, or `migrate deploy`) and commit the `prisma/migrations` folder.

---

### 2.2 Data (Prisma + Supabase Postgres)
Design your Prisma schema in `prisma/schema.prisma`. Create at least two models: `User` and `ReadingLog`. Field names must be exactly as written (camelCase):

#### Schema Specification
| Model | Field | What it holds |
| :--- | :--- | :--- |
| **User** | `id` | A unique id for each user |
| **User** | `email` | The user's e-mail, unique |
| **User** | `passwordHash` | A bcrypt hash of the password — never the plain password |
| **User** | `createdAt` | When the account was created |
| **ReadingLog** | `id` | A unique id for each reading session |
| **ReadingLog** | `userId` | The user the reading session belongs to |
| **ReadingLog** | `bookTitle` | The title of the book being read |
| **ReadingLog** | `minutesRead` | How long was spent reading (a positive whole number of minutes) |
| **ReadingLog** | `genre` | One of: `Fiction`, `Non-Fiction`, `Sci-Fi`, `Biography`, `Other` |
| **ReadingLog** | `note` | An optional note, empty by default |
| **ReadingLog** | `favorite` | `true` or `false`, `false` by default |
| **ReadingLog** | `readOn` | The date the session happened |
| **ReadingLog** | `createdAt` | When the row was added |

#### Security Rules (Enforced in API code)
1. Every `/api/reading-logs*` route requires a valid, logged-in session. With no session, or an invalid/expired one, it returns `401` and touches no data.
2. A user may only read, add, change, or delete their own reading sessions.
3. The server must derive the owner from the logged-in session — **never** from a `userId` or `ownerId` sent in the request body or query string. A request that sends someone else's id in the body must be ignored.
4. Build every Prisma query through its query builder (`where`, `data`, etc.) — never by concatenating raw SQL strings.
5. Never commit a real `DATABASE_URL`, `DIRECT_URL`, or `AUTH_SECRET` value to the repository, and never log passwords or password hashes.

---

### 2.3 Authentication
Implement custom email/password authentication (custom JWT API, no NextAuth.js or Supabase Auth required). On successful login, your API must set an **HttpOnly cookie** named `session_token`.

#### Endpoints
- **`POST /api/auth/register`**
  - **Body:** `{ email, password, confirmPassword }`
  - **Success:** Creates a new User (bcrypt hashed password) and returns `201` with `{ id, email }`. Does not log the user in.
- **`POST /api/auth/login`**
  - **Body:** `{ email, password }`
  - **Success:** Sets the `session_token` cookie (HttpOnly) and returns `200` with `{ id, email }`.
  - **Failure:** On wrong password or unknown email, returns `401` with `{ "error": "Invalid email or password" }` and no cookie is set.
- **`POST /api/auth/logout`**
  - Clears the `session_token` cookie and returns `200`. A later call to `GET /api/auth/me` must return `401`.
- **`GET /api/auth/me`**
  - **Success:** Returns `200` with `{ id, email }` for the logged-in user.
  - **Failure:** Returns `401` with `{ "error": "Unauthorized" }` if there is no valid session.

---

### 2.4 Reading Log API

#### Standard Data Shape
Every endpoint below returns one reading session — or a list of them — shaped exactly like this:
```json
{
  "id": "cls9f2q1e0000...",
  "bookTitle": "Atomic Habits",
  "minutesRead": 40,
  "genre": "Non-Fiction",
  "note": "Chapter 3",
  "favorite": false,
  "readOn": "2026-10-20",
  "createdAt": "2026-10-20T08:15:00.000Z"
}
```

#### Standard Error Shape
All error responses from any endpoint in this specification:
```json
{ "error": "<exact message>" }
```

#### Endpoints
- **`GET /api/reading-logs`**
  - Returns only the current user's reading sessions as a JSON array of the standard shape.
  - **Ordering:** Ordered by `readOn` descending (most recent first); ties broken by `bookTitle`, alphabetically, case-insensitive.
  - **Optional Query Parameters:**
    - `?genre=` (one of the five genres)
    - `?favorite=true`
    - `?q=` (matches `bookTitle` OR `note`, case-insensitive, surrounding spaces ignored)
    - *Note:* Parameters combine — every specified filter must match.
- **`GET /api/reading-logs/summary`**
  - Accepts the same optional parameters (`genre`, `favorite`, `q`).
  - Returns a summary computed only over the matching sessions:
    ```json
    {
      "count": 5,
      "favoriteCount": 2,
      "totalMinutes": 180,
      "breakdown": [
        { "genre": "Fiction", "count": 3, "total": 120 },
        { "genre": "Non-Fiction", "count": 2, "total": 60 }
      ]
    }
    ```
  - `breakdown` has one entry per genre present in the matching set, ordered by `total` minutes descending; equal totals are ordered: `Fiction`, then `Non-Fiction`, then `Sci-Fi`, then `Biography`, then `Other`.
  - With nothing matching: `count`, `favoriteCount`, `totalMinutes` are `0` and `breakdown` is `[]`.
- **`POST /api/reading-logs`**
  - **Body:** `{ bookTitle, minutesRead, genre, note?, readOn }`
  - **Success:** Returns `201` with the created reading session.
  - **Validation Failure:** Returns `400` with the exact messages from section 2.5.
  - **Duplicate Check:** If the same `bookTitle`, `minutesRead`, and `readOn` is already saved by this user, returns `409` with:
    ```json
    { "error": "Duplicate reading session: a reading session with the same book title, minutes and date already exists" }
    ```
- **`PATCH /api/reading-logs/:id`**
  - **Body:** Any subset of `{ bookTitle, minutesRead, genre, note, readOn, favorite }`.
  - **Success:** Returns `200` with the updated session.
  - Validation and duplicate rules apply to any field being changed.
  - If ID does not exist or belongs to another user: return `404` with `{ "error": "Reading log not found" }`.
- **`DELETE /api/reading-logs/:id`**
  - **Success:** Deletes session and returns `200` with `{ "success": true }`.
  - If ID does not exist or belongs to another user: return `404` with `{ "error": "Reading log not found" }`.

---

### 2.5 Pages and Behavior

#### 1. Home Page — `/` (Public)
- **Header:**
  - *Logged out:* App name, a Login button (`btn-login`), and a Register button (`btn-register`).
  - *Logged in:* User's email (`user-email`), link to reading logs (`link-reading-logs`), and Logout button (`btn-logout`). After logout, returns to logged-out state, and subsequent `GET /api/auth/me` returns `401`.
- **Body:**
  - Title (`home-title`, text: `ReadLog`).
  - Short description of the app with at least three feature cards (e.g., "Log every session", "Sort by genre", "See minutes read").

#### 2. Register — `/register` & Login — `/login`
- Use custom HTML/client messages, not browser default tooltips (add `noValidate`).
- Nothing is shown before the first submit; an error disappears when its field becomes valid.
- **Register Form:** `email`, `password`, `confirmPassword`. Valid submission calls `POST /api/auth/register` and displays `form-success` with text `Registration successful`.
- **Login Form:** `email`, `password`. Valid submission calls `POST /api/auth/login` and redirects to `/reading-logs`.
- If API returns an error (duplicate account, wrong password), display the message in `error-auth`.

**Auth Validation Rules:**
| Field | Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Email** (both forms) | empty / not a valid e-mail | `Email is required`<br>`Please enter a valid email address` |
| **Password** (both forms) | empty / fewer than 6 characters (*Register only*) | `Password is required`<br>`Password must be at least 6 characters` |
| **Confirm password** (*Register*) | empty / different from password | `Confirm password is required`<br>`Passwords do not match` |

#### 3. Reading Logs — `/reading-logs` (Protected)
- If not logged in, redirects to `/login`. While authenticating, render nothing (no flash of content, no wrong redirect).
- Logged-in view wrapped in `reading-logs-page`.

##### A. Add Reading Session Form (`reading-log-form`, `noValidate`)
- Inputs: Book title, minutes read, genre (dropdown with first empty option `"Choose genre"`, followed by `Fiction`, `Non-Fiction`, `Sci-Fi`, `Biography`, `Other`), optional note, and date.
- Validation triggers on submit; hidden on first load; clears when valid.
- On success: saves via `POST /api/reading-logs`, immediately appears in list, clears form, and displays `reading-log-success` with text `Reading session added`.
- On API error (e.g., duplicate): display message in `error-reading-log`.

**Form Validation Rules:**
| Field | Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Book title** | empty or spaces only / > 80 chars | `Book title is required`<br>`Book title must be at most 80 characters` |
| **Minutes read** | empty or not a number / not a positive number | `Minutes read is required`<br>`Minutes read must be a positive number` |
| **Genre** | nothing chosen / not one of 5 genres | `Please choose a genre`<br>`Invalid genre` |
| **Date** | nothing chosen / date after today | `Date is required`<br>`Date cannot be in the future` |

##### B. The List
- Displays user's sessions from `GET /api/reading-logs` (sorted by `readOn` desc, ties by `bookTitle`).
- Each row (`reading-log-item`) displays: book title, minutes read, genre, date, favorite/star toggle button (`btn-toggle-favorite`), and delete button (`btn-delete-reading-log`).
- Favorite toggle and Delete update state immediately via `PATCH` and `DELETE`.
- Empty state: display `reading-logs-empty` with exact text `No reading sessions found`.

##### C. Filters, Search, and Summary
- **Controls:**
  - Genre filter (All, or one of 5 genres).
  - Favorites only checkbox.
  - Search input (searches `bookTitle` OR `note`, case-insensitive, ignores outer spaces).
  - Clear button: resets all three.
- Combined filters immediately re-fetch list and summary. Sessions falling out of filter criteria disappear immediately.
- **Summary Elements:**
  - `reading-log-count` (plain integer)
  - `favorite-count` (plain integer)
  - `total-minutes` (plain integer)
  - `genre-breakdown` containing `breakdown-row` per active genre (sorted by highest minutes; ties: Fiction, Non-Fiction, Sci-Fi, Biography, Other). Each row contains:
    - `breakdown-name`
    - `breakdown-count`
    - `breakdown-total`

---

### 2.6 Shared State
Sessions are loaded once after login and stored in **React Context** so the form, list, filters, and summary stay in sync without prop drilling. Logging out clears all session data from memory and UI.

### 2.7 Look and Feel
- Responsive: At 375px width, no horizontal scrolling occurs. At 1280px, form and summary sit alongside the list.
- Tailwind CSS and ShadCN UI (Button, Card, Input, Label... at least two used).

---

## 3. Required Test Hooks (Fixed `data-testid` Values)

| Route / Component | Target Element | Exact `data-testid` |
| :--- | :--- | :--- |
| `/` and header | Login / Register buttons (logged out) | `btn-login`, `btn-register` |
| Header (logged in) | User email, Logout button, Link to logs | `user-email`, `btn-logout`, `link-reading-logs` |
| `/` | Title | `home-title` |
| `/login` | Form, inputs, submit button | `login-form`, `login-email`, `login-password`, `login-submit` |
| `/register` | Form, inputs, submit button | `register-form`, `register-email`, `register-password`, `register-confirm-password`, `register-submit` |
| `/login`, `/register` | Validation & Auth messages | `error-email`, `error-password`, `error-confirm-password` *(Register only)*, `error-auth`, `form-success` *(Register only)* |
| `/reading-logs` | Page container | `reading-logs-page` |
| `/reading-logs` form | Form, inputs, submit button | `reading-log-form`, `input-book-title`, `input-minutes`, `input-genre`, `input-note`, `input-date`, `btn-add-reading-log` |
| `/reading-logs` form | Validation & API messages | `error-book-title`, `error-minutes`, `error-genre`, `error-date`, `error-reading-log`, `reading-log-success` |
| `/reading-logs` list | Container, item row, empty state | `reading-log-list`, `reading-log-item`, `reading-logs-empty` |
| Inside `reading-log-item` | Item fields and actions | `reading-log-title`, `reading-log-minutes`, `reading-log-genre`, `reading-log-date`, `btn-toggle-favorite` *(requires `aria-pressed="true" / "false"`)*, `btn-delete-reading-log` |
| `/reading-logs` filters | Filter controls | `filter-genre`, `filter-favorite`, `search-input`, `btn-clear-filters` |
| `/reading-logs` summary | Counts and breakdown | `reading-log-count`, `favorite-count`, `total-minutes`, `genre-breakdown`, `breakdown-row`, `breakdown-name`, `breakdown-count`, `breakdown-total` |

> **Grading Rules:**
> - Only render an error or success element when there is an active message.
> - Texts and error messages are compared **exactly** (case-sensitive).
> - API JSON error bodies must match `{ "error": "<exact message>" }`.

---

## 4. Submission Guidelines

Submit a single folder containing **exactly two files**, named with your Student Code:

### 1. `QE123456.docx`
A real Word file (`.docx` or `.doc`). Follow this exact template (replace with your details; write URLs as plain text with `https://`):
```text
Student Code: QE123456
Full Name: Nguyen Van A
GitHub Repository URL: https://github.com/username/repo-name
Vercel Production URL: https://your-project.vercel.app
Test account email: grader.qe123456@example.com
Test account password: Test1234!
```
*Do NOT put `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, or Supabase passwords in this file.*

### 2. `QE123456.zip`
Source code archive containing:
- `package.json` at root level (not wrapped in a parent folder)
- Lockfile (`package-lock.json` or `pnpm-lock.yaml`)
- `app/` (or `src/`), `components/`, `public/`, `components.json`
- `prisma/schema.prisma` and `prisma/migrations/`
- `.env.example` (listing the 3 variables without values)
- **DO NOT include:** `node_modules`, `.next`, `.git`, or any `.env` file with actual secrets.

---

## 5. Self-Check Checklist Before Submission

- [ ] Register works with a new email; duplicate registration displays API error in `error-auth`.
- [ ] Logged-out access to `/reading-logs` redirects to `/login`.
- [ ] Empty form submission shows validation messages for book title, minutes, genre, date (none visible on load). Negative minutes triggers validation.
- [ ] Adding session immediately updates list without page reload. Duplicate session returns `409` and shows in `error-reading-log`.
- [ ] Favorite button toggles `aria-pressed` state and persists after refresh.
- [ ] Active filters ("favorites only", genre, search) dynamically filter items and summary. Clear resets all.
- [ ] Delete removes item immediately and persists after refresh.
- [ ] Logging in as another user shows only their own data.
- [ ] `GET /api/reading-logs` without cookie returns `401`.
- [ ] Fresh directory builds cleanly with `npm install && npm run build` using only the 3 env variables.
- [ ] Zip has no `.git`, `.next`, or `node_modules`. Word document follows format with student ID.