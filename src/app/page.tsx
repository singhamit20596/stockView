export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold">stockView</h1>
          <p className="mt-4 text-lg md:text-xl opacity-90">All your investment accounts and analytics in one privacy‑first dashboard.</p>
          <div className="mt-6 flex gap-3">
            <a href="/add-account" className="px-4 py-2 bg-white text-indigo-700 rounded font-medium">Add Account</a>
            <a href="/stock-view" className="px-4 py-2 bg-black/20 rounded font-medium">Open Analytics</a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        <Feature title="Unified Portfolio" desc="Aggregate multiple broker accounts, views, and holdings with live scraping and accurate P&L." />
        <Feature title="Deep Analytics" desc="Sector, subsector, and market‑cap allocations; warnings and recommendations to rebalance risk." />
        <Feature title="Local & Private" desc="Data stays on your machine in JSON files; no external server required." />
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-semibold">What problem does stockView solve?</h2>
            <p className="mt-3 text-gray-700">Managing multiple investment accounts is messy: scattered statements, inconsistent summaries, and manual tracking. stockView centralizes accounts, computes accurate metrics, and surfaces insights to help you make better allocation decisions.</p>
            <ul className="mt-4 list-disc pl-5 text-gray-700 text-sm space-y-1">
              <li>Combine holdings from multiple brokers into unified views</li>
              <li>See real‑time allocations by sector, subsector, and market cap</li>
              <li>Get warnings when concentration risk exceeds thresholds</li>
              <li>Scan latest news for your holdings</li>
            </ul>
          </div>
          <div className="border rounded p-6 bg-white shadow-sm">
            <h3 className="font-medium">Capabilities</h3>
            <ul className="mt-3 text-sm text-gray-700 space-y-1">
              <li>• Add Account wizard with live scraping (Groww)</li>
              <li>• Create Views across accounts; correct weighted averages</li>
              <li>• Analytics dashboard with distribution charts</li>
              <li>• Logging, backups, and JSON DB</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold">About Us</h2>
          <p className="mt-3 text-gray-700">We are builders focused on pragmatic, privacy‑first finance tools. stockView is crafted to be robust, simple, and transparent—so you can trust your numbers and focus on decisions.</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="mt-3 text-gray-700 text-sm">Have feedback, feature ideas, or want to collaborate?</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div>Email: <a className="underline" href="mailto:hello@example.com">hello@example.com</a></div>
            <div>GitHub: <a className="underline" href="https://github.com/singhamit20596/stockView" target="_blank" rel="noreferrer">/stockView</a></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border rounded p-5 bg-white">
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-sm text-gray-700">{desc}</div>
    </div>
  );
}
