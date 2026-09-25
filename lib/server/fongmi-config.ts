export interface FongMiSite {
  key: string;
  name: string;
  type: 1;
  api: string;
  searchable: 1;
  quickSearch: 1;
  changeable: 1;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getSubscriptionUrls(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item !== 'object' || item === null || !('url' in item)) return '';
          return typeof item.url === 'string' ? item.url.trim() : '';
        })
        .filter(isHttpUrl);
    }
  } catch {
    // A plain URL or comma-separated list is also supported by KVideo.
  }

  return trimmed.split(',').map((url) => url.trim()).filter(isHttpUrl);
}

export function convertToFongMiConfig(documents: unknown[]): { sites: FongMiSite[] } {
  const sites: FongMiSite[] = [];
  const seen = new Set<string>();

  for (const document of documents) {
    const items = Array.isArray(document)
      ? document
      : typeof document === 'object' && document !== null && 'sources' in document && Array.isArray(document.sources)
        ? document.sources
        : typeof document === 'object' && document !== null && 'list' in document && Array.isArray(document.list)
          ? document.list
          : null;

    if (items === null) throw new Error('Invalid source list');

    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const source = item as Record<string, unknown>;
      if (source.enabled === false) continue;
      if (typeof source.id !== 'string' || typeof source.name !== 'string' || typeof source.baseUrl !== 'string') continue;

      const key = source.id.trim();
      const name = source.name.trim();
      const api = source.baseUrl.trim();
      if (!key || !name || !isHttpUrl(api) || seen.has(key)) continue;

      sites.push({ key, name, type: 1, api, searchable: 1, quickSearch: 1, changeable: 1 });
      seen.add(key);
    }
  }

  if (sites.length === 0) throw new Error('No enabled video sources');
  return { sites };
}
