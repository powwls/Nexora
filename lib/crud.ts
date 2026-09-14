import { getPool, syncMaintenanceRecords } from "@/lib/db";

export type CrudResource = "assets" | "employees" | "network-devices" | "maintenance";

async function syncAssetStatusForMaintenance(database = getPool(), assetId: string) {
  const activeMaintenance = await database.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM maintenance
     WHERE asset = $1 AND LOWER(status) <> 'completed'`,
    [assetId],
  );

  await database.query(
    `UPDATE assets
     SET status = $1
     WHERE asset = $2`,
    [activeMaintenance.rows[0]?.total ? "Maintenance" : "Active", assetId],
  );
}

const resourceConfig = {
  assets: {
    table: "assets",
    key: "asset",
    prefix: "IT-",
    fields: ["asset", "name", "category", "deviceType", "assigned", "status"],
    optionalFields: [],
  },
  employees: {
    table: "employees",
    key: "id",
    prefix: "emp_",
    fields: ["id", "name", "department", "role", "email", "status"],
    optionalFields: [],
  },
  "network-devices": {
    table: "network_devices",
    key: "id",
    prefix: "net_",
    fields: ["id", "name", "type", "ip_address", "mac_address", "brand", "model", "location", "status"],
    optionalFields: ["mac_address", "brand", "model", "location"],
  },
  maintenance: {
    table: "maintenance",
    key: "id",
    prefix: "mnt_",
    fields: ["id", "asset", "issue", "technician", "status", "scheduled"],
    optionalFields: [],
  },
} as const;

export function isCrudResource(value: string): value is CrudResource {
  return value in resourceConfig;
}

function getConfig(resource: CrudResource) {
  return resourceConfig[resource];
}

function normalizeAssetValues(values: Record<string, string>) {
  const category = String(values.category ?? "");
  const deviceType = String(values.deviceType ?? "").trim();

  if (!category) return values;

  if (!deviceType) {
    values.deviceType = "Standard";
    return values;
  }

  values.deviceType = deviceType;
  return values;
}

function validatePayload(resource: CrudResource, payload: Record<string, unknown>, includeKey = true) {
  const config = getConfig(resource);
  const fields = includeKey ? config.fields : config.fields.filter((field) => field !== config.key);
  const values = fields.map((field) => [field, payload[field]] as const);
  const missing = values.find(([field, value]) =>
    !config.optionalFields?.includes(field as never) && (value === undefined || value === ""),
  );
  if (missing) throw new Error(`Missing required field: ${missing[0]}`);
  const normalized = Object.fromEntries(values.map(([field, value]) => [field, String(value)]));
  const allowedValues: Record<string, string[]> = resource === "assets"
    ? { status: ["Active", "Maintenance", "Available", "Retired"] }
    : resource === "employees"
      ? { status: ["Active", "Inactive"] }
      : resource === "network-devices"
        ? {
            type: ["Router", "Switch", "Firewall", "Access Point", "Other"],
            status: ["Online", "Offline", "Maintenance", "Unknown"],
          }
        : { status: ["Pending", "In Progress", "Completed"] };
  for (const [field, options] of Object.entries(allowedValues)) {
    if (normalized[field] && !options.includes(normalized[field])) {
      throw new Error(`Invalid ${field}. Choose one of: ${options.join(", ")}.`);
    }
  }
  return resource === "assets" ? normalizeAssetValues(normalized) : normalized;
}

export async function createRecord(resource: CrudResource, payload: Record<string, unknown>) {
  const config = getConfig(resource);
  const database = getPool();
  const values = validatePayload(resource, payload, false);
  const keyResult = await database.query<{ key: string | null }>(
    `SELECT ${config.key} AS key FROM ${config.table} WHERE ${config.key} LIKE $1 ORDER BY CAST(SUBSTRING(${config.key} FROM LENGTH($2) + 1) AS INTEGER) DESC LIMIT 1`,
    [`${config.prefix}%`, config.prefix],
  );
  const lastKey = keyResult.rows[0]?.key;
  const lastNumber = lastKey ? Number(lastKey.slice(config.prefix.length)) : 0;
  const generatedKey = `${config.prefix}${String(lastNumber + 1).padStart(3, "0")}`;
  const fields = [config.key, ...config.fields.filter((field) => field !== config.key)];
  const columns = fields.join(", ");
  const parameters = [generatedKey, ...config.fields.filter((field) => field !== config.key).map((field) => values[field])];
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
  const result = await database.query(
    `INSERT INTO ${config.table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    parameters,
  );
  if (resource === "assets" && values.status?.toLowerCase() === "maintenance") {
    await syncMaintenanceRecords(database);
  }
  if (resource === "maintenance") {
    const assetId = String(values.asset ?? "");
    if (assetId) {
      const status = String(values.status ?? "Pending").toLowerCase();
      await database.query(
        `UPDATE assets
         SET status = $1
         WHERE asset = $2`,
        [status === "completed" ? "Active" : "Maintenance", assetId],
      );
    }
  }
  return result.rows[0];
}

