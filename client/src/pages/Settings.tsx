import React, { useState } from "react";
import {
  Building2,
  Check,
  Key,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  User as UserIcon
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import { updateProfileApi } from "../services/api";
import { cn } from "../utils/cn";

export function Settings() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateProfileApi({
        name: name.trim() || undefined,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Profile & account settings"
      />
      <main className="p-6 max-w-3xl space-y-6">
        {/* Profile Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Profile Information</h2>
            </div>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Avatar and role */}
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-xl font-bold shadow-md">
                {user?.name
                  ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "U"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.name || "User"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    user?.role === "ADMIN"
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      : "bg-teal-100 text-teal-700 border border-teal-200"
                  )}>
                    {user?.role || "USER"}
                  </span>
                  <span className="text-[11px] text-slate-500">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <UserIcon className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Mail className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Building2 className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="e.g., Product Engineering"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Phone className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Profile updated successfully!
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-sm transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Security Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Security</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200 text-slate-600">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Password</p>
                  <p className="text-[11px] text-slate-500">Last changed: Unknown</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200 text-slate-600">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-[11px] text-slate-500">Add extra security to your account</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                Coming Soon
              </span>
            </div>
          </div>
        </section>

        {/* Account Info */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-900">Account Details</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "User ID", value: user?.id || "—" },
                { label: "Role", value: user?.role || "USER" },
                { label: "Status", value: user?.active ? "Active" : "Inactive" },
                { label: "Email", value: user?.email || "—" }
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50/70 border border-slate-200/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="text-xs font-semibold text-slate-900 mt-1 truncate font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
