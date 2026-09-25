import { convertToFongMiConfig, getSubscriptionUrls } from '@/lib/server/fongmi-config';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const subscriptionSources = process.env.SUBSCRIPTION_SOURCES || process.env.NEXT_PUBLIC_SUBSCRIPTION_SOURCES || '';
  const urls = getSubscriptionUrls(subscriptionSources);

  if (urls.length === 0) {
    return Response.json({ error: 'No subscription configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const documents = await Promise.all(urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Subscription fetch failed: ${response.status}`);
      return response.json() as Promise<unknown>;
    }));

    return Response.json(convertToFongMiConfig(documents), {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
    });
  } catch {
    return Response.json({ error: 'Unable to load video sources' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
