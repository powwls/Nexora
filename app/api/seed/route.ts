import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db";
import { Pool } from "pg";

export async function POST() {
  await ensureDatabaseSchema();
  const database = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  try {
    await database.query(`
      INSERT INTO assets (asset, name, category, "deviceType", assigned, status) VALUES
        ('IT-001', 'MacBook Pro 16', 'Computer', 'Laptop', 'John Francis', 'Active'),
        ('IT-002', 'Dell Monitor U2720Q', 'Monitor', 'Standard', 'Maria Santos', 'Active'),
        ('IT-003', 'Dell OptiPlex 7090', 'Computer', 'Desktop', 'Ramon Garcia', 'Active'),
        ('NET-003', 'Cisco Catalyst 9300', 'Network Device', 'Switch', 'IT Department', 'Active'),
        ('NET-004', 'Fortinet FG-100F', 'Network Device', 'Firewall', 'IT Department', 'Active'),
        ('SRV-004', 'Lenovo ThinkSystem', 'Server', 'Standard', 'IT Department', 'Maintenance'),
        ('STG-005', 'Synology DS224+', 'Storage', 'NAS', 'IT Department', 'Available'),
        ('OFF-006', 'PowerEdge R640', 'Server', 'Standard', 'Ramon Garcia', 'Active'),
        ('PRN-007', 'HP LaserJet Pro', 'Printer', 'Standard', 'Operations', 'Available'),
        ('AP-008', 'Ubiquiti UniFi AP', 'Network Device', 'Access Point', 'Facilities', 'Active')
      ON CONFLICT (asset) DO NOTHING;

      INSERT INTO employees (id, name, department, role, email, status) VALUES
        ('emp_001', 'John Francis', 'IT', 'System Administrator', 'john@nexora.local', 'Active'),
        ('emp_002', 'Maria Santos', 'Finance', 'Finance Manager', 'maria@nexora.local', 'Active'),
        ('emp_003', 'Ramon Garcia', 'Operations', 'Operations Lead', 'ramon@nexora.local', 'Active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO network_devices (id, name, type, ip_address, mac_address, brand, model, location, status) VALUES
        ('net_001', 'Core Switch 01', 'Switch', '192.168.1.1', '00:1B:44:11:3A:B7', 'Cisco', 'Catalyst 9300', 'Server Room', 'Online'),
        ('net_002', 'Office Router', 'Router', '192.168.1.254', '00:1B:44:11:3A:B8', 'MikroTik', 'RB4011', 'Main Office', 'Online')
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
