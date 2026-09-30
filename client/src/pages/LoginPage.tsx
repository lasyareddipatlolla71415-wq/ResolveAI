import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  User as UserIcon,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  Zap,
  Cpu,
  Sparkles,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import robotMascot from "../assets/robot-mascot.jpg";

type RoleType = "staff" | "user" | "admin";

const demoCredentials: Record<RoleType, { email: string; pass: string }> = {
  staff: { email: "staff@resolveai.com", pass: "staff123" },
  user: { email: "user@resolveai.com", pass: "user123" },
  admin: { email: "admin@resolveai.com", pass: "admin123" }
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<RoleType>("staff");
  const [email, setEmail] = useState(demoCredentials.staff.email);
  const [password, setPassword] = useState(demoCredentials.staff.pass);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleTabSwitch = (newRole: RoleType) => {
    setActiveTab(newRole);
    setEmail(demoCredentials[newRole].email);
    setPassword(demoCredentials[newRole].pass);
    setErrorMessage(null);
  };

  const redirectAfterLogin = (userRole: string) => {
    if (userRole === "ADMIN") {
      navigate("/admin");
    } else if (userRole === "STAFF" || userRole === "TECHNICIAN") {
      navigate("/technician");
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const loggedUser = await login({ email, password });
      redirectAfterLogin(loggedUser.role);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          "Invalid login credentials. Please check your email and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const roleDetails = {
    staff: {
      title: "Staff / Technician Login",
      description: "Access AI-assisted diagnostics, RAG procedures, and ticket resolution.",
      btnText: "Sign in as Staff Technician",
      icon: <Wrench className="w-4 h-4 text-blue-600" />
    },
    user: {
      title: "Employee / User Portal Login",
      description: "Access self-service AI troubleshooting, incident logging, and ticket status.",
      btnText: "Sign in as Employee User",
      icon: <UserIcon className="w-4 h-4 text-blue-600" />
    },
    admin: {
      title: "System Administrator Login",
      description: "Access technician triage, telemetry, incident supervision, and knowledge base.",
      btnText: "Sign in as Administrator",
      icon: <Shield className="w-4 h-4 text-blue-600" />
    }
  }[activeTab];

  return (
    <div className="min-h-screen w-full bg-[#f6f9fe] text-slate-900 relative overflow-hidden flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
      {/* Background Soft Dot Grid & Radial Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft background blue ambient glow */}
        <div className="absolute -top-32 -left-20 w-[600px] h-[600px] bg-blue-100/70 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-blue-50/90 rounded-full blur-[130px]" />

        {/* Dot Matrix Grid Accents */}
        <svg
          className="absolute top-24 right-1/4 w-40 h-40 opacity-30 text-blue-400"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          {[0, 20, 40, 60, 80].map((x) =>
            [0, 20, 40, 60, 80].map((y) => (
              <circle key={`${x}-${y}`} cx={x + 10} cy={y + 10} r="2.5" />
            ))
          )}
        </svg>

        <svg
          className="absolute bottom-28 right-6 w-32 h-48 opacity-25 text-blue-400"
          fill="currentColor"
          viewBox="0 0 80 120"
        >
          {[0, 20, 40, 60].map((x) =>
            [0, 20, 40, 60, 80, 100].map((y) => (
              <circle key={`r-${x}-${y}`} cx={x + 10} cy={y + 10} r="2.5" />
            ))
          )}
        </svg>

        <svg
          className="absolute bottom-12 left-1/2 w-48 h-24 opacity-25 text-blue-400"
          fill="currentColor"
          viewBox="0 0 120 60"
        >
          {[0, 20, 40, 60, 80, 100].map((x) =>
            [0, 20, 40].map((y) => (
              <circle key={`b-${x}-${y}`} cx={x + 10} cy={y + 10} r="2.5" />
            ))
          )}
        </svg>

        {/* Decorative Tropical Leaves at bottom corners matching reference */}
        {/* Bottom Left Foliage */}
        <svg
          className="absolute -bottom-10 -left-12 w-64 h-64 text-emerald-700/80 drop-shadow-xl transform -rotate-12 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M-20,200 C30,120 90,90 170,80 C110,130 80,180 50,220 Z"
            fill="url(#leafGrad1)"
          />
          <path
            d="M-40,160 C20,90 80,50 150,20 C110,80 80,130 20,180 Z"
            fill="url(#leafGrad2)"
          />
          <path
            d="M-10,220 C60,160 120,130 190,120 C140,170 100,210 60,230 Z"
            fill="url(#leafGrad1)"
            opacity="0.85"
          />
          <defs>
            <linearGradient id="leafGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
            <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Right Foliage */}
        <svg
          className="absolute -bottom-12 -right-12 w-64 h-64 text-emerald-700/80 drop-shadow-xl transform rotate-12 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M220,200 C170,120 110,90 30,80 C90,130 120,180 150,220 Z"
            fill="url(#leafGrad1)"
          />
          <path
            d="M240,160 C180,90 120,50 50,20 C90,80 120,130 180,180 Z"
            fill="url(#leafGrad2)"
          />
        </svg>
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/25">
            RA
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              Resolve<span className="text-blue-600">AI</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              AI-Powered IT Incident Resolution
            </p>
          </div>
        </div>

        {/* Platform Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          Platform Online
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Product Value Narrative & 3D Robot Mascot */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-0.5 bg-blue-600 rounded-full" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Intelligent IT Support
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.1]">
            Resolve IT issues.
            <br />
            Faster. <span className="text-blue-600">with AI.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            AI-powered diagnosis, RAG knowledge, and automated ticket resolution — all in one workspace.
          </p>

          {/* 3 Feature Pills Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-xl">
            {/* Feature 1 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">AI Diagnosis</h4>
                <p className="text-[11px] text-slate-500 truncate">Understand issues faster</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">RAG Knowledge</h4>
                <p className="text-[11px] text-slate-500 truncate">Trusted solutions</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200/70 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Auto Ticketing</h4>
                <p className="text-[11px] text-slate-500 truncate">Escalate when needed</p>
              </div>
            </div>
          </div>

          {/* 3D Mascot Illustration on Holographic Base */}
          <div className="relative mt-4 flex justify-center sm:justify-start">
            <div className="relative w-full max-w-[480px]">
              <img
                src={robotMascot}
                alt="ResolveAI Intelligent Robot Assistant"
                className="w-full h-auto object-contain rounded-2xl mix-blend-multiply drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Transparent Sign-in Form */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[460px] bg-transparent relative">
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
                Sign in to your ResolveAI workspace
              </p>
            </div>

            {/* 3 Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => handleTabSwitch("staff")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === "staff"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Staff / Tech</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("user")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === "user"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>User</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("admin")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === "admin"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Active Role Title & Description */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {roleDetails.icon}
                <span>{roleDetails.title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{roleDetails.description}</p>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={demoCredentials[activeTab].email}
                    className="w-full bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign in Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>{roleDetails.btnText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Card Footer Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Secure
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                Reliable
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle bottom spacing */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400">
        ResolveAI &copy; {new Date().getFullYear()} &bull; Adaptive Enterprise Incident Resolution
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Workspace Sign-in Help</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              ResolveAI operates unified single sign-on (SSO). For this interactive preview, you can
              sign in directly using the <strong>Quick Access</strong> demo logins:
            </p>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 mb-5">
              <p>
                • Staff: <span className="font-semibold text-blue-600">staff@resolveai.com</span> (pw: staff123)
              </p>
              <p>
                • User: <span className="font-semibold text-emerald-600">user@resolveai.com</span> (pw: user123)
              </p>
              <p>
                • Admin: <span className="font-semibold text-amber-600">admin@resolveai.com</span> (pw: admin123)
              </p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
