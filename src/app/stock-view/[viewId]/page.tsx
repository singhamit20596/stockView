"use client";
import { useParams } from 'next/navigation';
import { trpc } from '@/app/providers';

export default function StockViewDetailPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const viewQuery = trpc.views.getById.useQuery({ viewId });
  const analytics = trpc.views.getAnalytics.useQuery({ viewId });
  const news = trpc.views.newsForView.useQuery({ viewId });
  const view = viewQuery.data;
  if (!view) return <div className="p-8">View not found.</div>;

  const warnSector = (analytics.data?.sector || []).filter((x) => x.value > 50);
  const warnSubsector = (analytics.data?.subsector || []).filter((x) => x.value > 30);
  // individual stock >5% handled in the table below via simple highlight; for now just note rule

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{view.name} — Analytics</h1>
        <div className="text-sm text-right">
          <div>Updated: {new Date(view.updatedAt).toLocaleDateString('en-GB')}</div>
          <div>Invested: ₹{view.viewSummary.totalInvestedValue} | Current: ₹{view.viewSummary.totalCurrentValue} | PnL: ₹{view.viewSummary.totalPnl} ({view.viewSummary.totalPnlPercent}%)</div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Distribution — Sector</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Bars title="By Sector" data={analytics.data?.sector || []} />
          <Bars title="By Subsector" data={analytics.data?.subsector || []} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Market Cap Distribution</h2>
        <Bars title="By Cap" data={analytics.data?.cap || []} />
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Warnings</h2>
        {warnSector.length === 0 && warnSubsector.length === 0 ? (
          <div className="text-sm text-gray-600">No warnings configured thresholds breached.</div>
        ) : (
          <ul className="list-disc pl-6 text-sm">
            {warnSector.map((w) => (
              <li key={`sec-${w.key}`} className="text-orange-700">High sector allocation: {w.key} — {w.value}% (&gt; 50%)</li>
            ))}
            {warnSubsector.map((w) => (
              <li key={`sub-${w.key}`} className="text-orange-700">High subsector allocation: {w.key} — {w.value}% (&gt; 30%)</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Recommendations</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Consider trimming any sector &gt; 50% and redeploying into underweighted sectors (&lt; 10%).</li>
          <li>Diversify subsectors exceeding 30% by adding complementary industries.</li>
          <li>Limit individual positions to ~5% current value unless you have high conviction.</li>
          <li>Rebalance periodically to maintain target allocations.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">News</h2>
        {!news.data || news.data.disabled ? (
          <div className="text-sm text-gray-600">News disabled. Set NEWS_API_KEY in environment to enable.</div>
        ) : news.data.items.length === 0 ? (
          <div className="text-sm text-gray-600">No recent news found.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {news.data.items.map((n, idx) => (
              <li key={idx} className="truncate"><a className="underline" href={n.url} target="_blank" rel="noreferrer">{n.title}</a>{n.source ? ` — ${n.source}` : ''}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Bars({ title, data }: { title: string; data: { key: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="border rounded p-3">
      <div className="mb-2 text-sm text-gray-700">{title}</div>
      <div className="space-y-1">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <div className="w-40 truncate text-xs text-gray-600">{d.key}</div>
            <div className="flex-1 bg-gray-200 h-3 rounded">
              <div className="h-3 bg-green-600 rounded" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
            <div className="w-12 text-right text-xs">{d.value}%</div>
          </div>
        ))}
        {data.length === 0 && <div className="text-xs text-gray-500">No data</div>}
      </div>
    </div>
  );
}


