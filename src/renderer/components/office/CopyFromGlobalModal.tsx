import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Copy, Check, Bot, Sparkles } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type { Agent } from "@shared/types/agent";
import type { Skill } from "@shared/types/skill";

interface ListItem {
  name: string;
  description: string;
}

export function CopyFromGlobalModal(): JSX.Element | null {
  const { t } = useTranslation();
  const copyModalOpen = useProjectConfigStore((s) => s.copyModalOpen);
  const copyModalType = useProjectConfigStore((s) => s.copyModalType);
  const closeCopyModal = useProjectConfigStore((s) => s.closeCopyModal);
  const copyGlobalAgent = useProjectConfigStore((s) => s.copyGlobalAgent);
  const copyGlobalSkill = useProjectConfigStore((s) => s.copyGlobalSkill);

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch global items when modal opens
  useEffect(() => {
    if (!copyModalOpen || !copyModalType) {
      setItems([]);
      setSearchQuery("");
      setCopiedName(null);
      return;
    }

    let cancelled = false;
    const fetchItems = async (): Promise<void> => {
      setLoading(true);
      try {
        if (copyModalType === "agent") {
          const agents: Agent[] = await window.electronAPI.agents.list();
          if (!cancelled) {
            setItems(
              agents
                .filter((a) => a.source === "personal")
                .map((a) => ({ name: a.name, description: a.description })),
            );
          }
        } else if (copyModalType === "skill") {
          const data: { personal: Skill[]; plugin: Skill[] } =
            await window.electronAPI.skills.list();
          if (!cancelled) {
            setItems(
              data.personal.map((s) => ({
                name: s.name,
                description: s.description,
              })),
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch global items:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [copyModalOpen, copyModalType]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(
    async (name: string) => {
      try {
        if (copyModalType === "agent") {
          await copyGlobalAgent(name);
        } else if (copyModalType === "skill") {
          await copyGlobalSkill(name);
        }
        setCopiedName(name);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => {
          setCopiedName(null);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy item:", err);
      }
    },
    [copyModalType, copyGlobalAgent, copyGlobalSkill],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeCopyModal();
    },
    [closeCopyModal],
  );

  if (!copyModalOpen || !copyModalType) return null;

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const modalTitle =
    copyModalType === "agent"
      ? t("office.copyModal.copyAgent")
      : t("office.copyModal.copySkill");

  const TypeIcon = copyModalType === "agent" ? Bot : Sparkles;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-foreground">{modalTitle}</h2>
          <button
            className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeCopyModal}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              placeholder={t("office.copyModal.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <TypeIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">{t("office.copyModal.noItems")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isCopied = copiedName === item.name;
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <TypeIcon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md flex-shrink-0 transition-colors ${
                        isCopied
                          ? "bg-green-500/10 text-green-500"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                      onClick={() => handleCopy(item.name)}
                      disabled={isCopied}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          {t("office.copyModal.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t("office.copyModal.copy")}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 pt-4">
          <button
            className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            onClick={closeCopyModal}
          >
            {t("office.copyModal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
