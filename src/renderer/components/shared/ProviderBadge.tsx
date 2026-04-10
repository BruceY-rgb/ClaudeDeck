import type { ProviderId } from "@shared/types/provider";
import { ProviderGlyph, getProviderAccent, getProviderLabel } from "../../utils/branding";

export function ProviderBadge({
  providerId,
  compact = false,
}: {
  providerId: ProviderId;
  compact?: boolean;
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-gradient-to-r px-2.5 py-1.5 text-xs font-medium shadow-sm ${getProviderAccent(providerId)}`}
    >
      <ProviderGlyph providerId={providerId} className="h-5 w-5 shrink-0" />
      {!compact && <span>{getProviderLabel(providerId)}</span>}
    </span>
  );
}
