import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Play, Square, Loader2 } from "lucide-react";
import "@xterm/xterm/css/xterm.css";
import { useTranslation } from "../../i18n/LanguageContext";

interface TerminalPanelProps {
  onRun?: (prompt: string) => void;
  onKill?: () => void;
  isRunning?: boolean;
}

export function TerminalPanel({
  onRun,
  onKill,
  isRunning = false,
}: TerminalPanelProps): JSX.Element {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
        selectionBackground: "#264f78",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#ffffff",
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    // Add welcome message
    terminal.writeln(`\x1b[36m${t("terminal.welcome")}\x1b[0m`);
    terminal.writeln(t("terminal.welcomeHint"));
    terminal.writeln("");

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  // Listen for CLI output
  useEffect(() => {
    if (!terminalRef.current) return;

    const unsubscribe = window.electronAPI.cli.onOutput((data) => {
      const term = terminalRef.current;
      if (!term) return;

      if (data.type === "stdout" && data.data) {
        term.write(data.data);
      } else if (data.type === "stderr" && data.data) {
        term.write(`\x1b[31m${data.data}\x1b[0m`);
      } else if (data.type === "close") {
        term.writeln("");
        term.write(
          `\x1b[33m${t("terminal.processExited", { code: String(data.code ?? "") })}\x1b[0m`,
        );
      }
    });

    return unsubscribe;
  }, []);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!input.trim() || !onRun) return;
    onRun(input);
    setInput("");
  };

  const handleKill = (): void => {
    if (onKill) onKill();
  };

  return (
    <div className="flex flex-col h-full border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("terminal.title")}
        </span>
        <div className="flex-1" />
        {onRun && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("terminal.promptPlaceholder")}
              className="px-3 py-1 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isRunning}
            />
            <button
              type="submit"
              disabled={isRunning || !input.trim()}
              className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </form>
        )}
        {onKill && isRunning && (
          <button
            onClick={handleKill}
            className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
            title={t("common.stop")}
          >
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Terminal */}
      <div ref={containerRef} className="flex-1 p-2" />
    </div>
  );
}
