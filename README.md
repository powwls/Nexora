# Nexora

A data-driven operations dashboard built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dashboard uses realistic demo data until `DATABASE_URL` is configured. The API route is ready to read from PostgreSQL.

## PostgreSQL

The expected connection string is:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora"
```

## Database setup

The server creates the required tables (`workspaces`, `assets`, `employees`, `network_devices`, and `maintenance`) automatically when an API route runs. To add starter records for every page, run this once while the dev server is running:

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/seed -Method Post
```

Check the connection with:

```text
http://localhost:3001/api/health
```

Available data pages:

- `/assets`
- `/employees`
- `/network-devices`
- `/maintenance`
- `/reports`
- `/settings`

