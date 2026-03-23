import type {
  ParsedMessage,
  TimelineItem,
  SessionHighlights,
} from "../../shared/types/session-detail";

// ─── Text sanitization utilities ─────────────────────────────────────────────

// Interruption prefixes to filter out
const INTERRUPTION_PREFIXES = [
  "The conversation was ",
  "The user would like ",
  "The user to ",
  "User rejected ",
  "User: ",
];

// Tags to strip from user messages
const COMMAND_TAGS = new Set([
  "command-name",
  "command-message",
  "command-args",
  "local-command-stdout",
  "local-command-stderr",
]);

/**
 * Check if text is an interruption message
 */
function isInterruptionText(text: string): boolean {
  const trimmed = text.trim();
  return INTERRUPTION_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Extract slash command from text if present
 */
function extractSlashCommand(text: string): { name: string; args: string } | null {
  const match = text.match(/^\/(\w+)\s*(.*)$/);
  if (match) {
    return { name: match[1], args: match[2] };
  }
  return null;
}

/**
 * Sanitize user message text by removing XML-like command tags
 */
function sanitizeMessageText(text: string): string {
  // First, render any non-command XML-like tags to readable format
  let result = text.replace(
    /<([a-zA-Z][\w-]*)(?:\s[^>]*)?>\s*([\s\S]*?)\s*<\/\1>/g,
    (_full: string, tagName: string, content: string) => {
      const tag = tagName.toLowerCase();
      // Keep command tags as-is for now
      if (COMMAND_TAGS.has(tag)) {
        return _full;
      }
      // Render other tags as labels
      const trimmed = content.trim().replace(/\n+/g, " ");
      if (!trimmed) return "";
      return `\n> ${tag}: ${trimmed}\n`;
    },
  );

  // Remove command-related XML tags
  result = result
    .replace(
      /<\/?(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)>[\s\S]*?<\/(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)>/g,
      "",
    )
    .replace(
      /<\/?(?:command-name|command-message|command-args|local-command-stdout|local-command-stderr)(?:\s[^>]*)?>/g,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}

/**
 * Converts a flat array of ParsedMessage (from IPC) into a flat array of
 * TimelineItem ready for rendering in the session detail timeline.
 *
 * Tool results that arrive inside user messages are joined back to their
 * corresponding tool_use blocks via `toolUseId`.
 */
export function buildFlatTimeline(messages: ParsedMessage[]): TimelineItem[] {
  // ── 1. Collect tool results into a lookup map ──────────────────────────
  const toolResultMap = new Map<
    string,
    {
      output?: string;
      filePath?: string;
      fileContent?: string;
      isError?: boolean;
    }
  >();

  for (const msg of messages) {
    if (msg.role === "user") {
      for (const block of msg.content) {
        if (block.type === "tool_result" && block.toolUseId) {
          toolResultMap.set(block.toolUseId, {
            output: block.output,
            filePath: block.filePath,
            fileContent: block.fileContent,
            isError: block.isError,
          });
        }
      }
    }
  }

  // ── 2. Walk messages and emit timeline items ───────────────────────────
  const items: TimelineItem[] = [];

  for (const msg of messages) {
    if (msg.isMeta) continue;

    if (msg.role === "user") {
      // Check if this user message has tool_result blocks
      // If so, it's tool output, not a user prompt
      const hasToolResult = msg.content.some((b) => b.type === "tool_result");
      if (hasToolResult) continue;

      // Collect text blocks (skip tool_result blocks)
      const textParts = msg.content
        .filter((b) => b.type === "text" && b.text?.trim())
        .map((b) => b.text!)
        .join("\n");

      if (textParts) {
        // Check for interruption text
        if (isInterruptionText(textParts)) continue;

        // Extract slash command or sanitize regular text
        const command = extractSlashCommand(textParts);
        const sanitized = command
          ? `/${command.name}${command.args ? ` ${command.args}` : ""}`
          : sanitizeMessageText(textParts);

        if (sanitized.trim()) {
          items.push({
            kind: "user",
            id: msg.id,
            text: sanitized.trim(),
            timestamp: msg.timestamp,
          });
        }
      }
    } else if (msg.role === "assistant") {
      let pendingText = "";

      for (const block of msg.content) {
        switch (block.type) {
          case "text": {
            pendingText += (pendingText ? "\n" : "") + (block.text || "");
            break;
          }
          case "thinking":
          case "redacted_thinking": {
            // Flush pending text first
            if (pendingText.trim()) {
              items.push({
                kind: "assistant",
                id: `${msg.id}-text-${items.length}`,
                text: pendingText.trim(),
                timestamp: msg.timestamp,
                model: msg.model,
              });
              pendingText = "";
            }
            items.push({
              kind: "thinking",
              id: `${msg.id}-think-${items.length}`,
              text: block.text || "",
              isRedacted: block.type === "redacted_thinking",
              timestamp: msg.timestamp,
            });
            break;
          }
          case "tool_use": {
            // Flush pending text first
            if (pendingText.trim()) {
              items.push({
                kind: "assistant",
                id: `${msg.id}-text-${items.length}`,
                text: pendingText.trim(),
                timestamp: msg.timestamp,
                model: msg.model,
              });
              pendingText = "";
            }
            // Join with tool result from user message
            const result = block.toolUseId
              ? toolResultMap.get(block.toolUseId)
              : undefined;
            items.push({
              kind: "tool",
              id: `${msg.id}-tool-${items.length}`,
              toolName: block.toolName || "unknown",
              toolUseId: block.toolUseId || "",
              input: block.input,
              output: result?.output,
              filePath: result?.filePath,
              fileContent: result?.fileContent,
              isError: result?.isError,
              timestamp: msg.timestamp,
            });
            break;
          }
        }
      }

      // Flush remaining text
      if (pendingText.trim()) {
        items.push({
          kind: "assistant",
          id: `${msg.id}-text-${items.length}`,
          text: pendingText.trim(),
          timestamp: msg.timestamp,
          model: msg.model,
        });
      }
    }
  }

  return items;
}

/**
 * Computes summary highlights from a built timeline.
 */
export function computeHighlights(items: TimelineItem[]): SessionHighlights {
  let toolCalls = 0;
  let toolResults = 0;
  let failureCount = 0;
  const touchedFilesSet = new Set<string>();

  for (const item of items) {
    if (item.kind === "tool") {
      toolCalls++;
      if (item.output !== undefined) toolResults++;
      if (item.isError) failureCount++;
      if (item.filePath) touchedFilesSet.add(item.filePath);
    }
  }

  return {
    toolCalls,
    toolResults,
    failureCount,
    touchedFiles: Array.from(touchedFilesSet),
  };
}
