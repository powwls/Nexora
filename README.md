# Nexora

Nexora is an IT infrastructure management dashboard for tracking assets, employees, network devices, maintenance work, and operational activity.

It is built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and a responsive interface for desktop, tablet, and mobile screens.

## Features

- Dashboard with asset, category, department, and activity summaries
- Asset management with create, edit, delete, search, and Excel export
- Employee records management
- Network device inventory management
- Maintenance ticket tracking and status updates
- Reports and workspace settings pages
- PostgreSQL health check and automatic schema initialization
- Protected administrator login
- Responsive sidebar navigation, cards, tables, forms, and dashboard layouts

## Requirements

- Node.js 18.18 or newer
- npm
- PostgreSQL 14 or newer

## Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd Nexora
npm install
```

Create a file named `.env.local` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora"
ADMIN_EMAIL="admin@nexora.local"
ADMIN_PASSWORD="NexoraAdmin2026!"
```

Make sure the `nexora` PostgreSQL database exists before starting the application.

## Run the application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in through the login page.

For a production build:

```bash
npm run build
npm start
```

## Database setup and seed data

The application creates and updates the required tables automatically when a database-backed route is accessed. The following tables are used:

- `workspaces`
- `assets`
- `employees`
- `network_devices`
- `maintenance`

To add demo records, start the development server and send a POST request to the seed endpoint.

PowerShell:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method Post
```

The database connection can be checked at:

```text
http://localhost:3000/api/health
```

## Login

The default administrator account is:

```text
Email: admin@nexora.local
Password: NexoraAdmin2026!
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local` to use different credentials. Do not use the default password in a production deployment.

## Application routes

| Route | Description |
| --- | --- |
| `/` | Dashboard overview |
| `/login` | Administrator login |
| `/assets` | IT asset records |
| `/employees` | Employee records |
| `/network-devices` | Network device records |
| `/maintenance` | Maintenance tickets |
| `/reports` | Reports workspace |
| `/settings` | Workspace settings and database status |

## API routes

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/login` | `POST` | Authenticate an administrator |
| `/api/auth/logout` | `POST` | End the current session |
| `/api/auth/me` | `GET` | Get the current administrator |
| `/api/assets` | `GET`, `POST`, `PATCH`, `DELETE` | Manage assets |
| `/api/employees` | `GET`, `POST`, `PATCH`, `DELETE` | Manage employees |
| `/api/network-devices` | `GET`, `POST`, `PATCH`, `DELETE` | Manage network devices |
| `/api/maintenance` | `GET`, `PATCH`, `DELETE` | Manage maintenance records |
| `/api/metrics` | `GET` | Get dashboard metrics and activity |
| `/api/health` | `GET` | Check PostgreSQL connectivity |
| `/api/seed` | `POST` | Insert demo records |

## Project structure

```text
app/                    Next.js pages and API routes
components/             Shared dashboard, navigation, table, and settings UI
lib/                    Authentication, database, and CRUD helpers
prisma/                 Prisma schema reference
public/                 Static assets
middleware.ts           Route protection for authenticated pages
```

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm start         # Start the production server
npm run lint      # Run the configured lint command
```

