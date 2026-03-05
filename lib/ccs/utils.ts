import { Verdict } from "@/lib/generated/prisma/client";

export function toCCSVerdict(verdict: Verdict): string | null {
  switch (verdict) {
    case "ACCEPTED":
      return "AC";
    case "WRONG_ANSWER":
      return "WA";
    case "TIME_LIMIT_EXCEEDED":
      return "TLE";
    case "MEMORY_LIMIT_EXCEEDED":
      return "MLE";
    case "RUNTIME_ERROR":
      return "RTE";
    case "COMPILE_ERROR":
      return "CE";
    case "PRESENTATION_ERROR":
      return "PE";
    case "SYSTEM_ERROR":
      return "SE";
    case "PENDING":
    case "JUDGING":
      return null;
    default:
      return null;
  }
}

export function toISO8601(date: Date): string {
  // CCS expects ISO 8601 format
  return date.toISOString();
}

export function getRelativeTime(startTime: Date, eventTime: Date): string {
  const diff = eventTime.getTime() - startTime.getTime();
  // Ensure non-negative relative time for events before start? usually 0 or negative allowed.
  // But spec says "relative time of the run submission"
  // Format: [-]H:MM:SS.mmm

  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? "-" : "";

  const seconds = Math.floor(absDiff / 1000);
  const ms = absDiff % 1000;

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${sign}${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export function formatDurationFromMinutes(
  minutes: number | undefined | null,
): string | null {
  if (!minutes || minutes <= 0) {
    return null;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = 0;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.000`;
}
