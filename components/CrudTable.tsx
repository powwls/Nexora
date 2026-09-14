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
  assets: ["asset", "name", "category", "deviceType", "assigned", "status"],
  employees: ["id", "name", "department", "role", "email", "status"],
  "network-devices": ["id", "name", "type", "ip_address", "mac_address", "brand", "model", "location", "status"],
  maintenance: ["id", "asset", "issue", "technician", "status", "scheduled"],
};

const statusOptions: Record<Props["resource"], string[]> = {
  assets: ["Active", "Maintenance", "Available", "Retired"],
  employees: ["Active", "Inactive"],
  "network-devices": ["Online", "Offline", "Maintenance", "Unknown"],
  maintenance: ["Pending", "In Progress", "Completed"],
};

const networkDeviceTypeOptions = ["Router", "Switch", "Firewall", "Access Point", "Other"];
const categoryOptions = ["Computer", "Network Device", "Server", "Monitor", "Printer", "Scanner", "Storage", "UPS", "Security & Surveillance", "VoIP Phone", "Other"];
const deviceTypeOptions: Record<string, string[]> = {
  Computer: ["Laptop", "Desktop", "Workstation", "Standard"],
  "Network Device": ["Switch", "Router", "Firewall", "Access Point", "Standard"],
  Server: ["Rack Server", "Tower Server", "Virtual Host", "Standard"],
  Monitor: ["LCD", "LED", "Touch Screen", "Standard"],
  Printer: ["Laser", "Inkjet", "Dot Matrix", "Multi-Function", "Standard"],
  Scanner: ["Flatbed", "Document", "Barcode", "Standard"],
  Storage: ["HDD", "SSD", "NAS", "SAN", "Standard"],
  UPS: ["Line Interactive", "Online", "Rackmount", "Standard"],
  "Security & Surveillance": ["Camera", "NVR", "DVR", "Standard"],
  "VoIP Phone": ["Desk Phone", "Conference Phone", "Wireless Handset", "Standard"],
  Other: ["Standard"],
};
const departmentOptions = ["IT", "Finance", "Operations", "Security", "Facilities"];
const technicianOptions = ["IT Department", "John Francis", "Maria Santos", "Ramon Garcia", "Aisha Cruz", "Leo Martinez"];

const optionalFields = new Set(["mac_address", "brand", "model", "location"]);

function labelFor(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resourceLabel(resource: Props["resource"]) {
  return resource === "network-devices" ? "network device" : resource === "maintenance" ? "maintenance ticket" : resource.slice(0, -1);
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("active") || normalized.includes("online") || normalized.includes("available")) return "bg-[#e5f8f2] text-[#168b72]";
  if (normalized.includes("maintenance") || normalized.includes("scheduled") || normalized.includes("pending")) return "bg-[#fff3e9] text-[#c57538]";
  return "bg-[#eef0f5] text-[#68738d]";
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}

function formatDate(value: string | undefined) {
  return value ? value.slice(0, 10) : "";
}

