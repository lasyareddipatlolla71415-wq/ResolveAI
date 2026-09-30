import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-lg p-2 text-xs font-medium transition-all ${
        resolvedTheme === "dark"
          ? "bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700 shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-300 shadow-sm"
      } ${className}`}
      title={`Current: ${resolvedTheme} mode. Click to switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode.`}
      aria-label="Toggle color theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 animate-spin-slow text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      )}
      {showLabel && (
        <span className="capitalize">{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}

export function ThemeSegmentedToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor }
  ];

  return (
    <div
      className={`inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
