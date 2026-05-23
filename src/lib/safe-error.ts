const isDev = process.env.NODE_ENV === "development";

export function safeError(err: unknown): string {
  if (isDev) return err instanceof Error ? err.message : String(err);
  console.error("[API Error]", err instanceof Error ? err.message : String(err));
  return "Internal server error";
}
