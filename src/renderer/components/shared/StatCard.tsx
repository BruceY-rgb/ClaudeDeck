import type { LucideIcon } from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  color?: "blue" | "green" | "amber" | "red" | "violet" | "emerald";
}

export function StatCard({
  icon: Icon,
  title,
  value,
  description,
  color = "blue",
}: StatCardProps): JSX.Element {
  const iconBg = colorMap[color] ?? colorMap.blue;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {title}
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {value}
          </p>
          {description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
