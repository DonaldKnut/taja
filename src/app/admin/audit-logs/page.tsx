"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, RefreshCcw, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface AuditRow {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  method?: string;
  route?: string;
  ip?: string;
  success?: boolean;
  createdAt: string;
  actorRole?: string;
  actorUserId?: {
    _id: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
}

const ENTITY_TYPES = ["", "product", "shop", "order", "file", "product_video"];

export default function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [success, setSuccess] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "30");
    if (action.trim()) params.set("action", action.trim());
    if (entityType) params.set("entityType", entityType);
    if (success) params.set("success", success);
    return params.toString();
  }, [page, action, entityType, success]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api(`/api/admin/audit-logs?${query}`);
      if (res?.success) {
        setRows(Array.isArray(res.data?.logs) ? res.data.logs : []);
        setPages(Number(res.data?.pagination?.pages || 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Legal Trail</p>
            <h1 className="text-3xl font-black text-slate-900">Audit Logs</h1>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-xl h-11 text-[10px] font-black uppercase tracking-widest"
          onClick={fetchLogs}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={action}
          onChange={(e) => {
            setPage(1);
            setAction(e.target.value);
          }}
          placeholder="Filter action (e.g. product.update)"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
        />
        <select
          value={entityType}
          onChange={(e) => {
            setPage(1);
            setEntityType(e.target.value);
          }}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t || "all"} value={t}>
              {t || "All entity types"}
            </option>
          ))}
        </select>
        <select
          value={success}
          onChange={(e) => {
            setPage(1);
            setSuccess(e.target.value);
          }}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
        >
          <option value="">All outcomes</option>
          <option value="true">Success only</option>
          <option value="false">Failed only</option>
        </select>
        <div className="h-11 rounded-xl border border-slate-200 px-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <CalendarDays className="h-4 w-4" />
          Newest first
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full min-w-[960px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">When</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Actor</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Entity</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Route</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">IP</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Result</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No logs found for current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-bold text-slate-900">{row.actorUserId?.fullName || "System"}</p>
                    <p className="text-slate-500">{row.actorUserId?.email || row.actorRole || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-black text-slate-900">{row.action}</td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-bold text-slate-900">{row.entityType}</p>
                    <p className="text-slate-500 truncate max-w-[220px]">{row.entityId || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(row.method || "-") + " " + (row.route || "-")}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.ip || "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full font-black uppercase tracking-widest text-[9px] ${
                        row.success === false
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.success === false ? "Failed" : "Success"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Page {page} of {pages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