export async function updateRecord(
  resource: CrudResource,
  keyValue: string,
  payload: Record<string, unknown>,
) {
  const config = getConfig(resource);
  const database = getPool();
  const values = validatePayload(resource, payload, false);
  if (resource === "maintenance") {
    const current = await database.query<{ status: string; asset: string }>(
      "SELECT status, asset FROM maintenance WHERE id = $1",
      [keyValue],
    );
    if (current.rows[0]?.status.toLowerCase() === "completed" && values.status.toLowerCase() !== "completed") {
      throw new Error("Completed maintenance tickets are locked.");
    }
  }
  const fields = config.fields.filter((field) => field !== config.key);
  const parameters = fields.map((field) => values[field]);
  parameters.push(keyValue);
  const updates = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
  const result = await database.query(
    `UPDATE ${config.table} SET ${updates} WHERE ${config.key} = $${parameters.length} RETURNING *`,
    parameters,
  );
  if (resource === "assets" && values.status?.toLowerCase() === "maintenance") {
    await syncMaintenanceRecords(database);
  }
  if (resource === "maintenance") {
    const assetId = String(payload.asset ?? "");
    const maintenanceStatus = String(values.status ?? "Pending").toLowerCase();
    if (assetId) {
      await database.query(
        `UPDATE assets SET status = $1 WHERE asset = $2`,
        [maintenanceStatus === "completed" ? "Active" : "Maintenance", assetId],
      );
    }
    await database.query(
      maintenanceStatus === "completed"
        ? "UPDATE maintenance SET date_completed = CURRENT_DATE WHERE id = $1"
        : "UPDATE maintenance SET date_completed = NULL WHERE id = $1",
      [keyValue],
    );
  }
  return result.rows[0] ?? null;
}

export async function deleteRecord(resource: CrudResource, keyValue: string) {
  const config = getConfig(resource);
  const database = getPool();

  if (resource === "maintenance") {
    const assetResult = await database.query<{ asset: string }>(
      "SELECT asset FROM maintenance WHERE id = $1",
      [keyValue],
    );
    const assetId = assetResult.rows[0]?.asset;
    const result = await database.query(
      `DELETE FROM ${config.table} WHERE ${config.key} = $1 RETURNING ${config.key}`,
      [keyValue],
    );
    if (result.rowCount === 1 && assetId) {
      await syncAssetStatusForMaintenance(database, assetId);
    }
    return result.rowCount === 1;
  }

  const result = await database.query(
    `DELETE FROM ${config.table} WHERE ${config.key} = $1 RETURNING ${config.key}`,
    [keyValue],
  );
  return result.rowCount === 1;
}

export function fieldsFor(resource: CrudResource) {
  return resourceConfig[resource].fields;
}
