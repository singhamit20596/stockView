"use client";
import { useParams } from 'next/navigation';
import { trpc } from '@/app/providers';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/ui/BarChart';
import { PieChart } from '@/components/ui/PieChart';

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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{view.name}</h1>
          <p className="text-sm text-zinc-600 mt-1">Analytics Dashboard</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-600">Updated: {new Date(view.updatedAt).toLocaleDateString('en-GB')}</div>
          <div className="text-sm font-medium text-zinc-900 mt-1">
            Invested: ₹{view.viewSummary.totalInvestedValue} | Current: ₹{view.viewSummary.totalCurrentValue} | PnL: ₹{view.viewSummary.totalPnl} ({view.viewSummary.totalPnlPercent}%)
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Distribution — Sector</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <BarChart title="By Sector" data={analytics.data?.sector || []} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <BarChart title="By Subsector" data={analytics.data?.subsector || []} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Market Cap Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <BarChart title="By Market Cap" data={analytics.data?.cap || []} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <PieChart 
                data={(analytics.data?.cap || []).map((item, index) => ({
                  label: item.key,
                  value: item.value,
                  color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4]
                }))} 
                size={200}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Warnings</h2>
        <Card>
          <CardBody>
            {warnSector.length === 0 && warnSubsector.length === 0 ? (
              <div className="text-sm text-zinc-600">No warnings configured thresholds breached.</div>
            ) : (
              <div className="space-y-2">
                {warnSector.map((w) => (
                  <div key={`sec-${w.key}`} className="flex items-center gap-2">
                    <Badge variant="warning">Warning</Badge>
                    <span className="text-sm text-zinc-700">High sector allocation: <strong>{w.key}</strong> — {w.value}% (&gt; 50%)</span>
                  </div>
                ))}
                {warnSubsector.map((w) => (
                  <div key={`sub-${w.key}`} className="flex items-center gap-2">
                    <Badge variant="warning">Warning</Badge>
                    <span className="text-sm text-zinc-700">High subsector allocation: <strong>{w.key}</strong> — {w.value}% (&gt; 30%)</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Recommendations</h2>
        <Card>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-zinc-700">Consider trimming any sector &gt; 50% and redeploying into underweighted sectors (&lt; 10%).</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-zinc-700">Diversify subsectors exceeding 30% by adding complementary industries.</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-zinc-700">Limit individual positions to ~5% current value unless you have high conviction.</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-zinc-700">Rebalance periodically to maintain target allocations.</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">News</h2>
        <Card>
          <CardBody>
            {!news.data || news.data.disabled ? (
              <div className="text-sm text-zinc-600">News disabled. Set NEWS_API_KEY in environment to enable.</div>
            ) : news.data.items.length === 0 ? (
              <div className="text-sm text-zinc-600">No recent news found.</div>
            ) : (
              <div className="space-y-3">
                {news.data.items.map((n, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <a 
                        className="text-sm text-indigo-600 hover:text-indigo-700 underline" 
                        href={n.url} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        {n.title}
                      </a>
                      {n.source && <span className="text-xs text-zinc-500 ml-2">— {n.source}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}




