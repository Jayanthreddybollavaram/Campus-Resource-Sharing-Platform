# CampusShare (ReSourceConnect)

CampusShare is a campus resource-sharing web application. Students can list resources they are willing to lend, browse available listings, request to borrow items, and manage the request and return process. Administrators have a dashboard for viewing platform activity.

## Current functionality

- Register and log in; authenticated API calls use JWTs.
- Browse resources and view resource details.
- Create, update, and delete resource listings when authenticated.
- Submit borrow requests, view sent and received requests, and cancel, approve, or reject requests.
- Track active and owned borrowings and mark a borrowing as returned.
- Enforce an expected return date from tomorrow through 30 days from today when a borrow request is submitted.
- View student, owner, and administrator dashboards.

The current registration form/API requires a `@gmail.com` email address. Features in earlier planning material such as chat, ratings, notifications, campus SSO, and sustainability-impact reporting are not implemented in this project.

## Technology

- Frontend: HTML, CSS, and browser JavaScript
- Backend: Node.js and Express
- Database: MySQL
- Authentication: JSON Web Tokens (JWT)

## Project layout

```text
Project/
|-- backend/
|   |-- config/             # MySQL connection
|   |-- controllers/        # API behavior
|   |-- middleware/         # Authentication and role checks
|   |-- routes/             # Express API routes
|   |-- test/               # Node.js tests
|   |-- uploads/            # Uploaded resource images
|   |-- server.js           # Web server and frontend static hosting
|   |-- package.json
|   `-- .env                # Optional local configuration; do not publish
|-- database/
|   `-- campus_share.sql    # Schema and sample data
|-- frontend/
|   |-- html/
|   |-- css/
|   |-- js/
|   `-- images/
`-- README.md
```

## Requirements

- Node.js 18 or newer and npm
- MySQL 8 or a compatible MySQL server

## Setup

Run the following steps from the project root directory.

### 1. Create and load the database

The SQL dump creates the tables but expects the database to exist first. Create the database:

```sql
CREATE DATABASE campus_share
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Then import `database/campus_share.sql` into `campus_share`. For example, from Windows Command Prompt (`cmd.exe`, not PowerShell):

```cmd
mysql -u root -p campus_share < database\campus_share.sql
```

Alternatively, select the `campus_share` schema in MySQL Workbench, open `database/campus_share.sql`, and execute the script.

The SQL dump includes sample records for local development. Treat these as demo data; do not use the dump's sample credentials or data for a live deployment.

### 2. Configure the backend

Create or update `.env` with values for your local MySQL instance and a private JWT signing secret. The backend loads configuration from `backend/.env`, then the project-root `.env`, then the workspace-root `.env` (the file next to the `Project` folder); the first file found for each setting takes precedence:

```dotenv
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_share
DB_PORT=3306
JWT_SECRET=replace_with_a_long_random_secret
```

Replace the password and JWT secret placeholders with your local values. If your MySQL account has no password, use `DB_PASSWORD=`. Keep `.env` private and never commit real passwords or signing secrets. `PORT` defaults to `5000` and `DB_PORT` defaults to `3306` if omitted.

### 3. Install dependencies and run tests

```powershell
cd backend
npm ci
npm test
```

The tests use Node's built-in test runner and do not require a live database connection.

### 4. Start the application

From the `backend` directory:

```powershell
npm start
```

Open the application at <http://localhost:5000/>. The backend serves the frontend, so run the application through this server rather than opening the HTML files directly. For development with automatic server restarts, use `npm run dev`.

## Deploying the static pages to Vercel

The `vercel.json` file maps the site root and the `/html`, `/css`, `/js`, and `/images` URLs to the existing `frontend` folders. In Vercel, set the Root Directory to the folder containing `vercel.json` (the `Project` folder if the repository contains an outer wrapper), select **Other** as the framework preset, and leave the build command and output directory empty. Redeploy after changing these settings.

This configuration serves the static pages only. The Express API and MySQL database are not deployed by it, and the frontend currently calls the API at `http://localhost:5000`; login, resource data, and other API-backed features therefore require deploying the backend and configuring the frontend to use its public URL.

## Useful URLs

| URL | Purpose |
| --- | --- |
| `http://localhost:5000/` | Homepage |
| `http://localhost:5000/html/browse.html` | Browse resources |
| `http://localhost:5000/html/login.html` | Login |
| `http://localhost:5000/api/test` | Check that the API server is running |
| `http://localhost:5000/api/db-test` | Check the MySQL connection |

## Main API routes

Protected routes require an `Authorization: Bearer <token>` header unless noted.

| Method | Route | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a student account | No |
| `POST` | `/api/auth/login` | Log in and receive a token | No |
| `GET` | `/api/auth/me` | Get the current account | Yes |
| `GET` | `/api/resources` | List resources | No |
| `GET` | `/api/resources/:id` | Get a resource | No |
| `POST` | `/api/resources` | Create a resource listing | Yes |
| `GET` | `/api/requests/my` | View requests you submitted | Yes |
| `GET` | `/api/requests/received` | View requests for your resources | Yes |
| `POST` | `/api/requests` | Submit a borrow request | Yes |
| `PUT` | `/api/requests/:id/approve` | Approve a request | Yes |
| `PUT` | `/api/requests/:id/reject` | Reject a request | Yes |
| `PUT` | `/api/requests/:id/cancel` | Cancel your pending request | Yes |
| `GET` | `/api/borrowings/my` | View your borrowings | Yes |
| `GET` | `/api/borrowings/owned` | View borrowings of your resources | Yes |
| `PUT` | `/api/borrowings/:id/return` | Mark a borrowing as returned | Yes |
| `GET` | `/api/admin/dashboard` | View administrator dashboard data | Administrator |

## Troubleshooting

- **Database connection fails:** Make sure one of the supported `.env` files defines `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`, and verify that MySQL is running and the `campus_share` database has been imported. Replace the `DB_PASSWORD` placeholder with your local MySQL password, or set `DB_PASSWORD=` if the account has no password.
- **Port 5000 is already in use:** Stop the other process using it or set a different `PORT` in `backend/.env`.
- **The API runs but database-backed pages fail:** Check `http://localhost:5000/api/db-test` and review the backend terminal for connection errors.

## Development notes

This project is a development prototype, not a production deployment package. Before deploying it, review authentication and authorization, configure CORS for the intended frontend origin, replace demo data and secrets, and establish production-safe database and image-upload practices.
