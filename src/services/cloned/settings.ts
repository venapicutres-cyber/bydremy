export function decodeSettings(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(
      raw
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'),
    );
  } catch {
    return {};
  }
}
