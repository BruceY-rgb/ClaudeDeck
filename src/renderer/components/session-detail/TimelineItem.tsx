import { memo } from "react";
import type { TimelineItem as TimelineItemType } from "../../../shared/types/session-detail";
import { UserBubble } from "./UserBubble";
import { AssistantText } from "./AssistantText";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolItem } from "./ToolItem";

interface TimelineItemRowProps {
  item: TimelineItemType;
}

export const TimelineItemRow = memo(function TimelineItemRow({
  item,
}: TimelineItemRowProps): JSX.Element | null {
  switch (item.kind) {
    case "user":
      return <UserBubble item={item} />;
    case "assistant":
      return <AssistantText item={item} />;
    case "thinking":
      return <ThinkingBlock item={item} />;
    case "tool":
      return <ToolItem item={item} />;
    default:
      return null;
  }
});
