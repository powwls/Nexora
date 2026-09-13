"use client";

import { ChevronDown, FileSpreadsheet, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

type RecordRow = Record<string, string>;
type Props = {
  resource: "assets" | "employees" | "network-devices" | "maintenance";
  columns: { key: string; label: string }[];
  initialRows: RecordRow[];
};

const fields: Record<Props["resource"], string[]> = {
  assets: ["asset", "name", "category", "assigned", "status"],
  employees: ["id", "name", "department", "role", "email", "status"],
  "network-devices": ["id", "name", "type", "ip_address", "status"],
  maintenance: ["id", "asset", "issue", "technician", "status", "scheduled"],
};

function labelFor(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resourceLabel(resource: Props["resource"]) {
  return resource === "network-devices"
    ? "network device"
    : resource === "maintenance"
      ? "maintenance ticket"
      : resource.slice(0, -1);
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("online") || normalized.includes("available")) {
    return "bg-[#e5f8f2] text-[#168b72]";
  }
  if (normalized.includes("maintenance") || normalized.includes("scheduled") || normalized.includes("pending")) {
    return "bg-[#fff3e9] text-[#c57538]";
  }
  return "bg-[#eef0f5] text-[#68738d]";
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}

function formatDate(value: string | undefined) {
  return value ? value.slice(0, 10) : "";
}

const statusOptions: Record<Props["resource"], string[]> = {
  assets: ["Active", "Maintenance", "Available", "Retired"],
  employees: ["Active", "Inactive"],
  "network-devices": ["Online", "Offline", "Maintenance"],
  maintenance: ["Pending", "In Progress", "Completed"],
};

const categoryOptions = ["Computer", "Monitor", "Server", "Network Device", "Printer"];
const departmentOptions = ["IT", "Finance", "Operations"];
const technicianOptions = ["IT Department", "John Francis", "Maria Santos", "Ramon Garcia"];

export default function CrudTable({ resource, columns, initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [form, setForm] = useState<RecordRow>({});
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const resourceFields = fields[resource];
  const keyField = resource === "assets" ? "asset" : "id";
  const formFields = resourceFields.filter((field) => field !== keyField);

  function openForm(row?: RecordRow) {
    setEditing(row ?? null);
    setError("");
    setForm(row ? { ...row } : Object.fromEntries(formFields.map((field) => [field, ""])));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`/api/${resource}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...form, _key: editing[keyField] } : form),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const record = await response.json();
      if (response.ok) {
        setRows((current) => editing
          ? current.map((row) => row[keyField] === editing[keyField] ? record : row)
          : [...current, record]);
        setEditing(null);
        setForm({});
      } else {
        setError(record.error ?? "The record could not be saved.");
      }
    } catch (requestError) {
      setError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "The request took too long. Please try again."
        : "The server could not be reached. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: RecordRow) {
    if (!window.confirm(`Delete ${row[keyField]}?`)) return;
    const response = await fetch(`/api/${resource}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: row[keyField] }),
    });
    if (response.ok) {
      setRows((current) => current.filter((item) => item[keyField] !== row[keyField]));
    } else {
      setError("The record could not be deleted.");
    }
  }

  async function updateMaintenanceStatus(row: RecordRow, status: string) {
    const key = row[keyField];
    setStatusBusy((current) => ({ ...current, [key]: true }));
    setError("");
    try {
      const response = await fetch(`/api/${resource}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, status, _key: key }),
      });
      const record = await response.json();
      if (!response.ok) {
        setError(record.error ?? "The maintenance status could not be updated.");
        return;
      }
      setRows((current) => current.map((item) => item[keyField] === key
        ? {
            ...item,
            ...record,
            scheduled: formatDate(record.scheduled ?? item.scheduled),
            date_completed: status.toLowerCase() === "completed"
              ? new Date().toISOString().slice(0, 10)
              : "",
          }
        : item));
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setStatusBusy((current) => ({ ...current, [key]: false }));
    }
  }

  function exportExcel() {
    const header = columns
      .map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
      .join("");
    const body = rows.map((row) => `<Row>${columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(row[column.key] ?? "")}</Data></Cell>`).join("")}</Row>`).join("");
    const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Worksheet ss:Name="${escapeXml(resourceLabel(resource))}"><Table><Row>${header}</Row>${body}</Table></Worksheet>
      </Workbook>`;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexora-${resource.replaceAll("-", "_")}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe4ee] bg-white px-3 py-2.5 text-xs font-semibold text-[#5960f2] shadow-sm transition hover:border-[#5960f2] hover:bg-[#f7f7ff] focus:outline-none focus:ring-4 focus:ring-[#5960f2]/20">
          <FileSpreadsheet size={14} /> Export Excel
        </button>
        {resource !== "maintenance" && <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-[#5960f2] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_5px_14px_rgba(85,91,234,.22)] transition hover:bg-[#4e55e5] focus:outline-none focus:ring-4 focus:ring-[#5960f2]/20">
          <Plus size={14} /> Add {resourceLabel(resource)}
        </button>}
      </div>
      <div className="panel-shadow overflow-hidden rounded-xl border border-[#e4e8f1] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]" aria-label={`${resourceLabel(resource)} records`}>
            <thead className="border-b border-[#e4e8f1] bg-[#fafbfe] text-[10px] font-semibold uppercase tracking-[.12em] text-[#8992a8]">
              <tr>
                {columns.map((column) => <th className="whitespace-nowrap px-5 py-3.5" scope="col" key={column.key}>{column.label}</th>)}
                <th className="px-5 py-3.5 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f5]">{rows.map((row, index) => <tr className="text-sm text-[#68738d] transition-colors hover:bg-[#fafbff]" key={`${row[keyField] || `${resource}-row`}-${index}`}>{columns.map((column) => <td className="whitespace-nowrap px-5 py-4" key={column.key}>{column.key === "status" && resource === "maintenance" ? <div className="relative inline-block"><select aria-label={`Change status for ${row[keyField] ?? "ticket"}`} title={row[column.key]?.toLowerCase() === "completed" ? "Completed tickets are locked" : "Change status"} value={row[column.key] ?? ""} disabled={statusBusy[row[keyField]] || row[column.key]?.toLowerCase() === "completed"} onChange={(event) => void updateMaintenanceStatus(row, event.target.value)} className="h-9 appearance-none rounded-full border border-[#dfe4ee] bg-[#f8f9fc] py-1 pl-3 pr-8 text-xs font-semibold text-[#68738d] outline-none transition hover:border-[#5960f2] focus:border-[#5960f2] focus:ring-4 focus:ring-[#5960f2]/15 disabled:cursor-not-allowed disabled:opacity-60">{statusOptions.maintenance.map((status) => <option key={status} value={status}>{status}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8992a8]" /></div> : column.key === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row[column.key] ?? "")}`}>{row[column.key] ?? "-"}</span> : row[column.key] || (column.key === "date_completed" ? "-" : "-")}</td>)}<td className="px-5 py-4"><div className="flex justify-end gap-3">{resource !== "maintenance" && <button aria-label={`Edit ${row[keyField] ?? "record"}`} title="Edit record" onClick={() => openForm(row)} className="rounded-md p-1 text-[#5960f2] transition hover:bg-[#eef0ff] hover:text-[#3f46d3] focus:outline-none focus:ring-2 focus:ring-[#5960f2]/30"><Pencil size={16} /></button>}<button aria-label={`Delete ${row[keyField] ?? "record"}`} title="Delete record" onClick={() => void remove(row)} className="rounded-md p-1 text-[#d86b72] transition hover:bg-[#fff1f1] hover:text-[#b94c57] focus:outline-none focus:ring-2 focus:ring-[#d86b72]/30"><Trash2 size={16} /></button></div></td></tr>)}</tbody>
          </table>
          {rows.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-semibold text-[#101a38]">No {resourceLabel(resource)} records found</p>{resource !== "maintenance" && <p className="mt-1 text-sm text-[#8992a8]">Use the Add button above to create your first record.</p>}</div>}
        </div>
      </div>
      {editing !== null || Object.keys(form).length > 0 ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#101a38]/35 p-5"><form onSubmit={save} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-display text-xl font-semibold text-[#101a38]">{editing ? `Edit ${resourceLabel(resource)}` : `Add ${resourceLabel(resource)}`}</h3><p className="mt-1 text-sm text-[#8992a8]">{editing ? "Update the record details below." : "Enter the details for this record."}</p></div><button type="button" onClick={() => { setEditing(null); setForm({}); setError(""); }} aria-label="Close form" className="rounded-md p-1 text-[#66718a] hover:bg-[#f5f7fb]"><X size={20} /></button></div><div className="grid gap-4 sm:grid-cols-2">{formFields.map((field) => <label className="text-sm font-medium text-[#66718a]" key={field}>{labelFor(field)}{field === "status" ? <div className="relative mt-1"><select required value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="h-11 w-full appearance-none rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 pr-10 text-base font-normal text-[#101a38] outline-none transition hover:border-[#c8cfdf] focus:border-[#5960f2] focus:bg-white focus:ring-4 focus:ring-[#5960f2]/10"><option value="" disabled>Select status</option>{statusOptions[resource].map((status) => <option key={status} value={status}>{status}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a8]" /></div> : field === "category" ? <div className="relative mt-1"><select required value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="h-11 w-full appearance-none rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 pr-10 text-base font-normal text-[#101a38] outline-none transition hover:border-[#c8cfdf] focus:border-[#5960f2] focus:bg-white focus:ring-4 focus:ring-[#5960f2]/10"><option value="" disabled>Select category</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a8]" /></div> : field === "department" ? <div className="relative mt-1"><select required value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="h-11 w-full appearance-none rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 pr-10 text-base font-normal text-[#101a38] outline-none transition hover:border-[#c8cfdf] focus:border-[#5960f2] focus:bg-white focus:ring-4 focus:ring-[#5960f2]/10"><option value="" disabled>Select department</option>{departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a8]" /></div> : field === "technician" ? <div className="relative mt-1"><select required value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="h-11 w-full appearance-none rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 pr-10 text-base font-normal text-[#101a38] outline-none transition hover:border-[#c8cfdf] focus:border-[#5960f2] focus:bg-white focus:ring-4 focus:ring-[#5960f2]/10"><option value="" disabled>Select technician</option>{technicianOptions.map((technician) => <option key={technician} value={technician}>{technician}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8992a8]" /></div> : <input required value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-md border border-[#dfe4ee] px-3 py-2.5 text-base font-normal text-[#101a38] outline-none transition focus:border-[#5960f2] focus:ring-4 focus:ring-[#5960f2]/10" />}</label>)}</div>{error && <p className="mt-4 rounded-lg bg-[#fff1f1] px-3 py-2.5 text-sm text-[#c05761]">{error}</p>}<button disabled={busy} className="mt-5 w-full rounded-lg bg-[#5960f2] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#4e55e5] disabled:opacity-60">{busy ? "Saving..." : editing ? "Save changes" : "Create record"}</button></form></div> : null}
    </>
  );
}
