import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db";
import { Pool } from "pg";

export async function POST() {
  await ensureDatabaseSchema();
  const database = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  try {
    await database.query(`
      INSERT INTO assets (asset, name, category, assigned, status) VALUES
        ('IT-001', 'MacBook Pro 16', 'Computer', 'John Francis', 'Active'),
        ('IT-002', 'Dell Monitor U2720Q', 'Monitor', 'Maria Santos', 'Active'),
        ('NET-003', 'Cisco Catalyst 9300', 'Network Device', 'IT Department', 'Active'),
        ('SRV-004', 'Lenovo ThinkSystem', 'Server', 'IT Department', 'Maintenance'),
        ('OFF-005', 'PowerEdge R640', 'Server', 'Ramon Garcia', 'Active')
      ON CONFLICT (asset) DO NOTHING;

      INSERT INTO employees (id, name, department, role, email, status) VALUES
        ('emp_001', 'John Francis', 'IT', 'System Administrator', 'john@nexora.local', 'Active'),
        ('emp_002', 'Maria Santos', 'Finance', 'Finance Manager', 'maria@nexora.local', 'Active'),
        ('emp_003', 'Ramon Garcia', 'Operations', 'Operations Lead', 'ramon@nexora.local', 'Active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO network_devices (id, name, type, ip_address, status) VALUES
        ('net_001', 'Core Switch 01', 'Switch', '192.168.1.1', 'Online'),
        ('net_002', 'Office Router', 'Router', '192.168.1.254', 'Online')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO maintenance (id, asset, issue, technician, status, scheduled) VALUES
        ('mnt_001', 'SRV-004', 'Scheduled server maintenance', 'IT Department', 'Pending', CURRENT_DATE + 2),
        ('mnt_002', 'NET-003', 'Firmware update', 'IT Department', 'Pending', CURRENT_DATE + 5)
      ON CONFLICT (id) DO NOTHING;
    `);

    return NextResponse.json({ seeded: true });
  } finally {
    await database.end();
  }
}
