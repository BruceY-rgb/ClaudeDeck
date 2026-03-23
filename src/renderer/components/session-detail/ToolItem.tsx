import { useState } from "react";
import {
  FileText,
  FilePen,
  FilePlus,
  Terminal as TerminalIcon,
  Search,
  FileSearch,
  ListTodo,
  Globe,
  Wrench,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import type { TimelineToolItem } from "../../../shared/types/session-detail";
import type { LucideIcon } from "lucide-react";

interface ToolItemProps {
  item: TimelineToolItem;
}

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  Read: FileText,
  cat: FileText,
  Edit: FilePen,
  sed: FilePen,
  Write: FilePlus,
  Bash: TerminalIcon,
  Terminal: TerminalIcon,
  Glob: Search,
  find: Search,
  Grep: FileSearch,
  Task: ListTodo,
  WebFetch: Globe,
  WebSearch: Globe,
};

function getToolIcon(name: string): LucideIcon {
  return TOOL_ICON_MAP[name] ?? Wrench;
}

const MAX_PREVIEW_LINES = 500;

function truncateText(text: string, maxLines: number): { text: string; truncated: boolean } {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return { text, truncated: false };
  return { text: lines.slice(0, maxLines).join("\n"), truncated: true };
}

function formatInput(input: Record<string, unknown> | undefined): string {
  if (!input) return "";
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

export function ToolItem({ item }: ToolItemProps): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const Icon = getToolIcon(item.toolName);
  const hasError = item.isError === true;
  const hasOutput = item.output !== undefined && item.output !== "";
  const hasInput = item.input !== undefined && Object.keys(item.input).length > 0;

  return (
    <div className="mx-4 py-1">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* Collapsed header row */}
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          )}
          <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {item.toolName}
          </span>
          {item.filePath && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-mono ml-1">
              {item.filePath.split("/").pop()}
            </span>
          )}
          <span className="ml-auto shrink-0">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                hasError
                  ? "bg-red-500"
                  : hasOutput
                    ? "bg-green-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          </span>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-zinc-200 dark:border-zinc-800 mt-0 pt-2">
            {/* File path */}
            {item.filePath && (
              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate">
                {item.filePath}
              </div>
            )}

            {/* Input */}
            {hasInput && (
              <div>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  {t("sessionDetail.input")}
                </p>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-zinc-100 dark:bg-zinc-800 rounded-md p-2 max-h-[300px] overflow-auto text-zinc-600 dark:text-zinc-400">
                  {(() => {
                    const formatted = formatInput(item.input);
                    const { text } = truncateText(formatted, MAX_PREVIEW_LINES);
                    return text;
                  })()}
                </pre>
              </div>
            )}

            {/* Output */}
            {hasOutput && (
              <div>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                  {t("sessionDetail.output")}
                </p>
                <pre
                  className={`text-xs font-mono whitespace-pre-wrap break-all rounded-md p-2 max-h-[300px] overflow-auto ${
                    hasError
                      ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {(() => {
                    const { text, truncated } = truncateText(
                      item.output ?? "",
                      MAX_PREVIEW_LINES,
                    );
                    return truncated ? text + "\n\n... (truncated)" : text;
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
