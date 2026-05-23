export function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[API Error]", msg);
  return `Internal server error: ${msg}`;
}
