import type { JSX } from "react";
import {
  Bot,
  Boxes,
  Command,
  Gauge,
  PlugZap,
  TerminalSquare,
  Wrench,
} from "lucide-react";
import type { ProviderId } from "@shared/types/provider";
import claudeLight from "../assets/providers/claude.png";
import claudeDark from "../assets/providers/claude-dark.png";
import codexLight from "../assets/providers/codex.png";
import codexDark from "../assets/providers/codex-dark.png";
import geminiLight from "../assets/providers/gemini.png";
import geminiDark from "../assets/providers/gemini-dark.png";

export function getProviderAccent(providerId: ProviderId): string {
  switch (providerId) {
    case "codex":
      return "from-sky-500/20 to-cyan-500/10 text-sky-700 dark:text-sky-300"
    case "gemini":
      return "from-amber-500/20 to-orange-500/10 text-amber-700 dark:text-amber-300"
    default:
      return "from-violet-500/20 to-fuchsia-500/10 text-violet-700 dark:text-violet-300"
  }
}

export function getProviderLabel(providerId: ProviderId): string {
  switch (providerId) {
    case "codex":
      return "Codex"
    case "gemini":
      return "Gemini CLI"
    default:
      return "Claude Code"
  }
}

function getProviderImage(providerId: ProviderId): { light: string; dark: string } {
  switch (providerId) {
    case "codex":
      return { light: codexLight, dark: codexDark };
    case "gemini":
      return { light: geminiLight, dark: geminiDark };
    default:
      return { light: claudeLight, dark: claudeDark };
  }
}

export function ProviderGlyph({ providerId, className = "w-4 h-4" }: { providerId: ProviderId; className?: string }): JSX.Element {
  const { light, dark } = getProviderImage(providerId);

  return (
    <span className={`relative inline-flex overflow-hidden rounded-[0.85rem] ${className}`}>
      <img src={light} alt={getProviderLabel(providerId)} className="h-full w-full object-cover dark:hidden" />
      <img src={dark} alt={getProviderLabel(providerId)} className="hidden h-full w-full object-cover dark:block" />
    </span>
  );
}

export function getSkillIcon(name?: string, category?: string) {
  const token = `${category || ""} ${name || ""}`.toLowerCase()
  if (token.includes("doc")) return Boxes
  if (token.includes("pdf")) return Gauge
  if (token.includes("sheet") || token.includes("spreadsheet")) return Command
  if (token.includes("review")) return Wrench
  if (token.includes("agent")) return Bot
  if (token.includes("plugin")) return PlugZap
  return TerminalSquare
}
