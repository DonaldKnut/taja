"use client";

import { useState, useEffect } from "react";
import { Search, Ban, CheckCircle, XCircle, MoreVertical, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  kycStatus: string;
  kycSubmittedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (roleFilter) {
        params.append("role", roleFilter);
      }
      if (statusFilter) {
        params.append("accountStatus", statusFilter);
      }

      const response = await api(`/api/admin/users?${params.toString()}`);
      if (response?.success) {
        setUsers(response.data.users || []);
        const pagination = response.data.pagination;
        setTotal(pagination?.total ?? 0);
        setTotalPages(pagination?.totalPages ?? 1);
      } else {
        setUsers([]);
        setTotal(0);
        setTotalPages(1);
        setFetchError(response?.message || "Failed to fetch users");
        toast.error(response?.message || "Failed to fetch users");
      }
    } catch (error: any) {
      console.error("Fetch users error:", error);
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      setFetchError("Failed to load users. Ensure MongoDB is running and MONGODB_URI is set in .env.");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleUserAction = async (userId: string, action: "ban" | "suspend" | "activate") => {
    if (action === "ban" && !confirm("Are you sure you want to ban this user?")) {
      return;
    }
    if (action === "suspend" && !confirm("Are you sure you want to suspend this user?")) {
      return;
    }

    try {
      setSubmitting(userId);
      const response = await api(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });

      if (response?.success) {
        toast.success(`User ${action === "ban" ? "banned" : action === "suspend" ? "suspended" : "activated"} successfully`);
        await fetchUsers();
        if (selectedUser?._id === userId) {
          setSelectedUser(null);
        }
      } else {
        toast.error(response?.message || `Failed to ${action} user`);
      }
    } catch (error: any) {
      console.error("User action error:", error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "buyer" | "seller") => {
    try {
      setSubmitting(userId);
      const response = await api(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (response?.success) {
        toast.success(`Role set to ${newRole}`);
        await fetchUsers();
      } else {
        toast.error(response?.message || "Failed to update role");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update role");
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20",
      suspended: "bg-amber-400/10 text-amber-600 border border-amber-400/20",
      banned: "bg-rose-400/10 text-rose-600 border border-rose-400/20",
      under_review: "bg-indigo-400/10 text-indigo-600 border border-indigo-400/20",
    };
    return badges[status as keyof typeof badges] || "bg-slate-100 text-slate-600";
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      buyer: "text-blue-600 font-black",
      seller: "text-purple-600 font-black",
      admin: "text-rose-600 font-black underline decoration-2 underline-offset-4",
    };
    return badges[role as keyof typeof badges] || "text-slate-400";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-10 p-1">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
            <Users className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Manage Community</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Member Directory</h1>
          </div>
        </div>
      </div>

      <Card className="mb-10 rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-1">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-16 pl-14 pr-6 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-0 border-t md:border-t-0 md:border-l border-slate-100">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-16 px-8 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors"
              >
                <option value="">All Roles</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-16 px-8 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors border-l border-slate-100"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
                <option value="under_review">Under Review</option>
              </select>
              <button type="submit" className="h-16 px-8 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all">
                Search
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-100 rounded-[2.5rem] shadow-huge overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-10 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Unified Directory</CardTitle>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} users
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Per page
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </label>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Community</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading users...</div>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-rose-600 font-bold text-center">{fetchError}</p>
              <p className="text-sm text-slate-500 mt-2 text-center">If you expect more users, ensure MongoDB is running and MONGODB_URI is set in .env or .env.local.</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="py-5 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Member Identity
                      </th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Engagement
                      </th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Citizenship
                      </th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Trust Level
                      </th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Onboarded
                      </th>
                      <th className="py-5 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Authority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="py-5 px-10">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center text-emerald-400 font-black text-sm group-hover:scale-110 transition-transform">
                              {user.fullName[0]}
                            </div>
                            <div>
                              <div className="text-base font-black text-slate-900 tracking-tight">
                                {user.fullName}
                              </div>
                              <div className="text-xs font-bold text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          {user.role === "admin" ? (
                            <span className={`text-[10px] uppercase tracking-widest ${getRoleBadge(user.role)}`}>
                              {user.role}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => {
                                const v = e.target.value as "buyer" | "seller";
                                if (v !== user.role) handleRoleChange(user._id, v);
                              }}
                              disabled={submitting === user._id}
                              className="text-[10px] font-black uppercase tracking-widest bg-transparent border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="buyer">Buyer</option>
                              <option value="seller">Seller</option>
                            </select>
                          )}
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span
                            className={`inline-flex px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusBadge(
                              user.accountStatus
                            )}`}
                          >
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span
                            className={`inline-flex px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full ${user.kycStatus === "approved"
                              ? "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20"
                              : user.kycStatus === "pending"
                                ? "bg-amber-400/10 text-amber-600 border border-amber-400/20"
                                : user.kycStatus === "rejected"
                                  ? "bg-rose-400/10 text-rose-600 border border-rose-400/20"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                          >
                            {user.kycStatus || "Not Enrolled"}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <p className="text-sm font-black text-slate-900">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined On</p>
                        </td>
                        <td className="py-5 px-10">
                          <div className="flex items-center justify-end gap-3">
                            {user.accountStatus === "active" ? (
                              <>
                                <button
                                  onClick={() => handleUserAction(user._id, "suspend")}
                                  disabled={submitting === user._id}
                                  className="h-9 px-5 rounded-xl border border-amber-100 text-amber-600 hover:bg-amber-50 font-black uppercase tracking-widest text-[9px] transition-all"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => handleUserAction(user._id, "ban")}
                                  disabled={submitting === user._id}
                                  className="h-9 px-5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-[9px] flex items-center gap-2 transition-all"
                                >
                                  <Ban className="h-3 w-3" />
                                  Ban
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user._id, "activate")}
                                disabled={submitting === user._id}
                                className="h-10 px-6 rounded-xl bg-slate-950 text-white hover:bg-emerald-600 font-black uppercase tracking-widest text-[9px] flex items-center gap-2 transition-all shadow-huge"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-10 py-8 border-t border-slate-100 bg-slate-50/20">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page {page} <span className="text-slate-200 mx-2">/</span> {totalPages}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-11 px-8 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}







