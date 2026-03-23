import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, AlertCircle, MessageSquareOff } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { buildFlatTimeline, computeHighlights } from "../../utils/buildTimeline";
import { SessionHeader } from "./SessionHeader";
import { SessionHighlightsBar } from "./SessionHighlights";
import { TimelineItemRow } from "./TimelineItem";
import { ScrollToBottom } from "./ScrollToBottom";
import type { ParsedSession, SessionHighlights } from "../../../shared/types/session-detail";
import type { TimelineItem } from "../../../shared/types/session-detail";

interface SessionDetailViewProps {
  projectDir: string;
  sessionId: string;
  onBack?: () => void;
}

export function SessionDetailView({
  projectDir,
  sessionId,
  onBack,
}: SessionDetailViewProps): JSX.Element {
  const { t } = useTranslation();
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [highlights, setHighlights] = useState<SessionHighlights>({
    toolCalls: 0,
    toolResults: 0,
    failureCount: 0,
    touchedFiles: [],
  });
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch session data ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await window.electronAPI.session.getDetail(
          projectDir,
          sessionId,
        );
        if (cancelled) return;
        setSession(data);
        const items = buildFlatTimeline(data.messages);
        setTimeline(items);
        setHighlights(computeHighlights(items));
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load session detail:", err);
          setError(
            err instanceof Error ? err.message : t("sessionDetail.error"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectDir, sessionId, t]);

  // ── Scroll to bottom detection ──────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollToBottom(!atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col">
        {/* Skeleton header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t("sessionDetail.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col">
        {onBack && (
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shrink-0">
            <button
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              onClick={onBack}
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("sessionDetail.backToProject")}
              </span>
            </button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-sm">{t("sessionDetail.error")}</span>
            <span className="text-xs text-zinc-500">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────
  if (!session || timeline.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col">
        {session && (
          <SessionHeader
            projectPath={session.projectPath}
            sessionId={session.sessionId}
            stats={session.stats}
            messageCount={session.messages.length}
            onBack={onBack}
          />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <MessageSquareOff className="w-8 h-8" />
            <span className="text-sm">{t("sessionDetail.noMessages")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 flex flex-col">
      <SessionHeader
        projectPath={session.projectPath}
        sessionId={session.sessionId}
        stats={session.stats}
        messageCount={session.messages.length}
        onBack={onBack}
      />

      <SessionHighlightsBar highlights={highlights} />

      {/* Timeline scroll container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto"
          onScroll={handleScroll}
        >
          <div className="px-4 py-3 space-y-2">
            {timeline.map((item) => (
              <TimelineItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        <ScrollToBottom visible={showScrollToBottom} onClick={scrollToBottom} />
      </div>
    </div>
  );
}
