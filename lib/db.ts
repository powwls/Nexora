import { Pool } from "pg";

export type Activity = {
  id: string;
  workspace: string;
  event: string;
  status: "Healthy" | "Attention" | "Paused";
  volume: string;
  updated: string;
};

export type DashboardSummary = {
  assets: {
    total: number;
    active: number;
    maintenance: number;
    retired: number;
    available: number;
  };
  categories: { label: string; count: number }[];
  departments: { label: string; count: number }[];
};

export type Asset = {
  asset: string;
  name: string;
  category: string;
  assigned: string;
  status: string;
};

export type Employee = {
  id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: string;
};

export type NetworkDevice = {
  id: string;
  name: string;
  type: string;
  ip_address: string;
  status: string;
};

export type Maintenance = {
  id: string;
  asset: string;
  issue: string;
  technician: string;
  status: string;
  scheduled: string;
  date_completed: string;
};

let pool: Pool | undefined;

// Reuse one PostgreSQL connection pool during the server lifetime.
export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}

export async function ensureDatabaseSchema(syncMaintenance = true) {
  const database = getPool();
  await database.query(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      workspace TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT NOT NULL,
      volume TEXT NOT NULL,
      updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS assets (
      asset TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      assigned TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active'
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active'
    );
    CREATE TABLE IF NOT EXISTS network_devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Online'
    );
    CREATE TABLE IF NOT EXISTS maintenance (
      id TEXT PRIMARY KEY,
      asset TEXT NOT NULL,
      issue TEXT NOT NULL,
      technician TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      scheduled DATE NOT NULL,
      date_completed DATE
    );
  `);
  await database.query(`ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS date_completed DATE`);
  await database.query(`
    UPDATE maintenance
    SET date_completed = CURRENT_DATE
    WHERE LOWER(status) = 'completed' AND date_completed IS NULL
  `);
  await database.query(`
    UPDATE maintenance
    SET status = 'Pending'
    WHERE LOWER(status) = 'scheduled'
  `);
  if (syncMaintenance) await syncMaintenanceRecords(database);
}

export async function syncMaintenanceRecords(database = getPool()) {
  await database.query(`
    INSERT INTO maintenance (id, asset, issue, technician, status, scheduled)
    SELECT
      'mnt_' || LPAD((COALESCE((
        SELECT MAX(CAST(SUBSTRING(existing.id FROM 5) AS INTEGER))
        FROM maintenance existing
        WHERE existing.id LIKE 'mnt_%'
      ), 0) + ROW_NUMBER() OVER (ORDER BY assets.asset))::text, 3, '0'),
      assets.asset,
      'Maintenance required',
      'IT Department',
      'Pending',
      CURRENT_DATE
    FROM assets
    WHERE LOWER(assets.status) = 'maintenance'
      AND NOT EXISTS (
        SELECT 1
        FROM maintenance
        WHERE maintenance.asset = assets.asset
          AND LOWER(maintenance.status) <> 'completed'
      )
  `);
}

export async function getActivities(): Promise<Activity[]> {
  const database = getPool();
  const result = await database.query<Activity>(
    `SELECT id, workspace, event, status, volume,
            to_char(updated, 'YYYY-MM-DD HH24:MI:SS') AS updated
     FROM workspaces ORDER BY updated DESC LIMIT 8`,
  );
  return result.rows;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const database = getPool();
  const [assets, categories, departments] = await Promise.all([
    database.query<{
      total: string;
      active: string;
      maintenance: string;
      retired: string;
      available: string;
    }>(`SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active')::text AS active,
        COUNT(*) FILTER (WHERE LOWER(status) = 'maintenance')::text AS maintenance,
        COUNT(*) FILTER (WHERE LOWER(status) = 'retired')::text AS retired,
        COUNT(*) FILTER (WHERE LOWER(status) = 'available')::text AS available
      FROM assets`),
    database.query<{ label: string; count: string }>(`SELECT category AS label, COUNT(*)::text AS count
      FROM assets GROUP BY category ORDER BY COUNT(*) DESC`),
    database.query<{ label: string; count: string }>(`SELECT department AS label, COUNT(*)::text AS count
      FROM employees GROUP BY department ORDER BY COUNT(*) DESC`),
  ]);

  const totals = assets.rows[0];
  return {
    assets: {
      total: Number(totals?.total ?? 0),
      active: Number(totals?.active ?? 0),
      maintenance: Number(totals?.maintenance ?? 0),
      retired: Number(totals?.retired ?? 0),
      available: Number(totals?.available ?? 0),
    },
    categories: categories.rows.map((row) => ({
      label: row.label,
      count: Number(row.count),
    })),
    departments: departments.rows.map((row) => ({
      label: row.label,
      count: Number(row.count),
    })),
  };
}

export async function getAssets(): Promise<Asset[]> {
  const result = await getPool().query<Asset>(
    "SELECT asset, name, category, assigned, status FROM assets ORDER BY asset",
  );
  return result.rows;
}

export async function getEmployees(): Promise<Employee[]> {
  const result = await getPool().query<Employee>(
    "SELECT id, name, department, role, email, status FROM employees ORDER BY name",
  );
  return result.rows;
}

export async function getNetworkDevices(): Promise<NetworkDevice[]> {
  const result = await getPool().query<NetworkDevice>(
    "SELECT id, name, type, ip_address, status FROM network_devices ORDER BY id",
  );
  return result.rows;
}

export async function getMaintenance(): Promise<Maintenance[]> {
  const result = await getPool().query<Maintenance>(
    `SELECT id, asset, issue, technician, status,
            to_char(scheduled, 'YYYY-MM-DD') AS scheduled,
            COALESCE(to_char(date_completed, 'YYYY-MM-DD'), '') AS date_completed
     FROM maintenance ORDER BY scheduled DESC`,
  );
  return result.rows;
}
