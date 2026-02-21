import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, Wrench, Puzzle, Command } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";

interface SearchResult {
  id: string;
  type: "agent" | "skill" | "plugin" | "command";
  name: string;
  description?: string;
  path: string;
}

export function SearchCommand(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!window.electronAPI) return;
    setLoading(true);
    const q = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    try {
      // Search agents
      const agents = await window.electronAPI.agents.list();
      agents
        .filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q),
        )
        .forEach((a) => {
          searchResults.push({
            id: `agent-${a.name}`,
            type: "agent",
            name: a.name,
            description: a.description,
            path: `/agents/${a.name}`,
          });
        });

      // Search skills
      const skills = await window.electronAPI.skills.list();
      skills.personal
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q),
        )
        .forEach((s) => {
          searchResults.push({
            id: `skill-personal-${s.name}`,
            type: "skill",
            name: s.name,
            description: s.description,
            path: `/skills/personal/${s.name}`,
          });
        });
      skills.plugin
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q),
        )
        .forEach((s) => {
          searchResults.push({
            id: `skill-plugin-${s.name}`,
            type: "skill",
            name: s.name,
            description: s.description,
            path: `/skills/plugin/${s.name}`,
          });
        });

      // Search plugins
      const plugins = await window.electronAPI.plugins.list();
      plugins
        .filter((p) => p.name.toLowerCase().includes(q))
        .forEach((p) => {
          searchResults.push({
            id: `plugin-${p.id}`,
            type: "plugin",
            name: p.name,
            path: `/plugins/${p.id}`,
          });
        });

      // Search commands
      const commands = await window.electronAPI.commands.list();
      commands
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q),
        )
        .forEach((c) => {
          searchResults.push({
            id: `command-${c.pluginId}-${c.name}`,
            type: "command",
            name: c.name,
            description: c.description,
            path: `/commands/${c.pluginId}/${c.name}`,
          });
        });

      setResults(searchResults.slice(0, 10));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (result: SearchResult): void => {
    setIsOpen(false);
    setQuery("");
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "agent":
        return <Wrench className="w-4 h-4" />;
      case "skill":
        return <FileText className="w-4 h-4" />;
      case "plugin":
        return <Puzzle className="w-4 h-4" />;
      case "command":
        return <Command className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "agent":
        return t("search.type.agent");
      case "skill":
        return t("search.type.skill");
      case "plugin":
        return t("search.type.plugin");
      case "command":
        return t("search.type.command");
    }
  };

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent text-lg outline-none placeholder-zinc-400"
                autoFocus
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-zinc-400">
                  {t("search.searching")}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-400">
                  {query ? t("search.noResults") : t("search.typeToSearch")}
                </div>
              ) : (
                <ul className="py-2">
                  {results.map((result, index) => (
                    <li key={result.id}>
                      <button
                        onClick={() => handleSelect(result)}
                        className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          index === selectedIndex
                            ? "bg-zinc-100 dark:bg-zinc-800"
                            : ""
                        }`}
                      >
                        <span className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {getIcon(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {result.name}
                          </div>
                          {result.description && (
                            <div className="text-sm text-zinc-500 truncate">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {getTypeLabel(result.type)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                  ↑↓
                </kbd>
                {t("search.navigate")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                  ↵
                </kbd>
                {t("search.select")}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                  esc
                </kbd>
                {t("search.close")}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