export default function CrudTable({ resource, columns, initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [form, setForm] = useState<RecordRow>({});
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const keyField = resource === "assets" ? "asset" : "id";
  const formFields = fields[resource].filter((field) => field !== keyField);

  function updateFormField(field: string, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (resource === "assets" && field === "category") {
        const options = deviceTypeOptions[value] ?? [];
        next.deviceType = options.includes(current.deviceType ?? "") ? current.deviceType : "";
      }
      return next;
    });
  }

  function openForm(row?: RecordRow) {
    setEditing(row ?? null);
    setError("");
    if (resource === "assets") {
      const category = row?.category ?? "";
      const options = deviceTypeOptions[category] ?? [];
      setForm({ ...Object.fromEntries(formFields.map((field) => [field, ""])), status: "Active", ...row, category, deviceType: options.includes(row?.deviceType ?? "") ? row?.deviceType ?? "" : "" });
      return;
    }
    const initialForm = Object.fromEntries(formFields.map((field) => [field, ""]));
    if (row) {
      setForm({ ...initialForm, ...row });
      return;
    }
    const defaults: RecordRow = {};
    if (resource === "employees") defaults.status = "Active";
    if (resource === "network-devices") defaults.status = "Unknown";
    if (resource === "maintenance") {
      defaults.status = "Pending";
      defaults.scheduled = new Date().toISOString().slice(0, 10);
    }
    setForm({ ...initialForm, ...defaults });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = resource === "assets" ? { ...form, deviceType: form.deviceType || "Standard" } : form;
      const response = await fetch(`/api/${resource}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, _key: editing[keyField] } : payload),
      });
      const record = await response.json();
      if (!response.ok) {
        setError(record.error ?? "The record could not be saved.");
        return;
      }
      setRows((current) => editing ? current.map((row) => row[keyField] === editing[keyField] ? record : row) : [...current, record]);
      setEditing(null);
      setForm({});
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: RecordRow) {
    if (!window.confirm(`Delete ${row[keyField]}?`)) return;
    const response = await fetch(`/api/${resource}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: row[keyField] }) });
    if (response.ok) setRows((current) => current.filter((item) => item[keyField] !== row[keyField]));
    else setError("The record could not be deleted.");
  }

  async function updateMaintenanceStatus(row: RecordRow, status: string) {
    const key = row[keyField];
    setStatusBusy((current) => ({ ...current, [key]: true }));
    try {
      const response = await fetch(`/api/${resource}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...row, status, _key: key }) });
      const record = await response.json();
      if (!response.ok) {
        setError(record.error ?? "The maintenance status could not be updated.");
        return;
      }
      setRows((current) => current.map((item) => item[keyField] === key ? { ...item, ...record, scheduled: formatDate(record.scheduled ?? item.scheduled), date_completed: status.toLowerCase() === "completed" ? new Date().toISOString().slice(0, 10) : "" } : item));
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setStatusBusy((current) => ({ ...current, [key]: false }));
    }
  }

  function exportExcel() {
    const header = columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`).join("");
    const body = rows.map((row) => `<Row>${columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(row[column.key] ?? "")}</Data></Cell>`).join("")}</Row>`).join("");
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${escapeXml(resourceLabel(resource))}"><Table><Row>${header}</Row>${body}</Table></Worksheet></Workbook>`;
    const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexora-${resource.replaceAll("-", "_")}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const closeForm = () => { setEditing(null); setForm({}); setError(""); };
  const assetDeviceOptions = form.category ? deviceTypeOptions[form.category] ?? ["Standard"] : [];

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
        <button type="button" onClick={exportExcel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#dfe4ee] bg-white px-3 py-2.5 text-xs font-semibold text-[#5960f2] shadow-sm"><FileSpreadsheet size={14} /> Export Excel</button>
        {resource !== "maintenance" && <button type="button" onClick={() => openForm()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#5960f2] px-3 py-2.5 text-xs font-semibold text-white"><Plus size={14} /> Add {resourceLabel(resource)}</button>}
      </div>
      <div className="panel-shadow overflow-hidden rounded-xl border border-[#e4e8f1] bg-white">
        <div className="divide-y divide-[#edf0f5] sm:hidden">
          {rows.map((row, index) => (
            <article className="p-4" key={`${row[keyField] || `${resource}-mobile-row`}-${index}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#101a38]">{row[keyField] || row[columns[0]?.key] || `${resourceLabel(resource)} ${index + 1}`}</p>
                  <p className="mt-1 text-[11px] text-[#8992a8]">{resourceLabel(resource)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {resource !== "maintenance" && <button aria-label={`Edit ${row[keyField] ?? "record"}`} type="button" onClick={() => openForm(row)} className="rounded-md p-1 text-[#5960f2]"><Pencil size={16} /></button>}
                  <button aria-label={`Delete ${row[keyField] ?? "record"}`} type="button" onClick={() => void remove(row)} className="rounded-md p-1 text-[#c57538]"><Trash2 size={16} /></button>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 rounded-lg bg-[#fafbfe] p-3 text-xs">
                {columns.filter((column) => column.key !== keyField).map((column) => (
                  <div className="flex items-start justify-between gap-4" key={column.key}>
                    <dt className="shrink-0 text-[#8992a8]">{column.label}</dt>
                    <dd className="min-w-0 text-right font-medium text-[#68738d]">
                      {column.key === "status" && resource === "maintenance" ? <select aria-label={`Change status for ${row[keyField] ?? "ticket"}`} value={row.status ?? ""} disabled={statusBusy[row[keyField]] || row.status?.toLowerCase() === "completed"} onChange={(event) => void updateMaintenanceStatus(row, event.target.value)} className="h-8 max-w-[150px] rounded-full border border-[#dfe4ee] bg-[#f8f9fc] px-2 text-xs font-semibold"><option>{row.status}</option>{statusOptions.maintenance.filter((status) => status !== row.status).map((status) => <option key={status}>{status}</option>)}</select> : column.key === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row[column.key] ?? "")}`}>{row[column.key] ?? "-"}</span> : <span className="break-words">{row[column.key] || "-"}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
          {rows.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-semibold text-[#101a38]">No {resourceLabel(resource)} records found</p></div>}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[760px] text-left text-[12px]" aria-label={`${resourceLabel(resource)} records`}>
            <thead className="border-b border-[#e4e8f1] bg-[#fafbfe] text-[10px] font-semibold uppercase tracking-[.12em] text-[#8992a8]"><tr>{columns.map((column) => <th className="whitespace-nowrap px-5 py-3.5" scope="col" key={column.key}>{column.label}</th>)}<th className="px-5 py-3.5 text-right" scope="col">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#edf0f5]">
              {rows.map((row, index) => <tr className="text-sm text-[#68738d]" key={`${row[keyField] || `${resource}-row`}-${index}`}>
                {columns.map((column) => <td className="whitespace-nowrap px-5 py-4" key={column.key}>{column.key === "status" && resource === "maintenance" ? <div className="relative inline-block"><select aria-label={`Change status for ${row[keyField] ?? "ticket"}`} value={row.status ?? ""} disabled={statusBusy[row[keyField]] || row.status?.toLowerCase() === "completed"} onChange={(event) => void updateMaintenanceStatus(row, event.target.value)} className="h-9 rounded-full border border-[#dfe4ee] bg-[#f8f9fc] py-1 pl-3 pr-8 text-xs font-semibold"><option>{row.status}</option>{statusOptions.maintenance.filter((status) => status !== row.status).map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" /></div> : column.key === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row[column.key] ?? "")}`}>{row[column.key] ?? "-"}</span> : row[column.key] || "-"}</td>)}
                <td className="px-5 py-4"><div className="flex justify-end gap-3">{resource !== "maintenance" && <button aria-label={`Edit ${row[keyField] ?? "record"}`} type="button" onClick={() => openForm(row)} className="rounded-md p-1 text-[#5960f2]"><Pencil size={16} /></button>}<button aria-label={`Delete ${row[keyField] ?? "record"}`} type="button" onClick={() => void remove(row)} className="rounded-md p-1 text-[#c57538]"><Trash2 size={16} /></button></div></td>
              </tr>)}
            </tbody>
          </table>
          {rows.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-semibold text-[#101a38]">No {resourceLabel(resource)} records found</p></div>}
        </div>
      </div>
      {(editing !== null || Object.keys(form).length > 0) && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101a38]/35 p-3 sm:p-5"><form onSubmit={save} className="my-auto max-h-[calc(100dvh-24px)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-40px)] sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-display text-xl font-semibold text-[#101a38]">{editing ? `Edit ${resourceLabel(resource)}` : `Add ${resourceLabel(resource)}`}</h3><p className="mt-1 text-sm text-[#8992a8]">{editing ? "Update the record details below." : "Enter the details for this record."}</p></div><button type="button" onClick={closeForm} aria-label="Close form" className="rounded-md p-1"><X size={20} /></button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {formFields.map((field) => {
              const standardOptions = field === "type" && resource === "network-devices"
                ? networkDeviceTypeOptions
                : field === "category"
                  ? categoryOptions
                  : field === "deviceType"
                    ? assetDeviceOptions
                    : field === "department"
                      ? departmentOptions
                      : field === "technician"
                        ? technicianOptions
                        : field === "status"
                          ? statusOptions[resource]
                          : [];
              const options = standardOptions.includes(form[field] ?? "") || !form[field]
                ? standardOptions
                : [...standardOptions, form[field]];
              const isSelectField = ["category", "deviceType", "type", "department", "technician", "status"].includes(field);
              const isSelect = isSelectField;
              const isDeviceType = field === "type" && resource === "network-devices";
              const required = !optionalFields.has(field);
              const placeholder = isDeviceType
                ? "Select device type"
                : field === "deviceType" && !form.category
                  ? "Select category first"
                  : field === "scheduled"
                    ? "Select date"
                    : `Enter ${labelFor(field).toLowerCase()}`;
              return <label className="text-sm font-medium text-[#66718a]" key={field}>{labelFor(field)}{!required && <span className="ml-1 text-xs font-normal text-[#9aa2b4]">(optional)</span>}<div className="relative mt-1">{isSelect ? <select required={required && (field !== "deviceType" || Boolean(form.category))} disabled={field === "deviceType" && !form.category} value={form[field] ?? ""} onChange={(event) => updateFormField(field, event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 pr-10 text-base font-normal text-[#101a38] disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>{field === "deviceType" && !form.category ? "Select category first" : isDeviceType ? "Select device type" : `Select ${labelFor(field).toLowerCase()}`}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={required} placeholder={placeholder} value={form[field] ?? ""} onChange={(event) => updateFormField(field, event.target.value)} type={field === "scheduled" ? "date" : field === "email" ? "email" : "text"} className="h-11 w-full rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-3 text-base font-normal text-[#101a38] placeholder:text-[#b5bdcc]" />}{isSelect && <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />}</div></label>;
            })}
          </div>
          {error && <p className="mt-4 text-sm font-medium text-[#c04d4d]">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="min-h-11 rounded-lg border border-[#dfe4ee] px-4 py-2 text-sm font-semibold text-[#68738d]">Cancel</button><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-[#5960f2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving..." : "Save record"}</button></div>
        </form></div>}
    </>
  );
}
